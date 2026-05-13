-- CreateEnum
CREATE TYPE "ShiftKind" AS ENUM ('DEFAULT', 'OFFICE', 'REMOTE', 'DAY_OFF');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AssignmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MANAGER';

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordPlain" TEXT,
ADD COLUMN     "passwordSentAt" TIMESTAMP(3),
ADD COLUMN     "passwordUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Workplace" ADD COLUMN     "color" TEXT;

-- CreateTable
CREATE TABLE "AssignmentShift" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "kind" "ShiftKind" NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentAdjustment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "kind" "ShiftKind" NOT NULL DEFAULT 'DAY_OFF',
    "comment" TEXT NOT NULL,
    "managerComment" TEXT,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentRequest" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "workplaceId" TEXT,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "slots" JSONB NOT NULL,
    "comment" TEXT,
    "status" "AssignmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionComment" TEXT,
    "assignmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workplaceId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignmentShift_assignmentId_date_idx" ON "AssignmentShift"("assignmentId", "date");

-- CreateIndex
CREATE INDEX "AssignmentAdjustment_assignmentId_idx" ON "AssignmentAdjustment"("assignmentId");

-- CreateIndex
CREATE INDEX "AssignmentAdjustment_userId_date_idx" ON "AssignmentAdjustment"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentRequest_assignmentId_key" ON "AssignmentRequest"("assignmentId");

-- CreateIndex
CREATE INDEX "AssignmentRequest_orgId_status_idx" ON "AssignmentRequest"("orgId", "status");

-- CreateIndex
CREATE INDEX "AssignmentRequest_status_idx" ON "AssignmentRequest"("status");

-- CreateIndex
CREATE INDEX "AssignmentRequest_requesterId_idx" ON "AssignmentRequest"("requesterId");

-- CreateIndex
CREATE INDEX "AssignmentRequest_workplaceId_idx" ON "AssignmentRequest"("workplaceId");

-- CreateIndex
CREATE INDEX "AssignmentRequest_decidedById_idx" ON "AssignmentRequest"("decidedById");

-- CreateIndex
CREATE INDEX "WorkReport_userId_date_idx" ON "WorkReport"("userId", "date");

-- AddForeignKey
ALTER TABLE "AssignmentShift" ADD CONSTRAINT "AssignmentShift_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentAdjustment" ADD CONSTRAINT "AssignmentAdjustment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentAdjustment" ADD CONSTRAINT "AssignmentAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRequest" ADD CONSTRAINT "AssignmentRequest_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRequest" ADD CONSTRAINT "AssignmentRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRequest" ADD CONSTRAINT "AssignmentRequest_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "Workplace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRequest" ADD CONSTRAINT "AssignmentRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentRequest" ADD CONSTRAINT "AssignmentRequest_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkReport" ADD CONSTRAINT "WorkReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkReport" ADD CONSTRAINT "WorkReport_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "Workplace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
