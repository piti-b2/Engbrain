/*
  Warnings:

  - Changed the type of `status` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('COMPLETED', 'FAILED', 'PENDING');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "failureMessage" TEXT,
ALTER COLUMN "type" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
