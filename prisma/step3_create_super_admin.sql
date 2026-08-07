-- Step 3: Create a Super Admin role (if it doesn't exist)
INSERT IGNORE INTO `auth_roles` (`name`, `isSuperAdmin`, `createdAt`, `updatedAt`)
VALUES ('Super Admin', TRUE, NOW(), NOW());
