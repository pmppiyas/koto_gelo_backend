-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('MESS', 'FRIENDS', 'TOUR', 'TRIP', 'FAMILY', 'OFFICE', 'STUDENTS', 'ROOMMATES', 'OTHER');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GroupMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "GroupMemberStatus" AS ENUM ('ACTIVE', 'LEFT', 'REMOVED');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('PERSONAL', 'GROUP');

-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CASH', 'BANK', 'MOBILE_BANKING', 'CREDIT_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "AccountType" NOT NULL DEFAULT 'CASH',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'BDT',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "groupId" UUID,
    "type" "ExpenseType" NOT NULL DEFAULT 'PERSONAL',
    "amount" DECIMAL(12,2) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "subcategory" VARCHAR(100),
    "accountId" UUID,
    "title" VARCHAR(255),
    "note" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "splitType" "SplitType",
    "status" "ExpenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_payers" (
    "id" UUID NOT NULL,
    "expenseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "expense_payers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_participants" (
    "id" UUID NOT NULL,
    "expenseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "shareAmount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "expense_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" "GroupType" NOT NULL DEFAULT 'OTHER',
    "status" "GroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "GroupMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "accounts_type_idx" ON "accounts"("type");

-- CreateIndex
CREATE INDEX "expenses_userId_idx" ON "expenses"("userId");

-- CreateIndex
CREATE INDEX "expenses_groupId_idx" ON "expenses"("groupId");

-- CreateIndex
CREATE INDEX "expenses_type_idx" ON "expenses"("type");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_expenseDate_idx" ON "expenses"("expenseDate");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expense_payers_expenseId_idx" ON "expense_payers"("expenseId");

-- CreateIndex
CREATE INDEX "expense_payers_userId_idx" ON "expense_payers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_payers_expenseId_userId_key" ON "expense_payers"("expenseId", "userId");

-- CreateIndex
CREATE INDEX "expense_participants_expenseId_idx" ON "expense_participants"("expenseId");

-- CreateIndex
CREATE INDEX "expense_participants_userId_idx" ON "expense_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_participants_expenseId_userId_key" ON "expense_participants"("expenseId", "userId");

-- CreateIndex
CREATE INDEX "groups_createdById_idx" ON "groups"("createdById");

-- CreateIndex
CREATE INDEX "groups_type_idx" ON "groups"("type");

-- CreateIndex
CREATE INDEX "groups_status_idx" ON "groups"("status");

-- CreateIndex
CREATE INDEX "group_members_userId_idx" ON "group_members"("userId");

-- CreateIndex
CREATE INDEX "group_members_groupId_idx" ON "group_members"("groupId");

-- CreateIndex
CREATE INDEX "group_members_status_idx" ON "group_members"("status");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_payers" ADD CONSTRAINT "expense_payers_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_payers" ADD CONSTRAINT "expense_payers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
