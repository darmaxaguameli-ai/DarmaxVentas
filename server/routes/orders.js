const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken, checkDemoRole, requirePermission } = require('../middleware/auth');
const { contabilizarVentaPOS, findEmpresaByStore } = require('../utils/accountingAutomations');

// GET all orders (restricted to staff)
router.get('/pedidos', verifyToken, requirePermission('canAccessOrders'), async (req, res) => {
  try {
    const { role } = req.user;
    const user = req.fullUser;
    const where = {};
    const isAdmin = role === 'ADMIN' || user.roles.some(r => r.name.toUpperCase().trim() === 'ADMIN');
    
    if (!isAdmin) {
        if (user.storeId) where.storeId = user.storeId;
        else return res.json([]); 
    }
    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: true,
        items: { include: { product: true, servicePrice: { include: { waterType: true, jugBrands: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al obtener los pedidos.' });
  }
});

// POST a new order (Public or authenticated)
router.post('/pedidos', async (req, res) => {
  let { clienteId, items, total, deliveryMethod, paymentMethod, paymentStatus, storeId, pointsUsed } = req.body;
  if (!items || total === undefined || total === null || !deliveryMethod) {
    return res.status(400).json({ error: 'Faltan datos requeridos para crear el pedido.' });
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Garantizar que el total y otros valores numéricos sean Float/Int
      const totalFloat = parseFloat(total) || 0;
      const pointsInt = Math.round(pointsUsed || 0);

      if (!storeId) {
          if (clienteId) {
               const client = await tx.user.findUnique({ where: { id: clienteId } });
               if (client && client.storeId) storeId = client.storeId;
          }
          if (!storeId) {
               const firstStore = await tx.store.findFirst();
               if (firstStore) storeId = firstStore.id;
               else throw new Error('No hay sucursales configuradas en el sistema.');
          }
      }
      
      if (pointsInt > 0) {
          if (!clienteId) throw new Error('Se requiere estar identificado para usar puntos de lealtad.');
          const client = await tx.user.findUnique({ where: { id: clienteId } });
          if (!client) throw new Error('Cliente no encontrado para el canje de puntos.');
          if (client.loyaltyPoints < pointsInt) throw new Error(`Puntos insuficientes. Tienes ${client.loyaltyPoints} y requieres ${pointsInt}.`);
          
          await tx.user.update({ 
            where: { id: clienteId }, 
            data: { loyaltyPoints: { decrement: pointsInt } } 
          });
      }

      if (!clienteId) {
        let guestCustomId;
        let isIdUnique = false;
        while (!isIdUnique) {
          const random = String(Math.floor(Math.random() * 9000) + 1000);
          guestCustomId = `INV-${random}`;
          const existingUser = await tx.user.findUnique({ where: { customId: guestCustomId } });
          if (!existingUser) isIdUnique = true;
        }
        const guestUser = await tx.user.create({ 
          data: { 
            name: 'Invitado', 
            customId: guestCustomId, 
            role: 'CLIENTE', 
            type: 'CLIENTE',
            store: { connect: { id: storeId } } 
          } 
        });
        clienteId = guestUser.id;
      }
      
      let customId;
      let isPedidoIdUnique = false;
      while (!isPedidoIdUnique) {
        const random = String(Math.floor(Math.random() * 90000) + 10000);
        customId = `ORD-${random}`;
        const existingPedido = await tx.pedido.findUnique({ where: { customId } });
        if (!existingPedido) isPedidoIdUnique = true;
      }

      const newPedido = await tx.pedido.create({
        data: {
          customId, 
          total: totalFloat, 
          deliveryMethod, 
          paymentMethod: paymentMethod || 'Efectivo', 
          paymentStatus: paymentStatus || 'NO_PAGADO',
          status: 'PENDIENTE',
          cliente: { connect: { id: clienteId } }, 
          store: { connect: { id: storeId } },
          sesionCaja: req.body.sesionCajaId ? { connect: { id: req.body.sesionCajaId } } : undefined,
          deliveryLat: req.body.deliveryLat ? parseFloat(req.body.deliveryLat) : undefined,
          deliveryLng: req.body.deliveryLng ? parseFloat(req.body.deliveryLng) : undefined,
          deliveryTimeSlot: req.body.deliveryTimeSlot || null,
          promotionId: req.body.promotionId || null, 
        },
      });

      if (paymentStatus === 'PAGADO' && req.body.sesionCajaId) {
          await tx.transaccionCaja.create({ 
            data: { 
                tipo: 'VENTA', 
                amount: totalFloat, 
                description: `Venta ${customId}`, 
                sesion: { connect: { id: req.body.sesionCajaId } }, 
                pedido: { connect: { id: newPedido.id } } 
            } 
          });
      }

      if (pointsInt > 0) {
          await tx.loyaltyTransaction.create({ 
            data: { 
                amount: -pointsInt, 
                type: 'REDEEMED', 
                description: `Canje en pedido ${customId}`, 
                orderId: newPedido.id, 
                user: { connect: { id: clienteId } } 
            } 
          });
      }

      const pedidoItemsData = items.map(item => {
        return {
          pedidoId: newPedido.id, 
          quantity: parseInt(item.quantity) || 0, 
          price: parseFloat(item.price) || 0, 
          servicePriceId: item.servicePriceId || null,
          jugBrandId: item.jugBrandId || null, 
          jugBrandName: String(item.jugBrandName || item.name || 'Producto sin nombre'), 
          jugBrandImageUrl: item.jugBrandImageUrl || item.imageUrl || null, 
          productId: item.productId || null
        };
      });

      for (const item of pedidoItemsData) {
          await tx.pedidoItem.create({ data: item });

          // --- LÓGICA DE DESCUENTO DE INVENTARIO (TAPAS Y PRODUCTOS) ---
          const qty = item.quantity;
          if (qty > 0) {
              // 1. Descontar Tapa compatible si el garrafón tiene una asociada
              if (item.jugBrandId) {
                  const brand = await tx.jugBrand.findUnique({
                      where: { id: item.jugBrandId },
                      select: { compatibleCapId: true }
                  });

                  if (brand && brand.compatibleCapId) {
                      const inv = await tx.storeInventory.findUnique({
                          where: { storeId_productId: { storeId, productId: brand.compatibleCapId } }
                      });
                      // Solo descontar si hay stock y no permitir negativos (según requerimiento)
                      if (inv && inv.stock > 0) {
                          const toDeduct = Math.min(inv.stock, qty);
                          await tx.storeInventory.update({
                              where: { id: inv.id },
                              data: { stock: { decrement: toDeduct } }
                          });
                      }
                  }
              }

              // 2. Descontar Producto (para artículos de la tienda o envases nuevos)
              if (item.productId) {
                  const inv = await tx.storeInventory.findUnique({
                      where: { storeId_productId: { storeId, productId: item.productId } }
                  });
                  if (inv && inv.stock > 0) {
                      const toDeduct = Math.min(inv.stock, qty);
                      await tx.storeInventory.update({
                          where: { id: inv.id },
                          data: { stock: { decrement: toDeduct } }
                      });
                  }
              }
          }
      }

      if (totalFloat > 0) {
        await tx.ingreso.create({ 
            data: { 
                description: `Ingreso por Pedido ${customId}`, 
                amount: totalFloat, 
                date: new Date(), 
                pedido: { connect: { id: newPedido.id } },
                store: { connect: { id: storeId } }
            } 
        });

      }
  
      // Actualizar la fecha de última compra del cliente
      if (clienteId) {
        await tx.user.update({
          where: { id: clienteId },
          data: { lastPurchaseDate: new Date() }
        });
      }

      return newPedido;
    });

    // --- AL FINAL DEL POS POST (FUERA DE LA TRANSACCIÓN PARA NO BLOQUEAR) ---
    try {
        const empresaId = await findEmpresaByStore(storeId);
        if (empresaId) {
            await contabilizarVentaPOS(result, empresaId);
        }
    } catch (e) {
        console.error('[Accounting] Error en contabilización automática POS:', e);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('ERROR AL CREAR PEDIDO:', error);
    res.status(500).json({ error: 'Error al crear pedido', details: error.message });
  }
});

// PUT to update order status (Staff only)
router.put('/pedidos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status, paymentMethod, repartidorId } = req.body;
  
  // BOLA: Verificar si es staff o el dueño del pedido
  const user = req.fullUser;
  const isStaff = user.role === 'ADMIN' || user.roles.some(r => r.canAccessPOS || r.canAccessDelivery || r.canAccessOrders);
  
  if (!status) return res.status(400).json({ error: 'El estado es requerido.' });
  
  try {
    const updatedPedido = await prisma.$transaction(async (tx) => {
      const existingPedido = await tx.pedido.findUnique({ where: { id } });
      if (!existingPedido) throw new Error('Pedido no encontrado.');

      if (!isStaff && existingPedido.clienteId !== user.id) {
          throw new Error('No tienes permiso para modificar este pedido.');
      }

      const dataToUpdate = { status };
      if (paymentMethod) dataToUpdate.paymentMethod = paymentMethod;
      if (repartidorId !== undefined) {
          if (repartidorId) dataToUpdate.repartidor = { connect: { id: repartidorId } };
          else dataToUpdate.repartidor = { disconnect: true };
      }
      if (status === 'ENTREGADO') dataToUpdate.paymentStatus = 'PAGADO';
      
      const pedido = await tx.pedido.update({
        where: { id }, data: dataToUpdate,
        include: { cliente: true, items: { include: { product: true, servicePrice: { include: { waterType: true, jugBrands: true } } } } },
      });
      
      if (status === 'ENTREGADO' && existingPedido.status !== 'ENTREGADO') {
          const pointsEarned = Math.floor(existingPedido.total / 10);
          if (pointsEarned > 0) {
              await tx.user.update({ where: { id: existingPedido.clienteId }, data: { loyaltyPoints: { increment: pointsEarned } } });
              await tx.loyaltyTransaction.create({ data: { amount: pointsEarned, type: 'EARNED', description: `Puntos ${existingPedido.customId}`, orderId: id, user: { connect: { id: existingPedido.clienteId } } } });
          }
      }
      return pedido;
    });
    res.json(updatedPedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET my orders
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { clienteId: req.user.id },
      include: { items: { include: { product: true, servicePrice: { include: { waterType: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching my orders' });
  }
});

module.exports = router;
