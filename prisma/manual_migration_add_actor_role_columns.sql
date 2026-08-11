-- Manual migration to add actor role columns to system_activity_logs table
-- This is a safe additive migration (new nullable columns, no data loss)
-- Run this with: mysql -h 172.16.18.205 -u lrt_admin -p lrt_public_apps < prisma/manual_migration_add_actor_role_columns.sql

-- Add actorRoleId column (nullable Int)
ALTER TABLE system_activity_logs ADD COLUMN actorRoleId INT NULL AFTER actorEmail;

-- Add actorRoleName column (nullable Varchar)
ALTER TABLE system_activity_logs ADD COLUMN actorRoleName VARCHAR(255) NULL AFTER actorRoleId;

-- Add index on actorRoleId for better query performance
CREATE INDEX idx_system_activity_logs_actorRoleId ON system_activity_logs(actorRoleId);
