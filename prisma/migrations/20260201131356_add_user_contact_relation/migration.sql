/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,userId]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "attachmentUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Contact_workspaceId_userId_key" ON "Contact"("workspaceId", "userId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
