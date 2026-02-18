-- CreateEnum
CREATE TYPE "ClientCategory" AS ENUM ('PARTICULAR', 'EMPRESA', 'HOSPITAL', 'ESCUELA', 'OTRO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clientCategory" "ClientCategory" NOT NULL DEFAULT 'PARTICULAR';

-- CreateTable
CREATE TABLE "UserJugPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jugBrandId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserJugPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserJugPreference_userId_jugBrandId_key" ON "UserJugPreference"("userId", "jugBrandId");

-- AddForeignKey
ALTER TABLE "UserJugPreference" ADD CONSTRAINT "UserJugPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserJugPreference" ADD CONSTRAINT "UserJugPreference_jugBrandId_fkey" FOREIGN KEY ("jugBrandId") REFERENCES "JugBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
