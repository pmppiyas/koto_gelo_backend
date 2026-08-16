-- CreateEnum
CREATE TYPE "GroupInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GroupInvitationType" AS ENUM ('INVITATION', 'JOIN_REQUEST');

-- CreateTable
CREATE TABLE "group_invitations" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "invitedById" UUID NOT NULL,
    "inviteeId" UUID NOT NULL,
    "type" "GroupInvitationType" NOT NULL DEFAULT 'INVITATION',
    "status" "GroupInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_invitations_groupId_idx" ON "group_invitations"("groupId");

-- CreateIndex
CREATE INDEX "group_invitations_inviteeId_idx" ON "group_invitations"("inviteeId");

-- CreateIndex
CREATE INDEX "group_invitations_status_idx" ON "group_invitations"("status");

-- CreateIndex
CREATE INDEX "group_invitations_groupId_inviteeId_status_idx" ON "group_invitations"("groupId", "inviteeId", "status");

-- AddForeignKey
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
