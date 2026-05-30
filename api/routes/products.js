const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
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
        // ... (lógica de auto-sync existente)
        const categories = await prisma.productCategory.findMany({ orderBy: { name: 'asc' } });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching categories' });
    }
});

router.post('/product-categories', verifyToken, async (req, res) => {
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

router.put('/product-categories/:id', verifyToken, async (req, res) => {
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

router.post('/products', verifyToken, async (req, res) => {
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

router.put('/products/:id', verifyToken, async (req, res) => {
  const { id: productId } = req.params;
  const { stock, category, ...rawData } = req.body;
  const { id: userId, role } = req.user;
  
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

    let storeId = null;
    if (role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { storeId: true } });
        storeId = user?.storeId;
    }
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

router.delete('/products/:id', verifyToken, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// --- WATER TYPES, SERVICE PRICES, JUG BRANDS ---
router.get('/water-types', async (req, res) => {
  try {
    const waterTypes = await prisma.waterType.findMany({ orderBy: { name: 'asc' } });
    res.json(waterTypes);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching water types' });
  }
});

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

router.get('/jug-brands', async (req, res) => {
  try {
    const jugBrands = await prisma.jugBrand.findMany({ include: { compatibleCap: true }, orderBy: { name: 'asc' } });
    res.json(jugBrands);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching jug brands' });
  }
});

module.exports = router;
