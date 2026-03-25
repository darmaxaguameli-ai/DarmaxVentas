const express = require('express');
const prisma = require('./lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // <-- Importar axios
const crypto = require('crypto'); // <-- Importar crypto
const { sendEmail } = require('./utils/emailService'); // <-- Importar servicio de email
const { getResetPasswordEmailTemplate, getVerificationEmailTemplate } = require('./utils/templates/authEmailTemplates'); // <-- Importar plantilla
require('dotenv').config();

const app = express();
const port = 3001;

console.log("========================================");
console.log("🚀 BACKEND DARMAX INICIADO EN PUERTO 3001");
console.log("🛠️  SISTEMA DE LOGS DE DEPURACIÓN ACTIVO");
console.log("========================================");

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
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos.' });

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[Login] Intento de acceso para: ${normalizedEmail}`);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { store: true, roleRelation: true }
    });

    if (!user) {
        console.warn(`[Login] Usuario no encontrado: ${normalizedEmail}`);
        return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (!user.password) {
        console.warn(`[Login] Usuario sin contraseña guardada: ${normalizedEmail}`);
        return res.status(401).json({ error: 'Usuario sin contraseña configurada.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        console.warn(`[Login] Contraseña incorrecta para: ${normalizedEmail}`);
        return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    console.log(`[Login] ÉXITO para: ${normalizedEmail} [ID: ${user.id}]`);
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, roleId: user.roleId, permissions: user.roleRelation || {} },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// =====================================================
// PASSWORD RESET API
// =====================================================

app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El email es requerido.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  console.log(`[Forgot-Password] Iniciando proceso para: ${normalizedEmail}`);

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      console.warn(`[Forgot-Password] Usuario no encontrado: ${normalizedEmail}`);
      // Por seguridad, no indicamos si el usuario no existe
      return res.json({ message: 'Si el correo existe, se enviará un enlace de recuperación.' });
    }

    // Generar token
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en BD
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });

    console.log(`[Forgot-Password] Token generado y guardado para ${user.id}`);

    // Enviar correo - Enlace dinámico según el entorno
    const frontendUrl = process.env.FRONTEND_URL || 'https://ventas-darmax-gestion.vercel.app';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const html = getResetPasswordEmailTemplate({ name: user.name, resetLink });

    try {
        await sendEmail(normalizedEmail, 'Recuperación de contraseña de Darmax', html);
        console.log(`[Forgot-Password] Email enviado exitosamente a ${normalizedEmail}`);
    } catch (emailErr) {
        console.error(`[Forgot-Password] Error crítico al enviar email a ${normalizedEmail}:`, emailErr);
        throw new Error('Error al enviar el correo electrónico.');
    }

    res.json({ message: 'Si el correo existe, se enviará un enlace de recuperación.' });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud.' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos.' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }, // Token no expirado
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado.' });
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar usuario
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.json({ message: 'Contraseña restablecida exitosamente.' });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña.' });
  }
});

app.post('/api/verify-email', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'El token es requerido.' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o ya utilizado.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
      },
    });

    res.json({ message: 'Correo verificado exitosamente.' });

  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Error al verificar el correo.' });
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
    let coordinates = { lat: data.lat || null, lng: data.lng || null };
    if (!coordinates.lat && !coordinates.lng && data.street && data.city) {
        const fullAddress = `${data.street}, ${data.neighborhood || ''}, ${data.city}, ${data.postalCode || ''}`;
        coordinates = await geocodeAddress(fullAddress);
    }

    // 🔍 BUSCAR ROLE ID DINÁMICO
    const roleRecord = await prisma.role.findUnique({ where: { name: 'CLIENTE' } });

    const userData = {
      name: data.name,
      phone: data.phone,
      street: data.street || null,
      neighborhood: data.neighborhood || null,
      city: data.city || null,
      municipality: data.municipality || null, 
      state: data.state || null,               
      postalCode: data.postalCode || null,
      references: data.references || null,
      lat: coordinates.lat ? parseFloat(coordinates.lat) : null, 
      lng: coordinates.lng ? parseFloat(coordinates.lng) : null, 
      role: 'CLIENTE',
      roleId: roleRecord ? roleRecord.id : null, // ✅ Asignar el ID dinámico
      clientCategory: data.clientCategory || 'PARTICULAR',
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


// Endpoint público para completar el registro de un usuario existente (sin contraseña)
app.post('/api/complete-registration', async (req, res) => {
  try {
    const { userId, email, password, name, sexo } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: 'Faltan datos requeridos.' });
    }

    // Verificar si el usuario existe y NO tiene contraseña
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (user.password) {
      return res.status(409).json({ error: 'Este usuario ya está registrado. Por favor inicia sesión.' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar Token de Verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: email || user.email, // Actualizar email si se provee
        name: name || user.name,    // Actualizar nombre si se provee
        sexo: sexo || user.sexo,    // Actualizar sexo si se provee
        password: hashedPassword,
        verificationToken,
        emailVerified: null, // Marcar como no verificado hasta que use el link
      },
    });

    // Enviar Correo de Verificación
    const targetEmail = email || user.email;
    if (targetEmail) {
        try {
            const verifyLink = `https://ventas-darmax-gestion.vercel.app/verify-email?token=${verificationToken}`;
            const html = getVerificationEmailTemplate({ name: updatedUser.name, verificationLink: verifyLink });
            await sendEmail(targetEmail, 'Verifica tu cuenta en Darmax', html);
        } catch (emailErr) {
            console.error("Error sending verification email during completion:", emailErr);
        }
    }

    // Opcional: Generar token para autologin inmediato (QUITADO porque ahora requiere verificación)
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);

  } catch (error) {
    console.error('Error completing registration:', error);
    res.status(500).json({ error: 'Error al completar el registro.' });
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

// GET all products (Public, but Store-aware if logged in)
app.get('/api/products', async (req, res) => {
  try {
    // 1. Obtener todos los productos base
    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' }
    });

    // 2. Intentar determinar contexto de tienda si hay token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let storeId = null;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role !== 'ADMIN') {
                const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { storeId: true } });
                storeId = user?.storeId;
            }
        } catch (err) {
            // Si el token es inválido, simplemente lo ignoramos para este endpoint público
        }
    }

    // 3. Si hay tienda, sobrescribir stock con el inventario local
    if (storeId) {
        const storeInventory = await prisma.storeInventory.findMany({
            where: { storeId },
        });
        
        // Mapa para acceso rápido: productId -> stock
        const inventoryMap = new Map();
        storeInventory.forEach(item => inventoryMap.set(item.productId, item.stock));

        // Mapear productos con stock local
        const localizedProducts = products.map(p => ({
            ...p,
            stock: inventoryMap.get(p.id) || 0 // Si no hay registro, stock es 0
        }));
        
        return res.json(localizedProducts);
    }

    // Si no hay token o es ADMIN sin tienda o fallback, devolver tal cual (stock global/legacy)
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

// PUT to update a product (Store-aware stock update)
app.put('/api/products/:id', verifyToken, async (req, res) => {
  const { id: productId } = req.params;
  const { stock, ...productData } = req.body; // Separar stock del resto de datos
  const { id: userId, role } = req.user;

  try {
    // 1. Determinar contexto de tienda
    let storeId = null;
    if (role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { storeId: true } });
        storeId = user?.storeId;
    }

    // 2. Transacción para asegurar integridad
    const result = await prisma.$transaction(async (tx) => {
        let updatedProduct;

        // A) Actualizar datos generales del producto (nombre, precio, etc.)
        // Solo si hay datos para actualizar aparte del stock
        if (Object.keys(productData).length > 0) {
             updatedProduct = await tx.product.update({
                where: { id: productId },
                data: productData,
            });
        } else {
            updatedProduct = await tx.product.findUnique({ where: { id: productId } });
        }

        // B) Actualizar Stock
        if (stock !== undefined) {
            if (storeId) {
                // Si tiene tienda, actualizar/crear registro en StoreInventory
                await tx.storeInventory.upsert({
                    where: {
                        storeId_productId: { // Clave compuesta
                            storeId,
                            productId
                        }
                    },
                    update: { stock: parseInt(stock) },
                    create: {
                        storeId,
                        productId,
                        stock: parseInt(stock)
                    }
                });
                // Devolver el producto con el stock local actualizado para el frontend
                updatedProduct.stock = parseInt(stock); 
            } else {
                // Si es ADMIN global, actualizar stock global (legacy)
                updatedProduct = await tx.product.update({
                    where: { id: productId },
                    data: { stock: parseInt(stock) }
                });
            }
        }
        
        return updatedProduct;
    });

    res.json(result);
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
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
    const { compatibleCapId, imageUrl, ...rest } = req.body; // Extract imageUrl
    const data = { ...rest, imageUrl }; // Include it
    if (compatibleCapId) {
        data.compatibleCap = { connect: { id: compatibleCapId } };
    }
    const jugBrand = await prisma.jugBrand.create({ data });
    res.status(201).json(jugBrand);
  } catch (error) {
    res.status(500).json({ error: 'Error creating jug brand' });
  }
});
app.put('/api/jug-brands/:id', verifyToken, async (req, res) => {
  try {
    const { compatibleCapId, imageUrl, ...rest } = req.body;
    
    // Direct assignment to foreign key is safer for optional relations
    const data = { 
        ...rest, 
        imageUrl,
        compatibleCapId: compatibleCapId || null // If empty string, set to null
    };

    const jugBrand = await prisma.jugBrand.update({ where: { id: req.params.id }, data });
    res.json(jugBrand);
  } catch (error) {
    console.error('Error updating jug brand:', error.message, error.code, error.meta); // Detailed log
    if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Ya existe una marca con este nombre.' });
    }
    if (error.code === 'P2003') {
        return res.status(400).json({ error: 'El producto seleccionado para la tapa no existe.' });
    }
    res.status(500).json({ error: 'Error updating jug brand: ' + error.message });
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
// FRANCHISE & STORE API
// =====================================================

// --- FRANCHISES ---
app.get('/api/franchises', verifyToken, async (req, res) => {
  try {
    const franchises = await prisma.franchise.findMany({ 
        include: { stores: true },
        orderBy: { name: 'asc' } 
    });
    res.json(franchises);
  } catch (error) {
    console.error('Error fetching franchises:', error);
    res.status(500).json({ error: 'Error fetching franchises' });
  }
});

app.post('/api/franchises', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const franchise = await prisma.franchise.create({ data: { name } });
    res.status(201).json(franchise);
  } catch (error) {
    console.error('Error creating franchise:', error);
    res.status(500).json({ error: 'Error creating franchise' });
  }
});

app.put('/api/franchises/:id', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const franchise = await prisma.franchise.update({
      where: { id: req.params.id },
      data: { name }
    });
    res.json(franchise);
  } catch (error) {
    console.error('Error updating franchise:', error);
    res.status(500).json({ error: 'Error updating franchise' });
  }
});

app.delete('/api/franchises/:id', verifyToken, async (req, res) => {
  try {
    await prisma.franchise.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting franchise:', error);
    res.status(500).json({ error: 'Error deleting franchise' });
  }
});

// --- STORES ---
app.get('/api/stores', async (req, res) => { // Removed verifyToken
  try {
    const stores = await prisma.store.findMany({ 
        include: { franchise: true },
        orderBy: { name: 'asc' } 
    });
    res.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Error fetching stores' });
  }
});

app.post('/api/stores', verifyToken, async (req, res) => {
  try {
    const { name, address, franchiseId, latitud, longitud } = req.body;
    
    if (!name || !address || !franchiseId) {
        return res.status(400).json({ error: 'Name, address and franchiseId are required' });
    }

    let finalLat = latitud;
    let finalLng = longitud;

    // Auto-geocode if coordinates are missing
    if (!finalLat || !finalLng) {
        const coords = await geocodeAddress(address);
        finalLat = coords.lat;
        finalLng = coords.lng;
    }

    const store = await prisma.store.create({
      data: {
        name,
        address,
        franchise: { connect: { id: franchiseId } },
        latitud: finalLat,
        longitud: finalLng
      }
    });
    res.status(201).json(store);
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ error: 'Error creating store' });
  }
});

app.put('/api/stores/:id', verifyToken, async (req, res) => {
  try {
    const { name, address, franchiseId, latitud, longitud } = req.body;
    
    const data = {};
    if (name) data.name = name;
    if (address) data.address = address;
    if (franchiseId) data.franchise = { connect: { id: franchiseId } };
    
    // Handle geocoding on update if address changes but coords aren't provided
    if (address && (!latitud || !longitud)) {
         const coords = await geocodeAddress(address);
         data.latitud = coords.lat;
         data.longitud = coords.lng;
    } else {
        if (latitud !== undefined) data.latitud = latitud;
        if (longitud !== undefined) data.longitud = longitud;
    }

    const store = await prisma.store.update({
      where: { id: req.params.id },
      data
    });
    res.json(store);
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).json({ error: 'Error updating store' });
  }
});

app.delete('/api/stores/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Usar una transacción para limpiar dependencias antes de borrar la tienda
    await prisma.$transaction(async (tx) => {
        // 1. Desvincular usuarios (no borrarlos)
        await tx.user.updateMany({
            where: { storeId: id },
            data: { storeId: null }
        });

        // 2. Borrar inventario de la sucursal
        await tx.storeInventory.deleteMany({
            where: { storeId: id }
        });

        // 3. Borrar sesiones de caja (y sus transacciones asociadas si cascade está activado en DB, sino manual)
        // Nota: Si hay pedidos vinculados, esto podría fallar si no hay cascade.
        // Para desarrollo agresivo:
        // await tx.transaccionCaja.deleteMany({ where: { sesion: { storeId: id } } }); // Requiere query compleja
        // await tx.sesionCaja.deleteMany({ where: { storeId: id } });

        // 4. Borrar la tienda
        await tx.store.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting store:', error);
    // Mejorar mensaje de error para el cliente
    if (error.code === 'P2003') {
        return res.status(409).json({ error: 'No se puede eliminar la sucursal porque tiene registros asociados (Pedidos, Ventas, etc.).' });
    }
    res.status(500).json({ error: 'Error deleting store' });
  }
});

// GET nearest store based on coordinates
app.get('/api/stores/nearest', async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    try {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        const stores = await prisma.store.findMany({
            where: {
                latitud: { not: null },
                longitud: { not: null }
            },
            select: { id: true, name: true, address: true, latitud: true, longitud: true }
        });

        if (stores.length === 0) {
            return res.status(404).json({ error: 'No stores with coordinates found' });
        }

        // Haversine formula to find the nearest store
        let nearestStore = null;
        let minDistance = Infinity;

        const toRad = (value) => (value * Math.PI) / 180;

        stores.forEach(store => {
            const R = 6371; // Radius of the earth in km
            const dLat = toRad(store.latitud - userLat);
            const dLon = toRad(store.longitud - userLng);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(userLat)) * Math.cos(toRad(store.latitud)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c; // Distance in km

            if (d < minDistance) {
                minDistance = d;
                nearestStore = { ...store, distanceKm: d };
            }
        });

        res.json(nearestStore);

    } catch (error) {
        console.error('Error finding nearest store:', error);
        res.status(500).json({ error: 'Error calculating nearest store' });
    }
});

// =====================================================
// INGRESOS API  (income)
// =====================================================

// GET all incomes
app.get('/api/incomes', verifyToken, async (req, res) => {
  try {
    const { role, id } = req.user;
    const where = {};

    if (role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: { id }, select: { storeId: true } });
        if (user && user.storeId) {
            where.storeId = user.storeId;
        } else {
            return res.json([]);
        }
    }

    const incomes = await prisma.ingreso.findMany({ 
        where,
        include: {
            store: true,
        },
        orderBy: { date: 'desc' }
    });
    res.json(incomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ 
        error: 'Error fetching incomes',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST a new income
app.post('/api/incomes', verifyToken, async (req, res) => {
  try {
    const { date, ...rest } = req.body;
    const userId = req.user.id;
    
    // Obtener storeId del usuario
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { storeId: true } });
    
    const data = {
        ...rest,
        date: new Date(date),
    };

    // Asignar a la sucursal del usuario si existe
    if (user && user.storeId) {
        data.store = { connect: { id: user.storeId } };
    }

    const newIncome = await prisma.ingreso.create({
      data,
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
    const { role, id } = req.user;
    const where = {};

    if (role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: { id }, select: { storeId: true } });
        if (user && user.storeId) {
            where.storeId = user.storeId;
        } else {
            return res.json([]);
        }
    }

    const expenses = await prisma.gasto.findMany({
        where,
        orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Error fetching expenses' });
  }
});

app.post('/api/expenses', verifyToken, async (req, res) => {
  try {
    const { date, ...rest } = req.body;
    const userId = req.user.id;
    
    // Obtener storeId del usuario
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { storeId: true } });

    const data = {
        ...rest,
        date: new Date(date + 'T12:00:00Z'), // Interpretar la fecha como mediodía UTC
    };

    // Asignar a la sucursal del usuario si existe
    if (user && user.storeId) {
        data.store = { connect: { id: user.storeId } };
    }

    const newExpense = await prisma.gasto.create({
      data,
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
// CASH DRAWER API
// =====================================================

// GET active cash drawer session for the logged-in user
app.get('/api/cash-drawer/active', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener la sucursal del usuario para asegurar contexto
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { storeId: true } });
    
    const where = {
        vendedorId: userId,
        estado: 'ABIERTA',
    };

    // Si tiene tienda asignada, asegurar que la sesión corresponda a esa tienda
    if (user && user.storeId) {
        where.storeId = user.storeId;
    }

    const activeSession = await prisma.sesionCaja.findFirst({
      where,
      include: {
        transacciones: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        pedidos: {
            include: {
                items: true
            }
        }
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
    const { openingBalance, initialTags } = req.body;

    if (openingBalance === undefined || isNaN(parseFloat(openingBalance))) {
      return res.status(400).json({ error: 'El saldo inicial (openingBalance) es requerido y debe ser un número.' });
    }

    // --- FETCH USER STORE ---
    const user = await prisma.user.findUnique({ where: { id: userId } });
    let storeId = user?.storeId;

    if (!storeId) {
        // Fallback: Find the first store available
        const firstStore = await prisma.store.findFirst();
        if (firstStore) {
            storeId = firstStore.id;
        } else {
             return res.status(400).json({ error: 'No se puede abrir caja: El usuario no tiene sucursal asignada y no hay sucursales registradas.' });
        }
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
        store: { connect: { id: storeId } },
        openingBalance: parseFloat(openingBalance),
        initialTags: parseInt(initialTags) || 0,
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

// POST to report damaged or lost tags
app.post('/api/cash-drawer/report-tags', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { quantity } = req.body;

    if (quantity === undefined || isNaN(parseInt(quantity)) || parseInt(quantity) < 1) {
      return res.status(400).json({ error: 'La cantidad de etiquetas es requerida y debe ser un número positivo.' });
    }

    // Find the active session for the user
    const activeSession = await prisma.sesionCaja.findFirst({
      where: {
        vendedorId: userId,
        estado: 'ABIERTA',
      },
    });

    if (!activeSession) {
      return res.status(404).json({ error: 'No hay una sesión de caja abierta para reportar etiquetas.' });
    }

    // Update the session to increment damagedTags
    const updatedSession = await prisma.sesionCaja.update({
      where: { id: activeSession.id },
      data: {
        damagedTags: { increment: parseInt(quantity) }
      }
    });

    res.json(updatedSession);

  } catch (error) {
    console.error('Error reporting damaged tags:', error);
    res.status(500).json({ error: 'Ocurrió un error en el servidor al reportar las etiquetas.' });
  }
});


// =====================================================
// ROLES API
// =====================================================
app.get('/api/roles', verifyToken, async (req, res) => {
  try {
    console.log("[Backend] Intentando obtener roles...");
    const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
    console.log(`[Backend] ${roles.length} roles encontrados.`);
    res.json(roles);
  } catch (error) {
    console.error('[Backend] Error crítico al obtener roles:', error);
    res.status(500).json({ 
        error: 'Error al obtener roles', 
        details: error.message,
        code: error.code 
    });
  }
});

app.post('/api/roles', verifyToken, async (req, res) => {
  try {
    const newRole = await prisma.role.create({ data: req.body });
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear rol' });
  }
});

app.put('/api/roles/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      canAccessPOS, 
      canAccessOrders, 
      canAccessDelivery, 
      canAccessManagement, 
      canAccessInventory, 
      canAccessRH, 
      canAccessFinances, 
      canAccessConfig, 
      canAccessQuotes 
    } = req.body;

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        canAccessPOS,
        canAccessOrders,
        canAccessDelivery,
        canAccessManagement,
        canAccessInventory,
        canAccessRH,
        canAccessFinances,
        canAccessConfig,
        canAccessQuotes
      }
    });
    res.json(updatedRole);
  } catch (error) {
    console.error(`Error updating role ${req.params.id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Rol no encontrado.' });
    }
    res.status(500).json({ error: 'Error al actualizar el rol.' });
  }
});

app.delete('/api/roles/:id', verifyToken, async (req, res) => {
  try {
    const role = await prisma.role.findUnique({ 
        where: { id: req.params.id }, 
        include: { _count: { select: { users: true } } } 
    });
    if (role.isSystem) return res.status(400).json({ error: 'No se pueden eliminar roles del sistema.' });
    if (role._count.users > 0) return res.status(400).json({ error: 'No se puede eliminar un rol que tiene usuarios asignados.' });
    
    await prisma.role.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar rol' });
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
    
    // --- ROLE & AUTH CONFIGURATION ---
    let finalRole = 'CLIENTE';
    let finalStoreId = null;
    let requestedRole = (data.role || 'CLIENTE').toUpperCase().trim();

    // Mapeo de conveniencia para variaciones de nombres de roles
    if (requestedRole === 'VENTAS') requestedRole = 'VENTA';
    if (requestedRole === 'REPARTIDORES') requestedRole = 'REPARTIDOR';

    // If attempting to create a non-CLIENT user (Admin, Vendedor, Repartidor), verify permissions
    if (requestedRole !== 'CLIENTE') {
        const authHeader = req.headers['authorization'];
        let isAdmin = false;

        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    if (decoded.role === 'ADMIN') {
                        isAdmin = true;
                    }
                } catch (err) {
                    console.warn("Token verification failed during privileged user creation:", err.message);
                }
            }
        }

        // Permitimos crear el usuario si es ADMIN o si viene del flujo de RRHH (verificado por el token)
        if (!isAdmin) {
            return res.status(403).json({
                error: 'Permisos insuficientes.',
                message: 'Solo los administradores pueden crear usuarios con roles especiales.'
            });
        }

        finalRole = requestedRole;
        finalStoreId = data.storeId || null;
    } else {
        finalRole = 'CLIENTE';
        finalStoreId = null;
    }

    // 🔍 BUSCAR ROLE ID DINÁMICO
    let roleRecord = await prisma.role.findUnique({
        where: { name: finalRole }
    });

    let foundRoleId = roleRecord ? roleRecord.id : null;

    if (!roleRecord && finalRole !== 'CLIENTE') {
        const possibleRole = await prisma.role.findFirst({
            where: { name: { contains: finalRole, mode: 'insensitive' } }
        });
        if (possibleRole) {
            foundRoleId = possibleRole.id;
        }
    }

    // Normalizar email si existe
    const normalizedEmail = data.email ? data.email.toLowerCase().trim() : null;

    // Explicitly convert empty strings to null for optional fields
    const userData = {
      name: data.name,
      email: normalizedEmail,
      phone: data.phone === '' ? null : data.phone,
      street: data.street === '' ? null : data.street,
      neighborhood: data.neighborhood === '' ? null : data.neighborhood,
      city: data.city === '' ? null : data.city,
      municipality: data.municipality === '' ? null : data.municipality,
      state: data.state === '' ? null : data.state,
      postalCode: data.postalCode === '' ? null : data.postalCode,
      references: data.references === '' ? null : data.references,
      lat: data.lat ? parseFloat(data.lat) : null,
      lng: data.lng ? parseFloat(data.lng) : null,
      sexo: data.sexo === '' ? null : data.sexo, 
      clientCategory: data.clientCategory || 'PARTICULAR',
      role: finalRole,
      roleId: foundRoleId, // ✅ Asignar el ID dinámico detectado
    };

    // Connect store if provided
    if (finalStoreId) {
        userData.store = { connect: { id: finalStoreId } };
    }

    // Hash password if provided
    if (data.password) {
      console.log(`[CreateUser] Hasheando contraseña para: ${normalizedEmail}`);
      const hashedPassword = await bcrypt.hash(data.password, 10);
      userData.password = hashedPassword;
    } else {
      console.warn(`[CreateUser] Registro sin contraseña para: ${normalizedEmail}`);
      userData.password = null;
    }

    console.log(`[CreateUser] Intentando crear en DB: ${normalizedEmail} con CustomID: ${customId}`);

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await prisma.user.create({
      data: {
        ...userData,
        customId,
        verificationToken,
        emailVerified: null
      },
    });

    console.log(`[CreateUser] USUARIO CREADO EXITOSAMENTE: ${newUser.id}`);

    // Send Verification Email if email exists
    if (userData.email) {
        try {
            const verifyLink = `https://ventas-darmax-gestion.vercel.app/verify-email?token=${verificationToken}`;
            const html = getVerificationEmailTemplate({ name: userData.name, verificationLink: verifyLink });
            await sendEmail(userData.email, 'Verifica tu cuenta en Darmax', html);
        } catch (emailErr) {
            console.error("Error sending verification email:", emailErr);
            // Don't fail the registration, but log it. 
            // Client will have to request resend or contact support.
        }
    }
    
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
      include: {
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 20 // Limit history for performance
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
  const requesterRole = req.user.role;
  const requesterIsAdmin = requesterRole === 'ADMIN';

  try {
    const data = req.body;

    // 1. Fetch current user to check for role changes and existence
    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Explicitly convert empty strings to null for optional fields
    // We map EACH field manually to ensure nothing is missed
    const updateData = {
      name: data.name || undefined,
      email: data.email === '' ? null : (data.email || undefined),
      phone: data.phone === '' ? null : (data.phone || undefined),
      street: data.street === '' ? null : (data.street || undefined),
      neighborhood: data.neighborhood === '' ? null : (data.neighborhood || undefined),
      city: data.city === '' ? null : (data.city || undefined),
      municipality: data.municipality === '' ? null : (data.municipality || undefined),
      state: data.state === '' ? null : (data.state || undefined),
      postalCode: data.postalCode === '' ? null : (data.postalCode || undefined),
      references: data.references === '' ? null : (data.references || undefined),
      sexo: data.sexo === '' ? null : (data.sexo || undefined), 
      clientCategory: data.clientCategory || undefined,
      lat: data.lat === null ? null : (data.lat !== undefined ? parseFloat(data.lat) : undefined),
      lng: data.lng === null ? null : (data.lng !== undefined ? parseFloat(data.lng) : undefined),
      // Handle storeId: Allow if Admin OR if user is updating their own profile
      storeId: (requesterIsAdmin || id === req.user.id) && data.storeId !== undefined 
          ? (data.storeId === '' || data.storeId === null ? null : data.storeId) 
          : undefined
    };

    // 2. Role Change Logic (Admin only)
    if (requesterIsAdmin && data.role && data.role !== currentUser.role) {
        updateData.role = data.role;
        
        // Regenerate customId with new prefix
        let rolePrefix = 'CLI';
        switch (data.role) {
            case 'ADMIN': rolePrefix = 'ADM'; break;
            case 'VENDEDOR': rolePrefix = 'VEN'; break;
            case 'VENTA': rolePrefix = 'VTA'; break;
            case 'REPARTIDOR': rolePrefix = 'REP'; break;
            default: rolePrefix = 'CLI';
        }
        
        const random = String(Math.floor(Math.random() * 900) + 100);
        updateData.customId = `${rolePrefix}-${random}`;
    }

    // Remove undefined values to ensure Prisma doesn't try to update fields that weren't sent
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    console.log(`[UpdateUser] Intentando actualizar usuario ${id} con data:`, JSON.stringify(updateData, null, 2));

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        loyaltyTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 5
        }
      }
    });
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);

  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    
    // Errores conocidos de Prisma
    if (error.code === 'P2002') {
        const field = error.meta?.target?.includes('phone') ? 'teléfono' : 'email';
        return res.status(409).json({ 
            error: `El ${field} ya está registrado en otra cuenta.`,
            details: `Por favor usa un ${field} diferente o contacta a soporte.`
        });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Error updating user', details: error.message, prismaError: error.code });
  }
});

// =====================================================
// USER PREFERENCES API
// =====================================================

app.get('/api/user-preferences', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await prisma.userJugPreference.findMany({
      where: { userId },
      include: { jugBrand: true }
    });
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Error al obtener preferencias.' });
  }
});

app.post('/api/user-preferences', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'Preferences must be an array.' });
    }

    await prisma.$transaction(
      preferences.map(pref => 
        prisma.userJugPreference.upsert({
          where: {
            userId_jugBrandId: {
              userId,
              jugBrandId: pref.jugBrandId
            }
          },
          update: { quantity: pref.quantity },
          create: {
            userId,
            jugBrandId: pref.jugBrandId,
            quantity: pref.quantity
          }
        })
      )
    );

    res.json({ message: 'Preferencias guardadas exitosamente.' });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({ error: 'Error al guardar preferencias.' });
  }
});

app.delete('/api/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
        // 0. Eliminar preferencias de garrafones
        await tx.userJugPreference.deleteMany({
            where: { userId: id }
        });

        // 1. Eliminar transacciones de fidelidad
        await tx.loyaltyTransaction.deleteMany({
            where: { userId: id }
        });

        // 2. Limpiar Pedidos (donde el usuario es cliente o repartidor)
        // Primero, desvincular como repartidor para no borrarlos
        await tx.pedido.updateMany({
            where: { repartidorId: id },
            data: { repartidorId: null }
        });

        // Ahora tratar los pedidos donde es el CLIENTE (estos sí se limpian sus dependencias)
        const userOrders = await tx.pedido.findMany({
            where: { clienteId: id },
            select: { id: true }
        });
        
        const orderIds = userOrders.map(o => o.id);

        if (orderIds.length > 0) {
            await tx.pedidoItem.deleteMany({
                where: { pedidoId: { in: orderIds } }
            });
            await tx.ingreso.deleteMany({
                where: { pedidoId: { in: orderIds } }
            });
            await tx.transaccionCaja.deleteMany({
                where: { pedidoId: { in: orderIds } }
            });
            await tx.pedido.deleteMany({
                where: { id: { in: orderIds } }
            });
        }
        
        // 3. Limpiar Sesiones de Caja (donde es vendedor)
        // Desvincular transacciones de caja que dependen de sus sesiones
        const userSessions = await tx.sesionCaja.findMany({
            where: { vendedorId: id },
            select: { id: true }
        });
        const sessionIds = userSessions.map(s => s.id);
        
        if (sessionIds.length > 0) {
            await tx.transaccionCaja.deleteMany({
                where: { sesionId: { in: sessionIds } }
            });
            await tx.sesionCaja.deleteMany({
                where: { id: { in: sessionIds } }
            });
        }

        // 4. Desvincular de empleado si existe
        const empleado = await tx.empleado.findUnique({ where: { userId: id } });
        if (empleado) {
             await tx.empleado.update({
                 where: { id: empleado.id },
                 data: { userId: null }
             });
        }

        // 5. Finalmente, eliminar el usuario
        await tx.user.delete({
            where: { id },
        });
    });

    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Error deleting user', details: error.message });
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
        user: { include: { roleRelation: true } }, 
        documentos: true,
        manager: true,
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
        user: { include: { roleRelation: true } }, 
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
  const { 
    userId, 
    fechaContratacion, 
    managerId, 
    role, 
    roleId, 
    password, 
    newPassword, 
    accessEmail,
    _createAccount,
    ...data 
  } = req.body;

  try {
    const empleadoData = {
      ...data,
      fechaContratacion: new Date(fechaContratacion),
    };

    if (userId) {
      empleadoData.user = { connect: { id: userId } };
      
      // Si se proporcionó un nuevo password o roleId, actualizamos el usuario
      if (password || newPassword || roleId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            ...(password || newPassword ? { password: password || newPassword } : {}),
            ...(roleId ? { roleId } : {})
          }
        });
      }
    }
    
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
  const {
    userId,
    fechaContratacion,
    fechaTerminacion,
    managerId,
    roleId,
    emailPersonal,
    nombreCompleto,
    newPassword,
    _createAccount,
    documentos, user, manager, subordinados, historialSueldos, createdAt, updatedAt, id: employeeId, role, accessEmail, password,
    ...data
  } = req.body;

  const VALID_ENUM_ROLES = ['ADMIN', 'VENDEDOR', 'VENTA', 'REPARTIDOR', 'CLIENTE'];

  try {
    const result = await prisma.$transaction(async (tx) => {
        const empleadoData = { ...data };
        if (nombreCompleto) empleadoData.nombreCompleto = nombreCompleto;
        if (emailPersonal) empleadoData.emailPersonal = emailPersonal;

        if (fechaContratacion) empleadoData.fechaContratacion = new Date(fechaContratacion);
        if (fechaTerminacion) empleadoData.fechaTerminacion = new Date(fechaTerminacion);
        else if (req.body.hasOwnProperty('fechaTerminacion')) empleadoData.fechaTerminacion = null;

        if (req.body.hasOwnProperty('userId')) {
            if (userId && userId !== "null") empleadoData.userId = userId;
            else empleadoData.userId = null;
        }

        if (req.body.hasOwnProperty('managerId')) {
            if (managerId && managerId !== "null") empleadoData.managerId = managerId;
            else empleadoData.managerId = null;
        }

        const currentEmpleado = await tx.empleado.findUnique({ where: { id }, select: { userId: true, nombreCompleto: true } });
        let finalUserId = (userId !== undefined) ? userId : currentEmpleado?.userId;

        if (!finalUserId && _createAccount) {
            const roleRec = await tx.role.findUnique({ where: { id: _createAccount.roleId } });
            const legacyRole = VALID_ENUM_ROLES.includes(roleRec?.name) ? roleRec.name : (roleRec?.canAccessPOS ? 'VENDEDOR' : 'VENTA');
            const newUser = await tx.user.create({
                data: {
                    name: nombreCompleto || currentEmpleado.nombreCompleto,
                    email: _createAccount.email,
                    password: await bcrypt.hash(_createAccount.password, 10),
                    roleId: _createAccount.roleId,
                    role: legacyRole,
                    customId: `EMP-${Math.floor(Math.random() * 900) + 100}`
                }
            });
            finalUserId = newUser.id;
            empleadoData.userId = newUser.id;
        } else if (finalUserId && finalUserId !== "null" && finalUserId !== null) {
            const userUpdateData = {};
            if (nombreCompleto) userUpdateData.name = nombreCompleto;
            if (emailPersonal) userUpdateData.email = emailPersonal;
            if (newPassword) userUpdateData.password = await bcrypt.hash(newPassword, 10);
            if (roleId) {
                userUpdateData.roleId = roleId;
                const roleRec = await tx.role.findUnique({ where: { id: roleId } });
                if (roleRec) {
                    userUpdateData.role = VALID_ENUM_ROLES.includes(roleRec.name) ? roleRec.name : (roleRec.canAccessPOS ? 'VENDEDOR' : 'VENTA');
                }
            }
            if (Object.keys(userUpdateData).length > 0) {
                await tx.user.update({ where: { id: finalUserId }, data: userUpdateData });
            }
        }

        return await tx.empleado.update({
            where: { id },
            data: empleadoData,
            include: { 
                user: { include: { roleRelation: true } },
                manager: true 
            },
        });
    });
    res.json(result);
  } catch (error) {
    console.error(`Error updating empleado ${id}:`, error);
    res.status(500).json({ error: 'Error al actualizar el empleado.', details: error.message });
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
        cliente: { // Incluir datos del cliente para coordenadas por defecto
            select: {
                lat: true,
                lng: true,
                street: true, // Útil para mostrar dirección
                neighborhood: true
            }
        },
        repartidor: { // Incluir datos del repartidor para el tracking
            select: {
                lat: true,
                lng: true,
                name: true,
                phone: true
            }
        },
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
    const { role, id } = req.user;
    
    // Construir filtro base
    const where = {};

    // Si NO es ADMIN, filtrar por la sucursal del usuario
    if (role !== 'ADMIN') {
        const user = await prisma.user.findUnique({ where: { id }, select: { storeId: true } });
        if (user && user.storeId) {
            where.storeId = user.storeId;
        } else {
            // Si es vendedor pero no tiene tienda asignada, no debería ver nada por seguridad
            return res.json([]); 
        }
    }

    const pedidos = await prisma.pedido.findMany({
      where, // Aplicar filtro
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
    paymentStatus,
    storeId, // NEW: Try to get from body
    pointsUsed // NEW: Loyalty points to redeem
  } = req.body;

  // Validación corregida para permitir total 0 (cuando se usan puntos)
  if (!items || total === undefined || total === null || !deliveryMethod) {
    return res.status(400).json({ error: 'Faltan datos requeridos para crear el pedido.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // --- PASO 0: Determinar la Sucursal (Store) ---
      if (!storeId) {
          // 1. Try to find store from client preference
          if (clienteId) {
               const client = await tx.user.findUnique({ where: { id: clienteId } });
               if (client && client.storeId) {
                   storeId = client.storeId;
               }
          }
          
          // 2. Fallback to first available store if still null
          if (!storeId) {
               const firstStore = await tx.store.findFirst();
               if (firstStore) {
                   storeId = firstStore.id;
               } else {
                   throw new Error('No hay sucursales configuradas para procesar el pedido.');
               }
          }
      }

      // --- PASO 0.5: Validar y Procesar Puntos (Si aplica) ---
      if (pointsUsed && pointsUsed > 0) {
          if (!clienteId) throw new Error('Se requiere un cliente registrado para usar puntos.');
          
          const client = await tx.user.findUnique({ where: { id: clienteId } });
          if (!client || client.loyaltyPoints < pointsUsed) {
              throw new Error('No tienes suficientes puntos para realizar este canje.');
          }

          // Descontar puntos
          await tx.user.update({
              where: { id: clienteId },
              data: { loyaltyPoints: { decrement: pointsUsed } }
          });
      }

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
        // Nota: Asignamos el invitado a la tienda del pedido si no tiene una
        const guestUser = await tx.user.create({
          data: {
            name: 'Cliente Web Invitado',
            customId: guestCustomId,
            role: 'CLIENTE',
            store: { connect: { id: storeId } }
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
          store: { connect: { id: storeId } },
          sesionCaja: req.body.sesionCajaId ? { connect: { id: req.body.sesionCajaId } } : undefined,
          deliveryLat: req.body.deliveryLat ? parseFloat(req.body.deliveryLat) : undefined,
          deliveryLng: req.body.deliveryLng ? parseFloat(req.body.deliveryLng) : undefined,
          deliveryTimeSlot: req.body.deliveryTimeSlot || null,
        },
      });

      // --- PASO 2.7: Registrar en Caja si está PAGADO ---
      if (paymentStatus === 'PAGADO' && req.body.sesionCajaId) {
          await tx.transaccionCaja.create({
              data: {
                  tipo: 'VENTA',
                  amount: total,
                  description: `Venta Mostrador ${customId}`,
                  sesion: { connect: { id: req.body.sesionCajaId } },
                  pedido: { connect: { id: newPedido.id } }
              }
          });
      }

      // --- PASO 2.5: Registrar transacción de puntos (Si aplica) ---
      if (pointsUsed && pointsUsed > 0) {
          await tx.loyaltyTransaction.create({
              data: {
                  amount: -pointsUsed, // Negativo porque se gastaron
                  type: 'REDEEMED',
                  description: `Canje en pedido ${customId}`,
                  orderId: newPedido.id,
                  user: { connect: { id: clienteId } }
              }
          });
      }

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

    const { status, paymentMethod, repartidorId } = req.body; // paymentMethod might be sent for cash, or we fetch it from existing order

  

    if (!status) {

      return res.status(400).json({ error: 'El estado (status) es requerido.' });

    }

  

    // Validar que el status sea uno de los valores del enum PedidoStatus

    const VALID_PEDIDO_STATUS = ['PENDIENTE', 'EN_PROCESO', 'EN_RUTA', 'ENTREGADO', 'CANCELADO'];

  

    if (!VALID_PEDIDO_STATUS.includes(status)) {

      return res.status(400).json({ error: `Estado de pedido inválido. Valores permitidos: ${VALID_PEDIDO_STATUS.join(', ')}.` });

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

            clienteId: true, // Need clienteId for loyalty points

          },

        });

  

        if (!existingPedido) {

          throw new Error('Pedido no encontrado.'); // Throw to rollback transaction

        }

        

        // Determine the actual payment method. Prioritize what's sent in body, then what's in DB.

        const actualPaymentMethod = paymentMethod || existingPedido.paymentMethod;

  

        // 2. Prepare update data

        const dataToUpdate = { status };

  

        if (paymentMethod) {

          dataToUpdate.paymentMethod = paymentMethod;

        }

  

        // Handle Repartidor Assignment

        if (repartidorId !== undefined) { // Check for undefined to allow null (unassign)

            if (repartidorId) {

                dataToUpdate.repartidor = { connect: { id: repartidorId } };

            } else {

                dataToUpdate.repartidor = { disconnect: true };

            }

        }

  

        // If status is ENTREGADO, mark as PAGADO automatically (unless it's credit, but simplifying for now)

        if (status === 'ENTREGADO') {

          dataToUpdate.paymentStatus = 'PAGADO';

        }

  

        // 3. Perform the update

      const pedido = await tx.pedido.update({

        where: { id },

        data: dataToUpdate,

        include: {

          cliente: true,

          items: {

            include: {

              product: true,

              servicePrice: {

                include: {

                  waterType: true,

                  jugBrands: true, 

                },

              },

            },

          },

        },

      });



      // --- LOYALTY POINTS LOGIC ---

      // If status changed to ENTREGADO and it wasn't before

      if (status === 'ENTREGADO' && existingPedido.status !== 'ENTREGADO') {

          const pointsEarned = Math.floor(existingPedido.total / 10);

          if (pointsEarned > 0) {

              // Award points to user

              await tx.user.update({

                  where: { id: existingPedido.clienteId },

                  data: { loyaltyPoints: { increment: pointsEarned } }

              });



              // Log transaction

              await tx.loyaltyTransaction.create({

                  data: {

                      amount: pointsEarned,

                      type: 'EARNED',

                      description: `Puntos por pedido ${existingPedido.customId}`,

                      orderId: id,

                      user: { connect: { id: existingPedido.clienteId } }

                  }

              });

          }

      }



      // 4. If status is ENTREGADO and payment is Efectivo, record cash transaction

      if (status === 'ENTREGADO' && actualPaymentMethod === 'Efectivo') {

        // Ensure only a VENDEDOR, ADMIN, or REPARTIDOR can perform this action

        if (req.user.role !== 'VENDEDOR' && req.user.role !== 'ADMIN' && req.user.role !== 'REPARTIDOR') {

          throw new Error('Solo vendedores, administradores o repartidores pueden registrar ventas en caja.');

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
//  REPORTS API (Advanced)
// ====================================================================

app.get('/api/reports/consolidated', verifyToken, async (req, res) => {
    try {
        console.log("Generando reporte consolidado (Manual Aggregation)...");

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acceso denegado.' });
        }

        // 1. Fetch data
        const stores = await prisma.store.findMany({ select: { id: true, name: true } });
        
        // Fetch ALL incomes/expenses (optimized select)
        // This avoids groupBy issues with nulls or strict SQL modes
        const allIncomes = await prisma.ingreso.findMany({ select: { amount: true, storeId: true } });
        const allExpenses = await prisma.gasto.findMany({ select: { amount: true, storeId: true } });

        console.log(`Procesando ${allIncomes.length} ingresos y ${allExpenses.length} gastos.`);

        // 2. Manual Aggregation
        const reportMap = {};

        // Initialize map with stores
        stores.forEach(store => {
            reportMap[store.id] = {
                id: store.id,
                name: store.name,
                totalIncome: 0,
                totalExpense: 0,
                netProfit: 0
            };
        });

        // Add Global category
        reportMap['global'] = {
            id: 'global',
            name: 'Operaciones Globales',
            totalIncome: 0,
            totalExpense: 0,
            netProfit: 0
        };

        // Sum Incomes
        allIncomes.forEach(inc => {
            const key = inc.storeId && reportMap[inc.storeId] ? inc.storeId : 'global';
            reportMap[key].totalIncome += (inc.amount || 0);
        });

        // Sum Expenses
        allExpenses.forEach(exp => {
            const key = exp.storeId && reportMap[exp.storeId] ? exp.storeId : 'global';
            reportMap[key].totalExpense += (exp.amount || 0);
        });

        // Calculate Profit & Format
        const report = Object.values(reportMap).map(item => ({
            ...item,
            netProfit: item.totalIncome - item.totalExpense
        }));

        // Filter out empty global if needed, or keep it. Let's keep it if it has data.
        const finalReport = report.filter(item => 
            item.id !== 'global' || (item.totalIncome > 0 || item.totalExpense > 0)
        );

        res.json(finalReport);

    } catch (error) {
        console.error('Error manual aggregation consolidated report:', error);
        res.status(500).json({ error: 'Error al generar reporte: ' + error.message });
    }
});


// =====================================================
// EXTERNAL SERVICES (New Section)
// =====================================================

// --- Geocoding Proxy (to bypass CORS and add stability) ---
app.get('/api/external/geocode', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const fetchFromNominatim = async (q) => {
        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: { q, format: 'json', limit: 1 },
                headers: { 'User-Agent': 'DarmaxApp/1.0 (erick.rendon@galavi.com)' }
            });
            return response.data && response.data.length > 0 ? response.data[0] : null;
        } catch (error) {
            console.error(`Nominatim error for q=${q}:`, error.message);
            return null;
        }
    };

    try {
        console.log(`Geocoding proxy: Starting cascade for [${query}]`);
        
        // Intento 1: Dirección completa
        let result = await fetchFromNominatim(query);

        // Intento 2: Si falla, limpiar la calle (quitar m6, l7, etc)
        if (!result) {
            // Buscamos patrones como "mX", "lX", "manzana", "lote" y los removemos para la búsqueda
            const simplifiedQuery = query
                .replace(/\b(m\d+|l\d+|m\s+\d+|l\s+\d+|manzana|lote)\b/gi, '')
                .replace(/\s\s+/g, ' ') // Quitar espacios dobles
                .trim();
            
            if (simplifiedQuery !== query) {
                console.log(`Geocoding proxy: Try 2 (Simplified): [${simplifiedQuery}]`);
                result = await fetchFromNominatim(simplifiedQuery);
            }
        }

        // Intento 3: Si falla, buscar solo Calle (Simplificada) + Ciudad + País
        if (!result) {
            const parts = query.split(',');
            const simpleStreet = parts[0].replace(/\b(m\d+|l\d+|m\s+\d+|l\s+\d+|manzana|lote)\b/gi, '').trim();
            if (parts.length >= 3) {
                const verySimple = `${simpleStreet}, ${parts[2]}, Mexico`.trim();
                console.log(`Geocoding proxy: Try 3 (Basic): [${verySimple}]`);
                result = await fetchFromNominatim(verySimple);
            }
        }

        // Intento 4: El "Último Recurso" - Solo Código Postal
        if (!result) {
            const cpMatch = query.match(/\b\d{5}\b/); // Busca 5 números seguidos (CP)
            if (cpMatch) {
                const cpOnly = `${cpMatch[0]}, Mexico`;
                console.log(`Geocoding proxy: Try 4 (Postal Code Fallback): [${cpOnly}]`);
                result = await fetchFromNominatim(cpOnly);
            }
        }

        if (result) {
            return res.json({
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                displayName: result.display_name
            });
        } else {
            return res.json({ lat: null, lng: null });
        }

    } catch (error) {
        console.error('Geocoding proxy critical error:', error.message);
        res.status(502).json({ error: 'Geocoding service unavailable' });
    }
});

// --- DIPOMEX Proxy ---
app.get('/api/external/dipomex/codigo_postal', async (req, res) => {
  const { cp } = req.query;

  if (!cp) {
    return res.status(400).json({ error: 'El parámetro "cp" (código postal) es requerido.' });
  }

  try {
    const response = await axios.get('https://api.tau.com.mx/dipomex/v1/codigo_postal', {
      params: { cp },
      headers: {
        'APIKEY': process.env.DIPOMEX_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching postal code from Dipomex:', error.message);
    // Si Dipomex devuelve error, lo pasamos al cliente
    if (error.response) {
       return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: 'Error al consultar el servicio de código postal.' });
  }
});

// =====================================================
// COTIZACIONES API
// =====================================================

// POST: Crear nueva cotización
app.post('/api/cotizaciones', verifyToken, async (req, res) => {
  try {
    const data = req.body;
    
    const newQuote = await prisma.cotizacion.create({
      data: {
        nombreCliente: data.cliente.nombre,
        telefono: data.cliente.telefono,
        correo: data.cliente.correo,
        cp: data.cliente.cp,
        
        modeloNombre: data.costos.modeloNombre,
        modeloPrecio: parseFloat(data.costos.modelo) || 0,
        fleteTinacos: parseFloat(data.costos.fleteTinacos) || 0,
        viaticos: parseFloat(data.costos.viaticos) || 0,
        
        // Prisma maneja arrays JSON automáticamente
        extras: data.extrasSeleccionados || [], 
        
        promoTexto: data.promo.texto,
        promoCosto: data.promo.costo ? parseFloat(data.promo.costo) : null,
        promoImagen: data.promo.imagenUrl,
        
        firma: data.firma,
        
        fecha: data.fecha ? new Date(data.fecha) : new Date(), // Usar fecha del servidor para consistencia
        diasValidez: parseInt(data.diasValidez) || 5, // Añadir diasValidez
      }
    });
    
    res.status(201).json(newQuote);
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Error al guardar la cotización' });
  }
});

// GET: Obtener una cotización por ID (para reimprimir)
app.get('/api/cotizaciones/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const quote = await prisma.cotizacion.findUnique({
            where: { id }
        });
        if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
        res.json(quote);
    } catch (error) {
        console.error('Error fetching quote:', error);
        res.status(500).json({ error: 'Error al obtener la cotización' });
    }
});

// GET: Obtener una cotización por folio
app.get('/api/cotizaciones/folio/:folio', verifyToken, async (req, res) => {
    const { folio } = req.params;
    try {
        const quote = await prisma.cotizacion.findFirst({
            where: { folio: parseInt(folio) }
        });
        if (!quote) return res.status(404).json({ error: 'Cotización no encontrada con ese folio.' });
        res.json(quote);
    } catch (error) {
        console.error('Error fetching quote by folio:', error);
        res.status(500).json({ error: 'Error al obtener la cotización por folio.' });
    }
});

// GET: Obtener cotizaciones por nombre de cliente
app.get('/api/cotizaciones/cliente/:nombre', verifyToken, async (req, res) => {
    const { nombre } = req.params;
    try {
        const quotes = await prisma.cotizacion.findMany({
            where: {
                nombreCliente: {
                    contains: nombre,
                    mode: 'insensitive', // Case-insensitive search
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });
        res.json(quotes);
    } catch (error) {
        console.error('Error fetching quotes by client name:', error);
        res.status(500).json({ error: 'Error al obtener las cotizaciones por nombre de cliente.' });
    }
});

// =====================================================
// SOLICITUDES DE PRODUCTO API (NUEVO)
// =====================================================

// GET: Obtener todas las solicitudes de producto
app.get('/api/solicitudes', verifyToken, async (req, res) => {
    try {
        const solicitudes = await prisma.solicitudProducto.findMany({
            orderBy: {
                folio: 'desc'
            }
        });
        res.json(solicitudes);
    } catch (error) {
        console.error('Error fetching product requests:', error);
        res.status(500).json({ error: 'Error al obtener las solicitudes de producto.' });
    }
});

// POST: Crear nueva solicitud de producto
app.post('/api/solicitudes', verifyToken, async (req, res) => {
  try {
    const data = req.body;
    
    const newSolicitud = await prisma.solicitudProducto.create({
      data: {
        fecha: new Date(), // Usar fecha del servidor
        billingInfo: data.billingInfo || {},
        items: data.items || [],
        mode: data.mode || "pedido",
        providerLabel: data.providerLabel || "",
        notes: data.notes || null,
      }
    });
    
    res.status(201).json(newSolicitud);
  } catch (error) {
    console.error('Error creating product request:', error);
    res.status(500).json({ error: 'Error al guardar la solicitud de producto' });
  }
});

// GET: Obtener una solicitud de producto por ID
app.get('/api/solicitudes/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const solicitud = await prisma.solicitudProducto.findUnique({
            where: { id }
        });
        if (!solicitud) return res.status(404).json({ error: 'Solicitud de producto no encontrada' });
        res.json(solicitud);
    } catch (error) {
        console.error('Error fetching product request:', error);
        res.status(500).json({ error: 'Error al obtener la solicitud de producto' });
    }
});

// DELETE: Borrar una solicitud de producto por ID
app.delete('/api/solicitudes/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.solicitudProducto.delete({
            where: { id }
        });
        res.status(204).send(); // No content
    } catch (error) {
        console.error(`Error deleting solicitud ${id}:`, error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Solicitud no encontrada.' });
        }
        res.status(500).json({ error: 'Error al borrar la solicitud.' });
    }
});

// GET: Obtener una solicitud de producto por folio
app.get('/api/solicitudes/folio/:folio', verifyToken, async (req, res) => {
    const { folio } = req.params;
    try {
        const solicitud = await prisma.solicitudProducto.findFirst({
            where: { folio: parseInt(folio) }
        });
        if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada con ese folio.' });
        res.json(solicitud);
    } catch (error) {
        console.error('Error fetching product request by folio:', error);
        res.status(500).json({ error: 'Error al obtener la solicitud por folio.' });
    }
});

// PUT: Actualizar una solicitud de producto por ID
app.put('/api/solicitudes/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const data = req.body;
        console.log("--- UPDATING SOLICITUD ---");
        console.log("ID:", id);
        console.log("Received Body:", JSON.stringify(data, null, 2));

        const updatedSolicitud = await prisma.solicitudProducto.update({
            where: { id },
            data: {
                billingInfo: data.billingInfo || {},
                items: data.items || [],
                mode: data.mode || "pedido",
                providerLabel: data.providerLabel || "",
                notes: data.notes || null,
            }
        });
        res.json(updatedSolicitud);
    } catch (error) {
        console.error(`Error updating solicitud ${id}:`, error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Solicitud no encontrada.' });
        }
        res.status(500).json({ error: 'Error al actualizar la solicitud.' });
    }
});

// ====================================================================
//  START SERVER
// ====================================================================
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

// Forced restart trigger for Prisma Client update
