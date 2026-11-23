// server/utils/dbSync.js
// Auto-sincronización de columnas y tablas críticas en PostgreSQL
const prisma = require('../lib/prisma');

let syncCompleted = false;

async function syncDatabaseSchema() {
  if (syncCompleted) return;

  try {
    // 1. Asegurar columnas en User
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        -- backgroundPreference
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'User' AND column_name = 'backgroundPreference'
        ) THEN 
          ALTER TABLE "User" ADD COLUMN "backgroundPreference" TEXT DEFAULT 'solid-light-ice';
        END IF;

        -- sexo
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'User' AND column_name = 'sexo'
        ) THEN 
          ALTER TABLE "User" ADD COLUMN "sexo" TEXT;
        END IF;

        -- purchaseFrequencyDays
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'User' AND column_name = 'purchaseFrequencyDays'
        ) THEN 
          ALTER TABLE "User" ADD COLUMN "purchaseFrequencyDays" INTEGER;
        END IF;

        -- preferredJugs
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'User' AND column_name = 'preferredJugs'
        ) THEN 
          ALTER TABLE "User" ADD COLUMN "preferredJugs" TEXT;
        END IF;

        -- lastPurchaseDate
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'User' AND column_name = 'lastPurchaseDate'
        ) THEN 
          ALTER TABLE "User" ADD COLUMN "lastPurchaseDate" TIMESTAMP(3);
        END IF;
      END $$;
    `);

    // 2. Asegurar tabla InstallationMaterial
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
    `);

    syncCompleted = true;
    console.log("✅ [DB Sync] Esquema de Base de Datos verificado y sincronizado correctamente.");
  } catch (error) {
    console.warn("⚠️ [DB Sync] Aviso durante auto-sincronización:", error.message);
  }
}

module.exports = { syncDatabaseSchema };
