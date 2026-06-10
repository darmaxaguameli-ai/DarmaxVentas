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

router.delete('/product-categories/:id', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
    try {
        await prisma.productCategory.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting category' });
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

router.post('/products', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
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

router.put('/products/:id', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
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

router.delete('/products/:id', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso denegado.' });
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' });
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
    const jugBrands = await prisma.jugBrand.findMany({ include: { compatibleCap: true }, orderBy: { name: 'asc' } });
    res.json(jugBrands);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching jug brands' });
  }
});

router.post('/jug-brands', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    const { name, imageUrl, compatibleCapId } = req.body;
    const jugBrand = await prisma.jugBrand.create({
      data: { name, imageUrl, compatibleCapId }
    });
    res.status(201).json(jugBrand);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear marca de garrafón' });
  }
});

router.put('/jug-brands/:id', verifyToken, requirePermission('canAccessInventory'), async (req, res) => {
  try {
    const { name, imageUrl, compatibleCapId } = req.body;
    const jugBrand = await prisma.jugBrand.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        compatibleCapId: compatibleCapId !== undefined ? compatibleCapId : undefined
      }
    });
    res.json(jugBrand);
  } catch (error) {
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
