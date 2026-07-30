-- Add default_point column to welcome_point table
-- This is a manual migration for Laravel-managed database
ALTER TABLE `welcome_point` ADD COLUMN `default_point` INT NOT NULL DEFAULT 100;
