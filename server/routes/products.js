const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken, requirePermission } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// --- HELPER: Ensure Category Exists ---
const ensureCategory = async (categoryName) => {
    if (!categoryName) return null;
    let cat = await prisma.productCategory.findUnique({ where: { name: categoryName } });
    if (!cat) {
        cat = await prisma.productCategory.create({ data: { name: categoryName, isPublic: true } });
    }
    return cat;
};

// --- PRODUCT CATEGORIES (CRUD) ---
router.get('/product-categories', async (req, res) => {
    try {
        const categories = await prisma.productCategory.findMany({ orderBy: { name: 'asc' } });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching categories' });
    }
});

router.post('/product-categories', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
    try {
        const { name, isPublic, icon } = req.body;
        const category = await prisma.productCategory.create({
            data: { name, isPublic: isPublic ?? true, icon }
        });
        res.status(201).json(category);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Ya existe una categoría con ese nombre.' });
        res.status(500).json({ error: 'Error creating category' });
    }
});

router.put('/product-categories/:id', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
    try {
        const category = await prisma.productCategory.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Error updating category' });
    }
});

router.delete('/product-categories/:id', verifyToken, requirePermission(['canAccessInventory', 'canAccessConfig', 'acceso.inventarioparainstalacion', 'acceso.articulosventa']), async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.productCategory.findUnique({ where: { id } });
        if (!category) {
            return res.status(404).json({ error: 'Categoría no encontrada.' });
        }

        // Validar si existen artículos comerciales asociados por categoryId o por nombre
        const productsCount = await prisma.product.count({
            where: {
                OR: [
                    { categoryId: id },
                    { category: category.name }
                ]
            }
        });

        if (productsCount > 0) {
            return res.status(400).json({ 
                error: `No se puede eliminar la categoría "${category.name}" porque tiene ${productsCount} ${productsCount === 1 ? 'artículo asociado' : 'artículos asociados'}. Para eliminarla no debe tener artículos asociados.` 
            });
        }

        await prisma.productCategory.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ error: 'Error deleting category', details: error.message });
    }
});

router.post('/product-categories/batch-delete', verifyToken, requirePermission(['canAccessInventory', 'canAccessConfig', 'acceso.inventarioparainstalacion', 'acceso.articulosventa']), async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un arreglo de IDs a eliminar.' });
        }

        const categories = await prisma.productCategory.findMany({
            where: { id: { in: ids } }
        });

        const deleted = [];
        const blocked = [];

        for (const category of categories) {
            const count = await prisma.product.count({
                where: {
                    OR: [
                        { categoryId: category.id },
                        { category: category.name }
                    ]
                }
            });

            if (count > 0) {
                blocked.push({ id: category.id, name: category.name, count });
            } else {
                await prisma.productCategory.delete({ where: { id: category.id } });
                deleted.push(category.id);
            }
        }

        if (blocked.length > 0 && deleted.length === 0) {
            return res.status(400).json({
                error: `No se pudieron eliminar las categorías seleccionadas porque tienen artículos asociados.`,
                blocked
            });
        }

        res.json({
            success: true,
            deletedCount: deleted.length,
            deletedIds: deleted,
            blocked
        });
    } catch (error) {
        console.error('Error al eliminar categorías en lote:', error);
        res.status(500).json({ error: 'Error al eliminar categorías en lote', details: error.message });
    }
});

// --- PRODUCTS ---
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ 
        include: { categoryRel: true },
        orderBy: { name: 'asc' } 
    });

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let storeId = null;
    let isManagement = false;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            isManagement = ['ADMIN', 'VENDEDOR', 'VENTA'].includes(decoded.role);
            if (decoded.role !== 'ADMIN') {
                const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { storeId: true } });
                storeId = user?.storeId;
            }
        } catch (err) {}
    }

    // Filtrar para tienda (Clientes / Público) si no es gestión
    let finalProducts = products;
    if (!isManagement) {
        finalProducts = products.filter(p => p.isPublic && (!p.categoryRel || p.categoryRel.isPublic));
    }

    if (storeId) {
        const storeInventory = await prisma.storeInventory.findMany({ where: { storeId } });
        const inventoryMap = new Map();
        storeInventory.forEach(item => inventoryMap.set(item.productId, item.stock));
        finalProducts = finalProducts.map(p => ({ ...p, stock: inventoryMap.get(p.id) || 0 }));
    }
    
    res.json(finalProducts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

router.post('/products', verifyToken, requirePermission(['canAccessInventory', 'canAccessConfig', 'acceso.inventarioparainstalacion', 'acceso.articulosventa']), async (req, res) => {
  try {
    const { category, ...data } = req.body;
    const catRecord = await ensureCategory(category);
    
    const newProduct = await prisma.product.create({ 
        data: { 
            ...data, 
            category: category,
            categoryId: catRecord?.id 
        } 
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error creating product' });
  }
});

// ✅ NUEVO: ENDPOINT DE CARGA MASIVA
router.post('/products/bulk', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ error: 'Se espera un arreglo de productos' });

    const results = [];
    for (const p of products) {
        const catRecord = await ensureCategory(p.category);
        const created = await prisma.product.create({
            data: {
                name: String(p.name).toUpperCase().trim(),
                price: parseFloat(p.price) || 0,
                stock: parseInt(p.stock) || 0,
                waterPrice: parseFloat(p.waterPrice) || 0,
                imageUrl: p.imageUrl || null,
                category: p.category || "General",
                categoryId: catRecord?.id,
                status: 'ACTIVE',
                isPublic: false // 🔒 PROTECCIÓN: Entran como internos
            }
        });
        results.push(created);
    }
    
    res.status(201).json({ count: results.length, message: 'Carga masiva completada con éxito' });
  } catch (error) {
    console.error("Error en bulk import:", error);
    res.status(500).json({ error: 'Error durante la carga masiva' });
  }
});

router.put('/products/:id', verifyToken, requirePermission(['canAccessInventory', 'canAccessConfig', 'acceso.inventarioparainstalacion', 'acceso.articulosventa']), async (req, res) => {
  const { id: productId } = req.params;
  const { stock, category, ...rawData } = req.body;
  
  try {
    const catRecord = await ensureCategory(category);
    const productData = {
        category: category,
        categoryId: catRecord?.id
    };

    if (rawData.name !== undefined) productData.name = String(rawData.name);
    if (rawData.price !== undefined) productData.price = parseFloat(rawData.price) || 0;
    if (rawData.waterPrice !== undefined) productData.waterPrice = parseFloat(rawData.waterPrice) || 0;
    if (rawData.imageUrl !== undefined) productData.imageUrl = rawData.imageUrl || null;
    if (rawData.status !== undefined) productData.status = rawData.status || "ACTIVE";
    if (rawData.isPublic !== undefined) productData.isPublic = !!rawData.isPublic;

    // Use req.fullUser from verifyToken
    const user = req.fullUser;
    let storeId = null;
    if (user.role !== 'ADMIN') storeId = user.storeId;

    const result = await prisma.$transaction(async (tx) => {
        let updatedProduct;
        updatedProduct = await tx.product.update({ where: { id: productId }, data: productData });
        
        if (stock !== undefined && stock !== null && stock !== "") {
            const numStock = parseInt(stock);
            if (!isNaN(numStock)) {
                if (storeId) {
                    await tx.storeInventory.upsert({
                        where: { storeId_productId: { storeId, productId } },
                        update: { stock: numStock },
                        create: { storeId, productId, stock: numStock }
                    });
                    updatedProduct = { ...updatedProduct, stock: numStock };
                } else {
                    updatedProduct = await tx.product.update({ where: { id: productId }, data: { stock: numStock } });
                }
            }
        }
        return updatedProduct;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error updating product' });
  }
});

router.delete('/products/:id', verifyToken, requirePermission(['canAccessInventory', 'canAccessConfig', 'acceso.inventarioparainstalacion', 'acceso.articulosventa']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.storeInventory.deleteMany({ where: { productId: id } });
      await tx.modelMaterial.deleteMany({ where: { productId: id } });
      await tx.jugBrand.updateMany({ where: { compatibleCapId: id }, data: { compatibleCapId: null } });
      await tx.promotion.updateMany({ where: { giveawayProductId: id }, data: { giveawayProductId: null } });
      await tx.pedidoItem.updateMany({ where: { productId: id }, data: { productId: null } });
      await tx.product.deleteMany({ where: { id } });
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar producto comercial:', error);
    res.status(500).json({ error: 'Error deleting product', details: error.message });
  }
});

// Endpoint para eliminación masiva atómica (de golpe)
router.post('/products/batch-delete', verifyToken, requirePermission(['canAccessInventory', 'canAccessConfig', 'acceso.inventarioparainstalacion', 'acceso.articulosventa']), async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Se requiere una lista de IDs para eliminar.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.storeInventory.deleteMany({ where: { productId: { in: ids } } });
      await tx.modelMaterial.deleteMany({ where: { productId: { in: ids } } });
      await tx.jugBrand.updateMany({ where: { compatibleCapId: { in: ids } }, data: { compatibleCapId: null } });
      await tx.promotion.updateMany({ where: { giveawayProductId: { in: ids } }, data: { giveawayProductId: null } });
      await tx.pedidoItem.updateMany({ where: { productId: { in: ids } }, data: { productId: null } });
      await tx.product.deleteMany({ where: { id: { in: ids } } });
    });
    res.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('Error al eliminar productos en lote:', error);
    res.status(500).json({ error: 'Error al eliminar productos en lote', details: error.message });
  }
});

// --- WATER TYPES ---
router.get('/water-types', async (req, res) => {
  try {
    const waterTypes = await prisma.waterType.findMany({ orderBy: { name: 'asc' } });
    res.json(waterTypes);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching water types' });
  }
});

router.post('/water-types', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    const { name } = req.body;
    const waterType = await prisma.waterType.create({ data: { name } });
    res.status(201).json(waterType);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear tipo de agua' });
  }
});

router.put('/water-types/:id', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    const { name } = req.body;
    const waterType = await prisma.waterType.update({ where: { id: req.params.id }, data: { name } });
    res.json(waterType);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar tipo de agua' });
  }
});

router.delete('/water-types/:id', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    await prisma.waterType.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar tipo de agua' });
  }
});

// --- SERVICE PRICES ---
router.get('/service-prices', async (req, res) => {
  try {
    const servicePrices = await prisma.servicePrice.findMany({ 
      include: { waterType: true, jugBrands: true },
      orderBy: { price: 'asc' } 
    });
    res.json(servicePrices);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching service prices' });
  }
});

router.post('/service-prices', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    const { name, method, price, waterTypeId } = req.body;
    const servicePrice = await prisma.servicePrice.create({
      data: { name, method, price: parseFloat(price), waterTypeId }
    });
    res.status(201).json(servicePrice);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear precio de servicio' });
  }
});

router.put('/service-prices/:id', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    const { name, method, price, waterTypeId } = req.body;
    const servicePrice = await prisma.servicePrice.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        method: method || undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        waterTypeId: waterTypeId !== undefined ? waterTypeId : undefined
      }
    });
    res.json(servicePrice);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar precio de servicio' });
  }
});

router.delete('/service-prices/:id', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    await prisma.servicePrice.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar precio de servicio' });
  }
});

// --- JUG BRANDS ---
router.get('/jug-brands', async (req, res) => {
  try {
    const jugBrands = await prisma.jugBrand.findMany({ 
      include: { compatibleCap: true }, 
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ] 
    });
    res.json(jugBrands);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching jug brands' });
  }
});

router.put('/jug-brands-reorder', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds debe ser un array de IDs' });
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.jugBrand.update({
          where: { id },
          data: { order: index + 1 }
        })
      )
    );

    const updatedBrands = await prisma.jugBrand.findMany({
      include: { compatibleCap: true },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(updatedBrands);
  } catch (error) {
    console.error('Error al reordenar marcas de garrafón:', error);
    res.status(500).json({ error: 'Error al reordenar marcas de garrafón' });
  }
});

router.post('/jug-brands', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    const { 
      name, 
      imageUrl, 
      compatibleCapId,
      capStock,
      capCost,
      capSize,
      linerStock,
      linerCost,
      linerSize,
      order
    } = req.body;

    let brandOrder = order !== undefined ? parseInt(order, 10) || 0 : undefined;
    if (brandOrder === undefined) {
      const maxOrder = await prisma.jugBrand.aggregate({ _max: { order: true } });
      brandOrder = (maxOrder._max.order || 0) + 1;
    }

    const jugBrand = await prisma.jugBrand.create({
      data: { 
        name, 
        imageUrl: imageUrl || null, 
        order: brandOrder,
        compatibleCapId: compatibleCapId || null,
        capStock: capStock !== undefined ? parseInt(capStock, 10) || 0 : 0,
        capCost: capCost !== undefined ? parseFloat(capCost) || 0 : 0,
        capSize: capSize ? String(capSize).trim() : null,
        linerStock: linerStock !== undefined ? parseInt(linerStock, 10) || 0 : 0,
        linerCost: linerCost !== undefined ? parseFloat(linerCost) || 0 : 0,
        linerSize: linerSize ? String(linerSize).trim() : null
      }
    });
    res.status(201).json(jugBrand);
  } catch (error) {
    console.error('Error al crear marca de garrafón:', error);
    res.status(500).json({ error: 'Error al crear marca de garrafón' });
  }
});

router.put('/jug-brands/:id', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    const { 
      name, 
      imageUrl, 
      compatibleCapId,
      capStock,
      capCost,
      capSize,
      linerStock,
      linerCost,
      linerSize,
      order
    } = req.body;

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl || null;
    if (order !== undefined) dataToUpdate.order = parseInt(order, 10) || 0;
    if (compatibleCapId !== undefined) dataToUpdate.compatibleCapId = compatibleCapId || null;
    if (capStock !== undefined) dataToUpdate.capStock = parseInt(capStock, 10) || 0;
    if (capCost !== undefined) dataToUpdate.capCost = parseFloat(capCost) || 0;
    if (capSize !== undefined) dataToUpdate.capSize = capSize ? String(capSize).trim() : null;
    if (linerStock !== undefined) dataToUpdate.linerStock = parseInt(linerStock, 10) || 0;
    if (linerCost !== undefined) dataToUpdate.linerCost = parseFloat(linerCost) || 0;
    if (linerSize !== undefined) dataToUpdate.linerSize = linerSize ? String(linerSize).trim() : null;

    const jugBrand = await prisma.jugBrand.update({
      where: { id: req.params.id },
      data: dataToUpdate
    });
    res.json(jugBrand);
  } catch (error) {
    console.error('Error al actualizar marca de garrafón:', error);
    res.status(500).json({ error: 'Error al actualizar marca de garrafón' });
  }
});

router.delete('/jug-brands/:id', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    await prisma.jugBrand.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar marca de garrafón' });
  }
});

module.exports = router;
