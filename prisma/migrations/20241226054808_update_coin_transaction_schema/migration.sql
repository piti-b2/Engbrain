/*
  Warnings:

  - You are about to drop the column `source` on the `CoinTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `CoinTransaction` table. All the data in the column will be lost.
  - Added the required column `balance` to the `CoinTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `CoinTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `CoinTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CoinTransaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `CoinTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "CoinTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CoinTransactionReason" AS ENUM ('PURCHASE', 'REWARD', 'SPEND', 'REFUND', 'COURSE_COMPLETION', 'HOMEWORK_SUBMISSION');

-- AlterTable
ALTER TABLE "CoinTransaction" DROP COLUMN "source",
DROP COLUMN "sourceId",
ADD COLUMN     "balance" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "reason" "CoinTransactionReason" NOT NULL,
ADD COLUMN     "status" "CoinTransactionStatus" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "CoinTransactionType" NOT NULL;
