const express = require('express');
const prisma = require('./lib/prisma');
const app = express();
const port = 3001; // Or any port you prefer

app.use(express.json()); // Middleware to parse JSON bodies

// ------------------------------
// HEALTHCHECK
// ------------------------------
app.get('/api/health', (req, res) => {
  res.send('Server is running!');
});

// =====================================================
// PRODUCTOS API
// =====================================================

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.producto.findMany();
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
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = await prisma.producto.create({
      data: req.body,
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error creating product' });
  }
});

// PUT to update a product
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedProduct = await prisma.producto.update({
      where: { id }, // si tu id es String @id
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
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.producto.delete({
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
// INGRESOS API  (income)
// =====================================================

// GET all incomes
app.get('/api/incomes', async (req, res) => {
  try {
    const incomes = await prisma.ingreso.findMany();
    res.json(incomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ error: 'Error fetching incomes' });
  }
});

// POST a new income
app.post('/api/incomes', async (req, res) => {
  try {
    const newIncome = await prisma.ingreso.create({
      data: req.body,
    });
    res.status(201).json(newIncome);
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ error: 'Error creating income' });
  }
});

// PUT to update income
app.put('/api/incomes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedIncome = await prisma.ingreso.update({
      where: { id },
      data: req.body,
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
app.delete('/api/incomes/:id', async (req, res) => {
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

app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await prisma.gasto.findMany();
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Error fetching expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const newExpense = await prisma.gasto.create({
      data: req.body,
    });
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Error creating expense' });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedExpense = await prisma.gasto.update({
      where: { id },
      data: req.body,
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

app.delete('/api/expenses/:id', async (req, res) => {
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
// USERS API
// =====================================================

app.get('/api/users', async (req, res) => {
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

    // ✅ GENERAR customId si no viene desde el front
    let customId = data.customId;
    if (!customId) {
      const rolePrefix = (data.role || 'CLIENTE').substring(0, 3).toUpperCase();
      const random = String(Math.floor(Math.random() * 900) + 100); // 100–999
      customId = `${rolePrefix}-${random}`; // ej: ADM-123, VEN-456
    }

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email || null,
        password: data.password || null,
        phone: data.phone || null,
        street: data.street || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        role: data.role || 'CLIENTE',
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

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: req.body,
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

app.delete('/api/users/:id', async (req, res) => {
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
// START SERVER
// =====================================================
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
