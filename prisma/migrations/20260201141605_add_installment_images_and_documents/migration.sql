-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'HOUSE_REGISTRATION', 'CONTRACT', 'RECEIPT', 'PRODUCT_IMAGE', 'OTHER');

-- AlterTable
ALTER TABLE "InstallmentPlan" ADD COLUMN     "itemImageUrl" TEXT;

-- CreateTable
CREATE TABLE "InstallmentDocument" (
    "id" TEXT NOT NULL,
    "installmentPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallmentDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InstallmentDocument" ADD CONSTRAINT "InstallmentDocument_installmentPlanId_fkey" FOREIGN KEY ("installmentPlanId") REFERENCES "InstallmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
