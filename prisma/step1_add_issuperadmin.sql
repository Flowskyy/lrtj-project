-- Step 1: Add isSuperAdmin column to auth_roles
ALTER TABLE `auth_roles` 
ADD COLUMN `isSuperAdmin` BOOLEAN NOT NULL DEFAULT FALSE AFTER `name`;
