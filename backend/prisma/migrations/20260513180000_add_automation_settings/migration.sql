-- Add reminderSentAt to Assignment for SLA cron tracking
ALTER TABLE "Assignment" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- Create AutomationSettings table (per-org automation config)
CREATE TABLE "AutomationSettings" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "triggerOnCreate" BOOLEAN NOT NULL DEFAULT true,
    "triggerOnUpdate" BOOLEAN NOT NULL DEFAULT true,
    "triggerOnCancel" BOOLEAN NOT NULL DEFAULT true,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderHoursBefore" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutomationSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutomationSettings_orgId_key" ON "AutomationSettings"("orgId");

ALTER TABLE "AutomationSettings" ADD CONSTRAINT "AutomationSettings_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
