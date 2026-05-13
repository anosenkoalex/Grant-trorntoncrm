CREATE TYPE "VacationType" AS ENUM ('VACATION', 'SICK_LEAVE', 'DAY_OFF');
CREATE TYPE "VacationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "VacationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "type" "VacationType" NOT NULL,
    "status" "VacationStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VacationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VacationRequest_userId_idx" ON "VacationRequest"("userId");
CREATE INDEX "VacationRequest_orgId_status_idx" ON "VacationRequest"("orgId", "status");

ALTER TABLE "VacationRequest" ADD CONSTRAINT "VacationRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VacationRequest" ADD CONSTRAINT "VacationRequest_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VacationRequest" ADD CONSTRAINT "VacationRequest_decidedById_fkey"
    FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
