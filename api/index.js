const express = require('express');
const prisma = require('./lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // <-- Importar axios
require('dotenv').config();

const app = express();
const port = 3001; // Or any port you prefer

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ------------------------------
// HEALTHCHECK
// ------------------------------
app.get('/api/health', (req, res) => {
  res.send('Server is running!');
});

// =====================================================
// AUTH API
// =====================================================
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Este usuario no tiene una contraseña configurada.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // --- Generar JWT ---
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // El token expira en 8 horas
    );

    // No devolver el hash de la contraseña
    const { password: _, ...userWithoutPassword } = user;
    
    // Devolver token y datos del usuario
    res.json({ user: userWithoutPassword, token });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Ocurrió un error en el servidor.' });
  }
});

// --- Geocoding Function ---
const geocodeAddress = async (address) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'DarmaxApp/1.0 (erick.rendon@galavi.com)' // Política de uso de Nominatim
      }
    });

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon),
      };
    }
    return { lat: null, lng: null };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return { lat: null, lng: null };
  }
};


// Endpoint público para registrar un cliente durante el flujo de pedido
app.post('/api/register-client', async (req, res) => {
  try {
    const data = req.body;

    if (!data.name || !data.phone) {
      return res.status(400).json({ error: 'Nombre y teléfono son requeridos.' });
    }

    // Comprobar si el teléfono ya existe
    const existingPhone = await prisma.user.findUnique({
        where: { phone: data.phone },
    });
    if (existingPhone) {
        return res.status(409).json({ error: 'Este número de teléfono ya está registrado. Por favor, inicia sesión o usa otro número.' });
    }
    
    // --- Geocodificación de la dirección ---
    let coordinates = { lat: null, lng: null };
    if (data.street && data.city) {
        const fullAddress = `${data.street}, ${data.neighborhood || ''}, ${data.city}, ${data.postalCode || ''}`;
        coordinates = await geocodeAddress(fullAddress);
    }

    const userData = {
      name: data.name,
      phone: data.phone,
      street: data.street || null,
      neighborhood: data.neighborhood || null,
      city: data.city || null,
      postalCode: data.postalCode || null,
      references: data.references || null,
      lat: coordinates.lat, // <-- Guardar latitud
      lng: coordinates.lng, // <-- Guardar longitud
      role: 'CLIENTE',
    };

    // Generar un customId único
    let customId;
    let isIdUnique = false;
    while (!isIdUnique) {
      const rolePrefix = 'CLI';
      const random = String(Math.floor(Math.random() * 9000) + 1000);
      customId = `${rolePrefix}-${random}`;
      const existingUser = await prisma.user.findUnique({ where: { customId } });
      if (!existingUser) {
        isIdUnique = true;
      }
    }
    
    const newUser = await prisma.user.create({
      data: {
        ...userData,
        customId,
      },
    });

    const { password, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating client user:', error);
    res.status(500).json({
      error: 'Error al registrar el cliente.',
      message: error.message,
    });
  }
});


// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Error al verificar el token:', err);
      return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
    req.user = decoded; // Añade el payload del token (id, name, role) a la request
    next();
  });
};


// =====================================================
// PRODUCTS API (Formerly PRODUCTOS)
// =====================================================

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Error fetching products',
      message: error.message,
      code: error.code,
    });
  }
});

// POST a new product
app.post('/api/products', verifyToken, async (req, res) => {
  try {
    const newProduct = await prisma.product.create({
      data: req.body,
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error creating product' });
  }
});

// PUT to update a product
app.put('/api/products/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: req.body,
    });
    res.json(updatedProduct);
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Error updating product' });
  }
});

// DELETE a product
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({
      where: { id },
    });
    res.status(204).send(); // No content
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// =====================================================
// BUSINESS CONFIGURATION APIS
// =====================================================

// --- WATER TYPES API ---
app.get('/api/water-types', async (req, res) => {
  try {
    const waterTypes = await prisma.waterType.findMany({ orderBy: { name: 'asc' } });
    res.json(waterTypes);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching water types' });
  }
});
app.post('/api/water-types', verifyToken, async (req, res) => {
  try {
    const waterType = await prisma.waterType.create({ data: req.body });
    res.status(201).json(waterType);
  } catch (error) {
    res.status(500).json({ error: 'Error creating water type' });
  }
});
app.put('/api/water-types/:id', verifyToken, async (req, res) => {
  try {
    const waterType = await prisma.waterType.update({ where: { id: req.params.id }, data: req.body });
    res.json(waterType);
  } catch (error) {
    res.status(500).json({ error: 'Error updating water type' });
  }
});
app.delete('/api/water-types/:id', verifyToken, async (req, res) => {
  try {
    await prisma.waterType.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting water type' });
  }
});

// --- SERVICE PRICES API ---
app.get('/api/service-prices', async (req, res) => {
  try {
    const servicePrices = await prisma.servicePrice.findMany({ 
      include: { waterType: true, jugBrands: true }, // Incluir también las marcas de garrafón
      orderBy: { price: 'asc' } 
    });
    res.json(servicePrices);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching service prices' });
  }
});
app.post('/api/service-prices', verifyToken, async (req, res) => {
  try {
    const { waterTypeId, jugBrandIds, ...rest } = req.body;
    const data = { ...rest };
    
    if (waterTypeId) {
      data.waterType = { connect: { id: waterTypeId } };
    }
    if (jugBrandIds && jugBrandIds.length > 0) {
      data.jugBrands = { connect: jugBrandIds.map(id => ({ id })) };
    }

    const servicePrice = await prisma.servicePrice.create({ data, include: { jugBrands: true, waterType: true } });
    res.status(201).json(servicePrice);
  } catch (error) {
    console.error('Error creating service price:', error);
    res.status(500).json({ error: 'Error creating service price', details: error.message });
  }
});
app.put('/api/service-prices/:id', verifyToken, async (req, res) => {
  try {
    const { name, method, price, waterTypeId, jugBrandIds } = req.body;

    // Construir explícitamente el payload para asegurar que las relaciones se manejen bien
    const dataForUpdate = {
      name,
      method,
      price,
      waterType: waterTypeId ? { connect: { id: waterTypeId } } : { disconnect: true },
      jugBrands: { set: jugBrandIds ? jugBrandIds.map(id => ({ id })) : [] }
    };

    const servicePrice = await prisma.servicePrice.update({ 
      where: { id: req.params.id }, 
      data: dataForUpdate,
      include: { jugBrands: true, waterType: true }
    });
    res.json(servicePrice);
  } catch (error) {
    console.error(`Error updating service price ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error updating service price', details: error.message });
  }
});
app.delete('/api/service-prices/:id', verifyToken, async (req, res) => {
  try {
    await prisma.servicePrice.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting service price' });
  }
});

// --- JUG BRANDS API ---
app.get('/api/jug-brands', async (req, res) => {
  try {
    const jugBrands = await prisma.jugBrand.findMany({ include: { compatibleCap: true }, orderBy: { name: 'asc' } });
    res.json(jugBrands);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching jug brands' });
  }
});
app.post('/api/jug-brands', verifyToken, async (req, res) => {
  try {
    const { compatibleCapId, ...rest } = req.body;
    const data = compatibleCapId ? { ...rest, compatibleCap: { connect: { id: compatibleCapId } } } : rest;
    const jugBrand = await prisma.jugBrand.create({ data });
    res.status(201).json(jugBrand);
  } catch (error) {
    res.status(500).json({ error: 'Error creating jug brand' });
  }
});
app.put('/api/jug-brands/:id', verifyToken, async (req, res) => {
  try {
    const { compatibleCapId, ...rest } = req.body;
    const data = compatibleCapId ? { ...rest, compatibleCap: { connect: { id: compatibleCapId } } } : { ...rest, compatibleCapId: null };
    const jugBrand = await prisma.jugBrand.update({ where: { id: req.params.id }, data });
    res.json(jugBrand);
  } catch (error) {
    res.status(500).json({ error: 'Error updating jug brand' });
  }
});
app.delete('/api/jug-brands/:id', verifyToken, async (req, res) => {
  try {
    await prisma.jugBrand.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting jug brand' });
  }
});

// =====================================================
// INGRESOS API  (income)
// =====================================================

// GET all incomes
app.get('/api/incomes', verifyToken, async (req, res) => {
  try {
    const incomes = await prisma.ingreso.findMany();
    res.json(incomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ error: 'Error fetching incomes' });
  }
});

// POST a new income
app.post('/api/incomes', verifyToken, async (req, res) => {
  try {
    const { date, ...rest } = req.body;
    const newIncome = await prisma.ingreso.create({
      data: {
        ...rest,
        date: new Date(date),
      },
    });
    res.status(201).json(newIncome);
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ error: 'Error creating income' });
  }
});

// PUT to update income
app.put('/api/incomes/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { date, ...rest } = req.body;
    const data = date ? { ...rest, date: new Date(date) } : rest;
    const updatedIncome = await prisma.ingreso.update({
      where: { id },
      data: data,
    });
    res.json(updatedIncome);
  } catch (error) {
    console.error(`Error updating income ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Income not found' });
    }
    res.status(500).json({ error: 'Error updating income' });
  }
});

// DELETE income
app.delete('/api/incomes/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.ingreso.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting income ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Income not found' });
    }
    res.status(500).json({ error: 'Error deleting income' });
  }
});

// =====================================================
// GASTOS API (expenses)
// =====================================================

app.get('/api/expenses', verifyToken, async (req, res) => {
  try {
    const expenses = await prisma.gasto.findMany();
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Error fetching expenses' });
  }
});

app.post('/api/expenses', verifyToken, async (req, res) => {
  try {
    const { date, ...rest } = req.body;
    const newExpense = await prisma.gasto.create({
      data: {
        ...rest,
        date: new Date(date + 'T12:00:00Z'), // Interpretar la fecha como mediodía UTC
      },
    });
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Error creating expense' });
  }
});

app.put('/api/expenses/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { date, ...rest } = req.body;
    const data = date ? { ...rest, date: new Date(date + 'T12:00:00Z') } : rest; // Interpretar la fecha como mediodía UTC
    const updatedExpense = await prisma.gasto.update({
      where: { id },
      data: data,
    });
    res.json(updatedExpense);
  } catch (error) {
    console.error(`Error updating expense ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(500).json({ error: 'Error updating expense' });
  }
});

app.delete('/api/expenses/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.gasto.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting expense ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(500).json({ error: 'Error deleting expense' });
  }
});

// =====================================================
// DAILY SALES RECORD API
// =====================================================

// GET all daily sales records
app.get('/api/daily-sales-records', verifyToken, async (req, res) => {
    try {
        const records = await prisma.dailySalesRecord.findMany({
            include: {
                ingreso: true, // Include the related income record
            },
            orderBy: {
                date: 'desc', // Most recent first
            },
        });
        res.json(records);
    } catch (error) {
        console.error('Error fetching daily sales records:', error);
        res.status(500).json({ error: 'Error fetching daily sales records' });
    }
});

// POST a new daily sales record and its corresponding income
app.post('/api/daily-sales-records', verifyToken, async (req, res) => {
    const { date, ...recordData } = req.body;

    // Basic validation
    if (!date) {
        return res.status(400).json({ error: 'Date is required.' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Step 1: Create the DailySalesRecord
            const newDailySalesRecord = await tx.dailySalesRecord.create({
                data: {
                    ...recordData,
                    date: new Date(date + 'T12:00:00Z'), // Asegurar que la fecha es un objeto Date y se interpreta como mediodía UTC
                },
            });

            // Step 2: Create the corresponding Ingreso, linking it to the new record
            const newIngreso = await tx.ingreso.create({
                data: {
                    description: `Venta Diaria Detallada (${new Date(date).toISOString().slice(0, 10)})`,
                    amount: recordData.totalImporte,
                    date: new Date(date),
                    dailySalesRecordId: newDailySalesRecord.id, // Direct assignment
                },
            });

            // Return the created record with its linked income
            return { ...newDailySalesRecord, ingreso: newIngreso };
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating daily sales record and income:', error.message, error.stack);
        if (error.code === 'P2002' && error.meta?.target?.includes('date')) {
             return res.status(409).json({ error: 'Ya existe un registro de ventas para esta fecha.' });
        }
        res.status(500).json({ error: 'Error al crear el registro de ventas diarias', details: error.message });
    }
});

// PUT to update a daily sales record and its corresponding income
app.put('/api/daily-sales-records/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { date, ...recordData } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Paso 1: Actualizar el DailySalesRecord
            const updatedDailySalesRecord = await tx.dailySalesRecord.update({
                where: { id },
                data: {
                    ...recordData,
                    date: new Date(date + 'T12:00:00Z'), // Asegurar que la fecha es un objeto Date y se interpreta como mediodía UTC
                },
            });

            // Paso 2: Actualizar el Ingreso correspondiente
            // Primero, encontrar el ingreso asociado a este registro de ventas diarias
            const existingIngreso = await tx.ingreso.findUnique({
                where: { dailySalesRecordId: id },
            });

            let updatedIngreso;
            if (existingIngreso) {
                updatedIngreso = await tx.ingreso.update({
                    where: { id: existingIngreso.id },
                    data: {
                        description: `Venta Diaria Detallada (${new Date(date).toISOString().slice(0, 10)})`,
                        amount: recordData.totalImporte,
                        date: new Date(date + 'T12:00:00Z'),
                    },
                });
            } else {
                // Si por alguna razón no existe un ingreso, se crea uno nuevo
                updatedIngreso = await tx.ingreso.create({
                    data: {
                        description: `Venta Diaria Detallada (${new Date(date).toISOString().slice(0, 10)})`,
                        amount: recordData.totalImporte,
                        date: new Date(date + 'T12:00:00Z'),
                        dailySalesRecordId: updatedDailySalesRecord.id,
                    },
                });
            }

            return { ...updatedDailySalesRecord, ingreso: updatedIngreso };
        });

        res.json(result);
    } catch (error) {
        console.error(`Error updating daily sales record ${id} and income:`, error.message, error.stack);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Registro de ventas diarias no encontrado.' });
        }
        if (error.code === 'P2002' && error.meta?.target?.includes('date')) {
            return res.status(409).json({ error: 'Ya existe un registro de ventas para esta fecha.' });
        }
        res.status(500).json({ error: 'Error al actualizar el registro de ventas diarias', details: error.message });
    }
});

// DELETE a daily sales record and its corresponding income
app.delete('/api/daily-sales-records/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.$transaction(async (tx) => {
            // Paso 1: Eliminar el Ingreso asociado (si existe)
            // Ya que dailySalesRecordId es @unique en Ingreso, debería haber solo uno o ninguno.
            await tx.ingreso.deleteMany({
                where: { dailySalesRecordId: id },
            });

            // Paso 2: Eliminar el DailySalesRecord
            await tx.dailySalesRecord.delete({
                where: { id },
            });
        });

        res.status(204).send(); // No content
    } catch (error) {
        console.error(`Error deleting daily sales record ${id} and income:`, error.message, error.stack);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Registro de ventas diarias no encontrado.' });
        }
        res.status(500).json({ error: 'Error al eliminar el registro de ventas diarias', details: error.message });
    }
});

// POST to BULK create new daily sales records
app.post('/api/daily-sales-records/bulk', verifyToken, async (req, res) => {
    const records = req.body;

    if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: 'Request body must be a non-empty array of records.' });
    }

    // Import createId from the CUID2 library
    const { createId } = await import('@paralleldrive/cuid2');

    try {
        // --- PREPARE DATA FOR EFFICIENT INSERTION ---
        const salesRecordsToCreate = [];
        const ingresosToCreate = [];

        for (const recordData of records) {
            const { date, ...restOfData } = recordData;
            if (!date) {
                // Immediately fail if any record is missing a date
                return res.status(400).json({ error: `One or more records are missing a date.` });
            }

            const recordDate = new Date(date + 'T12:00:00Z'); // Interpretar la fecha como mediodía UTC
            const generatedId = createId(); // Generate CUID beforehand

            // Prepare DailySalesRecord data
            salesRecordsToCreate.push({
                id: generatedId,
                ...restOfData,
                date: recordDate,
            });

            // Prepare corresponding Ingreso data
            ingresosToCreate.push({
                description: `Venta Diaria Detallada (${new Date(date).toISOString().slice(0, 10)})`,
                amount: restOfData.totalImporte,
                date: recordDate,
                dailySalesRecordId: generatedId, // Use the pre-generated ID
            });
        }

        // --- EXECUTE TWO `createMany` QUERIES WITHIN A TRANSACTION ---
        const [salesResult, incomeResult] = await prisma.$transaction([
            prisma.dailySalesRecord.createMany({
                data: salesRecordsToCreate,
                skipDuplicates: true, // Optional: useful if you want to ignore duplicates rather than fail
            }),
            prisma.ingreso.createMany({
                data: ingresosToCreate,
                skipDuplicates: true, 
            }),
        ]);

        res.status(201).json({
            message: `Import successful. Created ${salesResult.count} new sales records and ${incomeResult.count} new income entries.`,
            salesCount: salesResult.count,
            incomeCount: incomeResult.count,
        });

    } catch (error) {
        console.error('Error during bulk daily sales record creation:', error.message, error.stack);
        // This will now primarily catch issues if the whole transaction fails,
        // as createMany with skipDuplicates handles unique constraint violations gracefully.
        res.status(500).json({ error: 'Ocurrió un error durante el proceso de importación masiva.', details: error.message });
    }
});


// =====================================================
// CASH DRAWER API
// =====================================================

// GET active cash drawer session for the logged-in user
app.get('/api/cash-drawer/active', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activeSession = await prisma.sesionCaja.findFirst({
      where: {
        vendedorId: userId,
        estado: 'ABIERTA',
      },
      include: {
        transacciones: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    res.json(activeSession);
  } catch (error) {
    console.error('Error fetching active cash drawer session:', error);
    res.status(500).json({ error: 'Ocurrió un error en el servidor.' });
  }
});

// POST to start a new cash drawer session
app.post('/api/cash-drawer/start', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { openingBalance } = req.body;

    if (openingBalance === undefined || isNaN(parseFloat(openingBalance))) {
      return res.status(400).json({ error: 'El saldo inicial (openingBalance) es requerido y debe ser un número.' });
    }

    // 1. Check if there is already an open session for this user
    const existingOpenSession = await prisma.sesionCaja.findFirst({
      where: {
        vendedorId: userId,
        estado: 'ABIERTA',
      },
    });

    if (existingOpenSession) {
      return res.status(409).json({ error: 'Ya tienes una sesión de caja abierta. Ciérrala antes de abrir una nueva.' });
    }

    // 2. Create the new session
    const newSession = await prisma.sesionCaja.create({
      data: {
        vendedor: { connect: { id: userId } },
        openingBalance: parseFloat(openingBalance),
        estado: 'ABIERTA',
      },
    });

    res.status(201).json(newSession);

  } catch (error) {
    console.error('Error starting cash drawer session:', error);
    res.status(500).json({ error: 'Ocurrió un error en el servidor al iniciar la sesión de caja.' });
  }
});

// POST to close the active cash drawer session
app.post('/api/cash-drawer/close', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { closingBalance } = req.body;

        if (closingBalance === undefined || isNaN(parseFloat(closingBalance))) {
            return res.status(400).json({ error: 'El saldo de cierre (closingBalance) es requerido y debe ser un número.' });
        }

        // 1. Find the active session for the user
        const activeSession = await prisma.sesionCaja.findFirst({
            where: {
                vendedorId: userId,
                estado: 'ABIERTA',
            },
            include: {
                transacciones: true,
            },
        });

        if (!activeSession) {
            return res.status(404).json({ error: 'No se encontró una sesión de caja abierta para cerrar.' });
        }

        // 2. Calculate the expected balance
        const totalSales = activeSession.transacciones
            .filter(t => t.tipo === 'VENTA')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalPayIns = activeSession.transacciones
            .filter(t => t.tipo === 'INGRESO')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalPayOuts = activeSession.transacciones
            .filter(t => t.tipo === 'RETIRO')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expectedBalance = activeSession.openingBalance + totalSales + totalPayIns - totalPayOuts;

        // 3. Update the session to close it
        const closedSession = await prisma.sesionCaja.update({
            where: {
                id: activeSession.id,
            },
            data: {
                endedAt: new Date(),
                estado: 'CERRADA',
                closingBalance: parseFloat(closingBalance),
                expectedBalance: expectedBalance,
            },
        });

        res.json(closedSession);

    } catch (error) {
        console.error('Error closing cash drawer session:', error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor al cerrar la sesión de caja.' });
    }
});

// POST to add a new cash transaction (INGRESO, RETIRO, CAMBIO)
app.post('/api/cash-drawer/transaction', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, type, description } = req.body;

    if (amount === undefined || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'El monto es requerido y debe ser un número positivo.' });
    }
    if (!type || !['INGRESO', 'RETIRO', 'VENTA', 'CAMBIO'].includes(type)) { // Check against the enum
      return res.status(400).json({ error: 'El tipo de transacción es requerido y debe ser INGRESO, RETIRO, VENTA o CAMBIO.' });
    }

    // Find the active session for the user
    const activeSession = await prisma.sesionCaja.findFirst({
      where: {
        vendedorId: userId,
        estado: 'ABIERTA',
      },
    });

    if (!activeSession) {
      return res.status(404).json({ error: 'No hay una sesión de caja abierta para registrar transacciones.' });
    }

    // Create the new transaction
    const newTransaction = await prisma.transaccionCaja.create({
      data: {
        amount: parseFloat(amount),
        tipo: type, // Ensure this matches the Prisma enum exactly
        description: description || null,
        sesion: { connect: { id: activeSession.id } },
      },
    });

    res.status(201).json(newTransaction);

  } catch (error) {
    console.error('Error creating cash transaction:', error);
    res.status(500).json({ error: 'Ocurrió un error en el servidor al registrar la transacción de caja.' });
  }
});


// =====================================================
// USERS API
// =====================================================

app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const data = req.body;

    // Explicitly convert empty strings to null for optional fields
    const userData = {
      name: data.name,
      email: data.email === '' ? null : data.email,
      phone: data.phone === '' ? null : data.phone,
      street: data.street === '' ? null : data.street,
      neighborhood: data.neighborhood === '' ? null : data.neighborhood,
      city: data.city === '' ? null : data.city,
      postalCode: data.postalCode === '' ? null : data.postalCode,
      role: 'CLIENTE', // Security: Force role to 'CLIENTE' on the backend
    };

    // Hash password if provided
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10); // 10 is the salt rounds
      userData.password = hashedPassword;
    } else {
      userData.password = null;
    }

    // ✅ GENERAR customId si no viene desde el front
    let customId = data.customId;
    if (!customId) {
      const rolePrefix = 'CLI'; // Force 'CLI' prefix for clients
      const random = String(Math.floor(Math.random() * 900) + 100); // 100–999
      customId = `${rolePrefix}-${random}`; // ej: CLI-123
    }

    const newUser = await prisma.user.create({
      data: {
        ...userData, // Use the cleaned userData with the forced role
        customId,
      },
    });
    
    // Exclude password from the response
    const { password, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);

  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'P2002') { // Handle unique constraint violation (e.g., email or phone already exists)
      return res.status(409).json({
        error: 'El usuario ya existe.',
        message: 'Ya existe un usuario con el mismo email o teléfono.',
      });
    }
    res.status(500).json({
      error: 'Error creating user',
      message: error.message,
    });
  }
});

// GET user by customId or phone
app.get('/api/users/check', async (req, res) => {
  const { identifier, type } = req.query;

  if (!identifier || !type) {
    return res.status(400).json({ error: 'Identifier and type (customId or phone) are required.' });
  }

  try {
    let user;
    if (type === 'customId') {
      user = await prisma.user.findUnique({
        where: { customId: identifier },
      });
    } else if (type === 'phone') {
      user = await prisma.user.findUnique({
        where: { phone: identifier },
      });
    } else {
      return res.status(400).json({ error: 'Invalid search type. Must be "customId" or "phone".' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Exclude password from the response, but include a flag if it exists
    const { password, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, hasPassword: !!password });

  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ error: 'Ocurrió un error en el servidor al verificar el usuario.' });
  }
});

app.get('/api/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Exclude password from the response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);

  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    res.status(500).json({ error: 'Ocurrió un error en el servidor al obtener el usuario.' });
  }
});

app.put('/api/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const data = req.body;

    // Explicitly convert empty strings to null for optional fields
    const updateData = {
      name: data.name, // Name might be updated
      email: data.email === '' ? null : data.email,
            phone: data.phone === '' ? null : data.phone,
      street: data.street === '' ? null : data.street,
      neighborhood: data.neighborhood === '' ? null : data.neighborhood,
      city: data.city === '' ? null : data.city,
      postalCode: data.postalCode === '' ? null : data.postalCode,
      references: data.references === '' ? null : data.references, // New field to handle
      role: data.role, // Role might be updated, but usually not by client
    };

    // Remove undefined values to avoid updating fields not present in the request body
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    // Prevent critical fields from being updated via this general endpoint
    delete updateData.password;
    delete updateData.role; // <-- SECURITY FIX: Do not allow role changes from this endpoint.

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Error updating user' });
  }
});

app.delete('/api/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Error deleting user' });
  }
});


// =====================================================
// EMPLEADOS API (HR Module)
// =====================================================

// GET all employees
app.get('/api/empleados', verifyToken, async (req, res) => {
  try {
    const empleados = await prisma.empleado.findMany({
      include: {
        user: true, // Include related user account info
        documentos: true, // Include employee documents
        manager: true, // Include manager info
      },
      orderBy: {
        nombreCompleto: 'asc'
      }
    });
    res.json(empleados);
  } catch (error) {
    console.error('Error fetching empleados:', error);
    res.status(500).json({ error: 'Error al obtener los empleados.' });
  }
});

// GET a single employee by ID
app.get('/api/empleados/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id },
      include: {
        user: true,
        documentos: true,
        manager: true,
        subordinados: true,
        historialSueldos: {
          orderBy: {
            fechaInicio: 'desc'
          }
        }
      },
    });

    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado.' });
    }
    res.json(empleado);
  } catch (error) {
    console.error(`Error fetching empleado ${id}:`, error);
    res.status(500).json({ error: 'Error al obtener el empleado.' });
  }
});

// POST a new employee
app.post('/api/empleados', verifyToken, async (req, res) => {
  const { userId, fechaContratacion, managerId, role, ...data } = req.body;
  try {
    const empleadoData = {
      ...data,
      fechaContratacion: new Date(fechaContratacion),
    };

    if (userId) empleadoData.user = { connect: { id: userId } };
    if (managerId) empleadoData.manager = { connect: { id: managerId } };

    const newEmpleado = await prisma.empleado.create({
      data: empleadoData,
      include: { manager: true },
    });
    res.status(201).json(newEmpleado);
  } catch (error) {
    console.error('Error creating empleado:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un empleado con este email personal o cuenta de usuario asociada.' });
    }
    res.status(500).json({ error: 'Error al crear el empleado.' });
  }
});

// PUT to update an employee
app.put('/api/empleados/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  // Destruct and discard relational fields that should not be in the update payload
  const {
    userId,
    fechaContratacion,
    fechaTerminacion,
    managerId,
    // Fields to ignore from the body to prevent validation errors
    documentos, 
    user, 
    manager, 
    subordinados,
    historialSueldos,
    createdAt,
    updatedAt,
    id: employeeId, // rename to avoid conflict with `id` from params
    ...data 
  } = req.body;

  try {
    const empleadoData = { ...data };

    if (fechaContratacion) empleadoData.fechaContratacion = new Date(fechaContratacion);
    if (fechaTerminacion) empleadoData.fechaTerminacion = new Date(fechaTerminacion);
    else if (req.body.hasOwnProperty('fechaTerminacion')) empleadoData.fechaTerminacion = null;

    if (req.body.hasOwnProperty('userId')) {
      empleadoData.user = userId ? { connect: { id: userId } } : { disconnect: true };
    }

    if (req.body.hasOwnProperty('managerId')) {
        empleadoData.manager = managerId ? { connect: { id: managerId } } : { disconnect: true };
    }

    const updatedEmpleado = await prisma.empleado.update({
      where: { id },
      data: empleadoData,
      include: { manager: true },
    });
    res.json(updatedEmpleado);
  } catch (error) {
    console.error(`Error updating empleado ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Empleado no encontrado.' });
    }
    // Provide more detailed validation error
    if (error instanceof prisma.Prisma.PrismaClientValidationError) {
        return res.status(400).json({ error: 'Error de validación. Revise los datos enviados.', details: error.message });
    }
    res.status(500).json({ error: 'Error al actualizar el empleado.' });
  }
});

// DELETE an employee
app.delete('/api/empleados/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Before deleting the employee, we might need to delete related documents if there's a cascade rule,
    // but Prisma handles this. We must manually delete documents if they are stored in a separate service (e.g., S3).
    // For now, we only delete the DB records.
    await prisma.documento.deleteMany({
        where: { empleadoId: id }
    });

    await prisma.empleado.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting empleado ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Empleado no encontrado.' });
    }
    res.status(500).json({ error: 'Error al eliminar el empleado.' });
  }
});

// Import multer for file uploads and put from @vercel/blob
const multer = require('multer');
const { put } = require('@vercel/blob');

// Configure multer for in-memory storage, which is ideal for serverless environments
const upload = multer({ storage: multer.memoryStorage() });

// POST a new document for an employee
app.post('/api/empleados/:id/documentos', verifyToken, upload.single('file'), async (req, res) => {
  const { id: empleadoId } = req.params;
  const { nombre, tipo } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
  }
  
  if (!nombre || !tipo) {
    return res.status(400).json({ error: 'El nombre y el tipo de documento son requeridos.' });
  }

  const file = req.file;
  const blobName = `documentos/${empleadoId}/${Date.now()}-${file.originalname}`;

  try {
    // Step 1: Upload the file to Vercel Blob
    const blob = await put(blobName, file.buffer, {
      access: 'public', // The file will be publicly accessible
      contentType: file.mimetype,
    });

    // Step 2: Create the document record in the database
    const newDocumento = await prisma.documento.create({
      data: {
        nombre,
        tipo,
        url: blob.url, // Use the URL returned from Vercel Blob
        empleado: {
          connect: { id: empleadoId },
        },
      },
    });

    res.status(201).json(newDocumento);
  } catch (error) {
    console.error(`Error uploading document for empleado ${empleadoId}:`, error);
    res.status(500).json({ error: 'Ocurrió un error al subir el documento.' });
  }
});


// =====================================================
// ORDERS API (for clients)
// =====================================================
app.get('/api/my-orders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await prisma.pedido.findMany({
      where: {
        clienteId: userId,
      },
      include: {
        items: {
          include: {
            product: true,
            servicePrice: {
              include: {
                waterType: true,
              },
            },
            // No es necesario un 'include' para los campos nuevos, ya están en PedidoItem
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener los pedidos.' });
  }
});

// ====================================================================
//  PEDIDOS API (New Order Creation)
// ====================================================================

// GET all orders (for admin/vendedor)
app.get('/api/pedidos', verifyToken, async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        cliente: true, // Include customer details
        items: {
          include: {
            product: true,
            servicePrice: {
              include: {
                waterType: true,
                jugBrands: true,
              },
            },
            // No es necesario un 'include' para los campos nuevos, ya están en PedidoItem
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(pedidos);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener los pedidos.' });
  }
});


app.post('/api/pedidos', async (req, res) => {
  // El middleware verifyToken se ha quitado para permitir pedidos de invitados
  let {
    clienteId, // Puede ser null o undefined
    items,
    total,
    deliveryMethod,
    paymentMethod,
    paymentStatus
  } = req.body;

  if (!items || !total || !deliveryMethod) {
    return res.status(400).json({ error: 'Faltan datos requeridos para crear el pedido.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // --- PASO 1: Asegurar que tenemos un cliente ---
      if (!clienteId) {
        // Generar un customId único para el cliente invitado
        let guestCustomId;
        let isIdUnique = false;
        while (!isIdUnique) {
          const random = String(Math.floor(Math.random() * 9000) + 1000);
          guestCustomId = `INV-${random}`; // Prefijo para Invitado
          const existingUser = await tx.user.findUnique({ where: { customId: guestCustomId } });
          if (!existingUser) {
            isIdUnique = true;
          }
        }

        // Crear el usuario invitado
        const guestUser = await tx.user.create({
          data: {
            name: 'Cliente Web Invitado',
            customId: guestCustomId,
            role: 'CLIENTE',
          },
        });
        clienteId = guestUser.id; // Usar el ID del nuevo usuario
      }
      
      // --- PASO 2: Crear el Pedido ---
      // Generar un customId único para el pedido
      let customId;
      let isPedidoIdUnique = false;
      while (!isPedidoIdUnique) {
        const random = String(Math.floor(Math.random() * 90000) + 10000);
        customId = `ORD-${random}`;
        const existingPedido = await tx.pedido.findUnique({ where: { customId } });
        if (!existingPedido) {
          isPedidoIdUnique = true;
        }
      }

      // Crear el Pedido principal
      const newPedido = await tx.pedido.create({
        data: {
          customId,
          total,
          deliveryMethod,
          paymentMethod: paymentMethod || 'Efectivo',
          paymentStatus: paymentStatus || 'NO_PAGADO',
          cliente: { connect: { id: clienteId } },
        },
      });

      // --- PASO 3: Crear los Ítems del Pedido ---
      const pedidoItemsData = items.map(item => ({
        pedidoId: newPedido.id,
        quantity: item.quantity,
        price: item.price,
        servicePriceId: item.servicePriceId,
        jugBrandId: item.jugBrandId,
        jugBrandName: item.jugBrandName,
        jugBrandImageUrl: item.jugBrandImageUrl,
      }));

      await tx.pedidoItem.createMany({
        data: pedidoItemsData,
      });

      // --- PASO 4: Crear el Ingreso asociado ---
      // No crear ingreso si el total es 0 para no ensuciar registros
      if (total > 0) {
        await tx.ingreso.create({
          data: {
            description: `Ingreso por Pedido ${customId}`,
            amount: total,
            date: new Date(),
            pedido: { connect: { id: newPedido.id } },
          },
        });
      }

      return newPedido;
    });

    res.status(201).json(result);

  } catch (error) {
    console.error('Error al crear el pedido y el ingreso:', error);
    res.status(500).json({
      error: 'Ocurrió un error en el servidor al procesar el pedido.',
      details: error.message,
    });
  }
});

app.put('/api/pedidos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status, paymentMethod } = req.body; // paymentMethod might be sent for cash, or we fetch it from existing order

  if (!status) {
    return res.status(400).json({ error: 'El estado (status) es requerido.' });
  }

  try {
    const updatedPedido = await prisma.$transaction(async (tx) => {
      // 1. Get the existing order to check current status and payment method
      const existingPedido = await tx.pedido.findUnique({
        where: { id },
        select: {
          status: true,
          paymentMethod: true,
          total: true,
          sesionCajaId: true,
          customId: true, // Need customId for transaction description
        },
      });

      if (!existingPedido) {
        throw new Error('Pedido no encontrado.'); // Throw to rollback transaction
      }
      
      // Determine the actual payment method. Prioritize what's sent in body, then what's in DB.
      const actualPaymentMethod = paymentMethod || existingPedido.paymentMethod;

      // 2. Update the order status
      const pedido = await tx.pedido.update({
        where: { id },
        data: { status },
        include: {
          cliente: true,
          items: {
            include: {
              product: true,
              servicePrice: {
                include: {
                  waterType: true,
                  jugBrands: true, // This was missing in my initial draft for new_string
                },
              },
            },
          },
        },
      });

      // 3. If status is ENTREGADO and payment is Efectivo, record cash transaction
      if (status === 'ENTREGADO' && actualPaymentMethod === 'Efectivo') {
        // Ensure only a VENDEDOR or ADMIN can perform this action
        if (req.user.role !== 'VENDEDOR' && req.user.role !== 'ADMIN') {
          throw new Error('Solo vendedores o administradores pueden registrar ventas en caja.');
        }

        // Find active cash drawer session for the current user
        let activeSession = await tx.sesionCaja.findFirst({
          where: {
            vendedorId: req.user.id,
            estado: 'ABIERTA',
          },
        });

        if (!activeSession) {
          throw new Error('No hay una sesión de caja abierta para registrar esta venta.');
        }

        // Check if a transaction for this order already exists in this session
        const existingTransaction = await tx.transaccionCaja.findFirst({
          where: {
            pedidoId: pedido.id,
            sesionId: activeSession.id,
            tipo: 'VENTA',
          },
        });

        if (existingTransaction) {
          // If transaction already exists, just return the pedido, don't create duplicate
          return pedido;
        }

        // Create a new cash transaction
        await tx.transaccionCaja.create({
          data: {
            tipo: 'VENTA',
            amount: pedido.total,
            description: `Venta de Pedido ${pedido.customId}`,
            sesion: { connect: { id: activeSession.id } },
            pedido: { connect: { id: pedido.id } },
          },
        });

        // Also link the order to the session if it's not already
        // This is done implicitly by connecting the transaction to the pedido,
        // but explicit linking on the pedido itself is also good for queries.
        if (!existingPedido.sesionCajaId) {
          await tx.pedido.update({
            where: { id: pedido.id },
            data: {
              sesionCaja: { connect: { id: activeSession.id } },
            },
          });
        }
      }

      return pedido;
    }, {
      maxWait: 10000, // Wait 10 seconds to get a connection
      timeout: 20000, // Allow 20 seconds for the transaction to complete
    });

    res.json(updatedPedido);
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    // Use the error message from the thrown Error within the transaction for more specific feedback
    if (error.message.includes('Pedido no encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('sesión de caja abierta')) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message.includes('registrar ventas en caja')) {
        return res.status(403).json({ error: error.message });
    }
    if (error.code === 'P2025') { // Prisma specific not found error
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
    res.status(500).json({ error: 'Error al actualizar el pedido: ' + error.message });
  }
});


// ====================================================================
//  START SERVER
// ====================================================================
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
