/*
  Warnings:

  - You are about to drop the `_JugBrandToServicePrice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_JugBrandToServicePrice" DROP CONSTRAINT "_JugBrandToServicePrice_A_fkey";

-- DropForeignKey
ALTER TABLE "_JugBrandToServicePrice" DROP CONSTRAINT "_JugBrandToServicePrice_B_fkey";

-- DropTable
DROP TABLE "_JugBrandToServicePrice";
