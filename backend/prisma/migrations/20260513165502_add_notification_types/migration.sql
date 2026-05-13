-- Add new notification type values to the existing enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SYSTEM';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REMINDER';
