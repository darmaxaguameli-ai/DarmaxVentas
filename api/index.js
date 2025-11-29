const express = require('express');
const prisma = require('./lib/prisma');
const app = express();
const port = 3001; // Or any port you prefer

app.use(express.json()); // Middleware to parse JSON bodies

app.get('/api/health', (req, res) => {
  res.send('Server is running!');
});

// -----------------------------------
// PRODUCTOS API
// -----------------------------------

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
      where: { id: id },
      data: req.body,
    });
    res.json(updatedProduct);
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    res.status(500).json({ error: 'Error updating product' });
  }
});

// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.producto.delete({
      where: { id: id },
    });
    res.status(204).send(); // No content
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    // Handle cases where the product is not found, which might not be an error
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Error deleting product' });
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
