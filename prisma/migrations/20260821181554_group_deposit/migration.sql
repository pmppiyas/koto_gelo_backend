-- CreateEnum
CREATE TYPE "DepositMethod" AS ENUM ('CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- AlterEnum
ALTER TYPE "ExpenseStatus" ADD VALUE 'SETTLED';

-- AlterEnum
ALTER TYPE "ExpenseType" ADD VALUE 'SETTLEMENT';

-- CreateTable
CREATE TABLE "group_deposits" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "recordedById" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "depositDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "DepositMethod" NOT NULL DEFAULT 'CASH',
    "note" TEXT,
    "status" "DepositStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_deposits_groupId_idx" ON "group_deposits"("groupId");

-- CreateIndex
CREATE INDEX "group_deposits_userId_idx" ON "group_deposits"("userId");

-- CreateIndex
CREATE INDEX "group_deposits_depositDate_idx" ON "group_deposits"("depositDate");

-- CreateIndex
CREATE INDEX "group_deposits_status_idx" ON "group_deposits"("status");

-- AddForeignKey
ALTER TABLE "group_deposits" ADD CONSTRAINT "group_deposits_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_deposits" ADD CONSTRAINT "group_deposits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_deposits" ADD CONSTRAINT "group_deposits_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
