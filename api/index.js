const express = require('express');
const prisma = require('./lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // <-- Importar JWT
require('dotenv').config(); // <-- Cargar variables de entorno

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

    const userData = {
      name: data.name,
      phone: data.phone,
      street: data.street || null,
      neighborhood: data.neighborhood || null,
      city: data.city || null,
      postalCode: data.postalCode || null,
      references: data.references || null,
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
    const servicePrices = await prisma.servicePrice.findMany({ include: { waterType: true }, orderBy: { price: 'asc' } });
    res.json(servicePrices);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching service prices' });
  }
});
app.post('/api/service-prices', verifyToken, async (req, res) => {
  try {
    const { waterTypeId, ...rest } = req.body;
    const data = waterTypeId ? { ...rest, waterType: { connect: { id: waterTypeId } } } : rest;
    const servicePrice = await prisma.servicePrice.create({ data });
    res.status(201).json(servicePrice);
  } catch (error) {
    res.status(500).json({ error: 'Error creating service price' });
  }
});
app.put('/api/service-prices/:id', verifyToken, async (req, res) => {
  try {
    const { waterTypeId, ...rest } = req.body;
    const data = waterTypeId ? { ...rest, waterType: { connect: { id: waterTypeId } } } : { ...rest, waterTypeId: null };
    const servicePrice = await prisma.servicePrice.update({ where: { id: req.params.id }, data });
    res.json(servicePrice);
  } catch (error) {
    res.status(500).json({ error: 'Error updating service price' });
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
        date: new Date(date),
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
    const data = date ? { ...rest, date: new Date(date) } : rest;
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
                    date: new Date(date), // Ensure date is a Date object
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

            const recordDate = new Date(date);
            const generatedId = createId(); // Generate CUID beforehand

            // Prepare DailySalesRecord data
            salesRecordsToCreate.push({
                id: generatedId,
                ...restOfData,
                date: recordDate,
            });

            // Prepare corresponding Ingreso data
            ingresosToCreate.push({
                description: `Venta Diaria Detallada (${recordDate.toISOString().slice(0, 10)})`,
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

app.post('/api/users', verifyToken, async (req, res) => {
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
      role: data.role || 'CLIENTE',
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
      const rolePrefix = (userData.role || 'CLIENTE').substring(0, 3).toUpperCase();
      const random = String(Math.floor(Math.random() * 900) + 100); // 100–999
      customId = `${rolePrefix}-${random}`; // ej: ADM-123, VEN-456
    }

    const newUser = await prisma.user.create({
      data: {
        ...userData, // Use the cleaned userData
        customId, // 👈 aquí sí va una string real
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: 'Error creating user',
      message: error.message,
    });
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

    // Prevent password from being updated via this general endpoint
    delete updateData.password;

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

// GET user by customId or phone
app.get('/api/users/check', verifyToken, async (req, res) => {
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

// =====================================================
// START SERVER
// =====================================================
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
