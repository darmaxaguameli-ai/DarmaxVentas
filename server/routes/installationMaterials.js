const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken, requirePermission } = require('../middleware/auth');
const crypto = require('crypto');

// Función auxiliar para generar un ID tipo cuid/hex si no se usa cuid nativo
const generateId = () => 'mat_' + crypto.randomBytes(12).toString('hex');

// Asegurar que la tabla exista en PostgreSQL automáticamente
let tableInitialized = false;
const ensureTable = async () => {
  if (tableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InstallationMaterial" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "code" TEXT,
        "category" TEXT NOT NULL DEFAULT 'General',
        "stock" INTEGER NOT NULL DEFAULT 0,
        "minStock" INTEGER NOT NULL DEFAULT 5,
        "unit" TEXT NOT NULL DEFAULT 'Pza',
        "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "imageUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "InstallationMaterial_name_key" ON "InstallationMaterial"("name");

      CREATE TABLE IF NOT EXISTS "InstallationCategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "InstallationCategory_name_key" ON "InstallationCategory"("name");
    `);

    // Insertar categorías técnicas por defecto si la tabla está vacía
    const existingCats = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "InstallationCategory";`);
    const count = parseInt(existingCats[0]?.count, 10) || 0;
    if (count === 0) {
      const defaultCats = [
        "General",
        "Filtración & Membranas",
        "Tubería & Conexiones",
        "Bombas & Motores",
        "Eléctrico & Control",
        "Tornillería & Fijación",
        "Insumos Químicos"
      ];
      for (const catName of defaultCats) {
        const catId = generateId();
        await prisma.$executeRawUnsafe(`
          INSERT INTO "InstallationCategory" ("id", "name", "createdAt", "updatedAt")
          VALUES ($1, $2, NOW(), NOW())
          ON CONFLICT ("name") DO NOTHING;
        `, catId, catName);
      }
    }

    tableInitialized = true;
  } catch (err) {
    console.warn("Aviso al verificar tabla InstallationMaterial/InstallationCategory:", err.message);
  }
};

// ====================================================================
// 1. GET: Listar todos los materiales de instalación
// ====================================================================
router.get('/installation-materials', verifyToken, async (req, res) => {
  try {
    await ensureTable();

    // Intentar vía modelo de Prisma si está generado
    if (prisma.installationMaterial) {
      const items = await prisma.installationMaterial.findMany({
        orderBy: { name: 'asc' }
      });
      return res.json(items);
    }

    // Fallback directo a PostgreSQL
    const items = await prisma.$queryRawUnsafe(`
      SELECT * FROM "InstallationMaterial" ORDER BY "name" ASC;
    `);
    res.json(items);
  } catch (error) {
    console.error("Error al obtener materiales de instalación:", error);
    res.status(500).json({ error: 'Error al consultar inventario de instalación', details: error.message });
  }
});

// ====================================================================
// 2. POST: Registrar nuevo material de instalación
// ====================================================================
router.post('/installation-materials', verifyToken, requirePermission(['canAccessInstallation', 'canAccessInventory', 'acceso.inventarioparainstalacion', 'acceso.inventarioglobal', 'canAccessConfig']), async (req, res) => {
  try {
    await ensureTable();

    const {
      name,
      code = null,
      category = 'General',
      stock = 0,
      minStock = 5,
      unit = 'Pza',
      cost = 0,
      imageUrl = null,
      status = 'ACTIVE',
      notes = null
    } = req.body;

    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'El nombre del material es requerido' });
    }

    const cleanStock = parseInt(stock, 10) || 0;
    const cleanMinStock = parseInt(minStock, 10) || 0;
    const cleanCost = parseFloat(cost) || 0;

    if (prisma.installationMaterial) {
      const created = await prisma.installationMaterial.create({
        data: {
          name: trimmedName,
          code: code ? String(code).trim() : null,
          category: String(category || 'General').trim(),
          stock: cleanStock,
          minStock: cleanMinStock,
          unit: String(unit || 'Pza').trim(),
          cost: cleanCost,
          imageUrl: imageUrl || null,
          status: status || 'ACTIVE',
          notes: notes || null
        }
      });
      return res.status(201).json(created);
    }

    // Fallback SQL
    const id = generateId();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "InstallationMaterial" 
      ("id", "name", "code", "category", "stock", "minStock", "unit", "cost", "imageUrl", "status", "notes", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      ON CONFLICT ("name") DO UPDATE SET
        "stock" = "InstallationMaterial"."stock" + EXCLUDED."stock",
        "cost" = EXCLUDED."cost",
        "updatedAt" = NOW()
      RETURNING *;
    `, id, trimmedName, code, category, cleanStock, cleanMinStock, unit, cleanCost, imageUrl, status, notes);

    const inserted = await prisma.$queryRawUnsafe(`SELECT * FROM "InstallationMaterial" WHERE "id" = $1 LIMIT 1;`, id);
    res.status(201).json(inserted[0] || { id, name: trimmedName });
  } catch (error) {
    console.error("Error al crear material de instalación:", error);
    res.status(500).json({ error: 'Error al registrar material de instalación', details: error.message });
  }
});

// ====================================================================
// 3. POST BULK: Carga Masiva de Materiales de Instalación
// ====================================================================
router.post('/installation-materials/bulk', verifyToken, requirePermission(['canAccessInstallation', 'canAccessInventory', 'acceso.inventarioparainstalacion']), async (req, res) => {
  try {
    await ensureTable();

    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Se esperaba un arreglo de materiales' });
    }

    const insertedItems = [];
    for (const raw of items) {
      const name = String(raw.name || raw.nombre || '').trim();
      if (!name) continue;

      const category = String(raw.category || raw.categoria || 'General').trim();
      const unit = String(raw.unit || raw.unidad || 'Pza').trim();
      const stock = parseInt(raw.stock || raw.existencia || raw.cantidad || 0, 10) || 0;
      const cost = parseFloat(raw.cost || raw.costo || raw.price || raw.precio || 0) || 0;
      const imageUrl = raw.imageUrl || raw.imagen || null;
      const code = raw.code || raw.codigo || null;

      if (prisma.installationMaterial) {
        const item = await prisma.installationMaterial.upsert({
          where: { name },
          create: {
            name,
            code,
            category,
            unit,
            stock,
            cost,
            imageUrl,
            status: 'ACTIVE'
          },
          update: {
            stock,
            cost,
            unit,
            category,
            imageUrl: imageUrl || undefined
          }
        });
        insertedItems.push(item);
      } else {
        const id = generateId();
        await prisma.$executeRawUnsafe(`
          INSERT INTO "InstallationMaterial" 
          ("id", "name", "code", "category", "stock", "minStock", "unit", "cost", "imageUrl", "status", "notes", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, 5, $6, $7, $8, 'ACTIVE', NULL, NOW(), NOW())
          ON CONFLICT ("name") DO UPDATE SET
            "stock" = EXCLUDED."stock",
            "cost" = EXCLUDED."cost",
            "unit" = EXCLUDED."unit",
            "category" = EXCLUDED."category",
            "updatedAt" = NOW();
        `, id, name, code, category, stock, unit, cost, imageUrl);
        insertedItems.push({ name, stock });
      }
    }

    res.status(201).json({ count: insertedItems.length, message: 'Carga masiva de materiales completada con éxito' });
  } catch (error) {
    console.error("Error en bulk de materiales de instalación:", error);
    res.status(500).json({ error: 'Error durante la carga masiva', details: error.message });
  }
});

// ====================================================================
// 4. PUT: Actualizar material de instalación
// ====================================================================
router.put('/installation-materials/:id', verifyToken, requirePermission(['canAccessInstallation', 'canAccessInventory', 'acceso.inventarioparainstalacion', 'acceso.inventarioglobal', 'canAccessConfig']), async (req, res) => {
  try {
    await ensureTable();

    const { id } = req.params;
    const {
      name,
      code,
      category,
      stock,
      minStock,
      unit,
      cost,
      imageUrl,
      status,
      notes
    } = req.body;

    const cleanStock = stock !== undefined ? parseInt(stock, 10) || 0 : undefined;
    const cleanMinStock = minStock !== undefined ? parseInt(minStock, 10) || 0 : undefined;
    const cleanCost = cost !== undefined ? parseFloat(cost) || 0 : undefined;

    if (prisma.installationMaterial) {
      const updated = await prisma.installationMaterial.update({
        where: { id },
        data: {
          name: name ? String(name).trim() : undefined,
          code: code !== undefined ? (code ? String(code).trim() : null) : undefined,
          category: category ? String(category).trim() : undefined,
          stock: cleanStock,
          minStock: cleanMinStock,
          unit: unit ? String(unit).trim() : undefined,
          cost: cleanCost,
          imageUrl: imageUrl !== undefined ? imageUrl : undefined,
          status: status || undefined,
          notes: notes !== undefined ? notes : undefined
        }
      });
      return res.json(updated);
    }

    // Fallback SQL
    await prisma.$executeRawUnsafe(`
      UPDATE "InstallationMaterial"
      SET 
        "name" = COALESCE($2, "name"),
        "code" = COALESCE($3, "code"),
        "category" = COALESCE($4, "category"),
        "stock" = COALESCE($5, "stock"),
        "minStock" = COALESCE($6, "minStock"),
        "unit" = COALESCE($7, "unit"),
        "cost" = COALESCE($8, "cost"),
        "imageUrl" = COALESCE($9, "imageUrl"),
        "status" = COALESCE($10, "status"),
        "notes" = COALESCE($11, "notes"),
        "updatedAt" = NOW()
      WHERE "id" = $1;
    `, id, name, code, category, cleanStock, cleanMinStock, unit, cleanCost, imageUrl, status, notes);

    const updated = await prisma.$queryRawUnsafe(`SELECT * FROM "InstallationMaterial" WHERE "id" = $1 LIMIT 1;`, id);
    res.json(updated[0] || { id });
  } catch (error) {
    console.error("Error al actualizar material de instalación:", error);
    res.status(500).json({ error: 'Error al actualizar material de instalación', details: error.message });
  }
});

// ====================================================================
// 5. DELETE: Eliminar material de instalación
// ====================================================================
router.delete('/installation-materials/:id', verifyToken, requirePermission(['canAccessInstallation', 'canAccessInventory', 'acceso.inventarioparainstalacion', 'acceso.inventarioglobal', 'canAccessConfig']), async (req, res) => {
  try {
    await ensureTable();

    const { id } = req.params;

    if (prisma.installationMaterial) {
      await prisma.installationMaterial.delete({ where: { id } });
      return res.status(204).send();
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "InstallationMaterial" WHERE "id" = $1;`, id);
    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar material de instalación:", error);
    res.status(500).json({ error: 'Error al eliminar material de instalación', details: error.message });
  }
});

// ====================================================================
// 6. CATEGORÍAS TÉCNICAS DE INSTALACIÓN (CRUD)
// ====================================================================
router.get('/installation-categories', verifyToken, async (req, res) => {
  try {
    await ensureTable();
    const items = await prisma.$queryRawUnsafe(`SELECT * FROM "InstallationCategory" ORDER BY "name" ASC;`);
    res.json(items);
  } catch (error) {
    console.error("Error al obtener categorías de instalación:", error);
    res.status(500).json({ error: 'Error al consultar categorías de instalación', details: error.message });
  }
});

router.post('/installation-categories', verifyToken, requirePermission(['canAccessInstallation', 'canAccessInventory', 'acceso.inventarioparainstalacion', 'acceso.inventarioglobal', 'canAccessConfig']), async (req, res) => {
  try {
    await ensureTable();
    const { name } = req.body;
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
    }
    const id = generateId();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "InstallationCategory" ("id", "name", "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT ("name") DO NOTHING;
    `, id, trimmedName);

    const inserted = await prisma.$queryRawUnsafe(`SELECT * FROM "InstallationCategory" WHERE "name" = $1 LIMIT 1;`, trimmedName);
    res.status(201).json(inserted[0] || { id, name: trimmedName });
  } catch (error) {
    console.error("Error al crear categoría de instalación:", error);
    res.status(500).json({ error: 'Error al registrar categoría', details: error.message });
  }
});

router.delete('/installation-categories/:id', verifyToken, requirePermission(['canAccessInstallation', 'canAccessInventory', 'acceso.inventarioparainstalacion', 'acceso.inventarioglobal', 'canAccessConfig']), async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const found = await prisma.$queryRawUnsafe(`SELECT * FROM "InstallationCategory" WHERE "id" = $1 LIMIT 1;`, id);
    const category = found[0];
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Validar si existen materiales de instalación asignados a esta categoría
    const assignedMaterials = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM "InstallationMaterial" WHERE "category" = $1;
    `, category.name);
    const count = parseInt(assignedMaterials[0]?.count, 10) || 0;

    if (count > 0) {
      return res.status(400).json({
        error: `No se puede eliminar la categoría técnica "${category.name}" porque tiene ${count} ${count === 1 ? 'material asignado' : 'materiales asignados'}. Para borrarla, no debe tener materiales asociados.`
      });
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "InstallationCategory" WHERE "id" = $1;`, id);
    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar categoría de instalación:", error);
    res.status(500).json({ error: 'Error al eliminar categoría de instalación', details: error.message });
  }
});

router.post('/installation-categories/batch-delete', verifyToken, requirePermission(['canAccessInstallation', 'canAccessInventory', 'acceso.inventarioparainstalacion', 'acceso.inventarioglobal', 'canAccessConfig']), async (req, res) => {
  try {
    await ensureTable();
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo de IDs a eliminar.' });
    }

    const deleted = [];
    const blocked = [];

    for (const id of ids) {
      const found = await prisma.$queryRawUnsafe(`SELECT * FROM "InstallationCategory" WHERE "id" = $1 LIMIT 1;`, id);
      const cat = found[0];
      if (!cat) continue;

      const assigned = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "InstallationMaterial" WHERE "category" = $1;`, cat.name);
      const count = parseInt(assigned[0]?.count, 10) || 0;

      if (count > 0) {
        blocked.push({ id: cat.id, name: cat.name, count });
      } else {
        await prisma.$executeRawUnsafe(`DELETE FROM "InstallationCategory" WHERE "id" = $1;`, cat.id);
        deleted.push(cat.id);
      }
    }

    if (blocked.length > 0 && deleted.length === 0) {
      return res.status(400).json({
        error: 'No se pudieron eliminar las categorías seleccionadas porque tienen materiales asignados.',
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
    console.error("Error al eliminar categorías en lote:", error);
    res.status(500).json({ error: 'Error al eliminar categorías en lote', details: error.message });
  }
});

module.exports = router;
