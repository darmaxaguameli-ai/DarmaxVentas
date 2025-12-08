-- CreateTable
CREATE TABLE "_JugBrandToServicePrice" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JugBrandToServicePrice_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_JugBrandToServicePrice_B_index" ON "_JugBrandToServicePrice"("B");

-- AddForeignKey
ALTER TABLE "_JugBrandToServicePrice" ADD CONSTRAINT "_JugBrandToServicePrice_A_fkey" FOREIGN KEY ("A") REFERENCES "JugBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JugBrandToServicePrice" ADD CONSTRAINT "_JugBrandToServicePrice_B_fkey" FOREIGN KEY ("B") REFERENCES "ServicePrice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
