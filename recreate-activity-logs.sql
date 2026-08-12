-- Drop existing activity logs table
DROP TABLE IF EXISTS `system_activity_logs`;

-- Recreate activity logs table from scratch
CREATE TABLE `system_activity_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actorUserId` VARCHAR(255) NULL,
  `actorName` VARCHAR(255) NULL,
  `actorEmail` VARCHAR(255) NULL,
  `actorRoleId` INT NULL,
  `actorRoleName` VARCHAR(255) NULL,
  `tableName` VARCHAR(255) NOT NULL,
  `recordId` VARCHAR(255) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `beforeState` JSON NULL,
  `afterState` JSON NULL,
  `changedFields` JSON NULL,
  `createdAt` TIMESTAMP NOT NULL,
  `revertedAt` TIMESTAMP NULL,
  `revertedByUserId` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_tableName` (`tableName`),
  INDEX `idx_recordId` (`recordId`),
  INDEX `idx_action` (`action`),
  INDEX `idx_createdAt` (`createdAt` DESC),
  INDEX `idx_actorUserId` (`actorUserId`),
  INDEX `idx_actorRoleId` (`actorRoleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
