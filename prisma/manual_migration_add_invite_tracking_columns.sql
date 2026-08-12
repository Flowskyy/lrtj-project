-- Manual migration: Add openedAt and emailSentAt tracking to admin_invitations
-- Safe additive migration: new nullable columns, no data loss, no defaults needed
-- Applied: August 12, 2026

-- Track when an invite link is first visited/opened by the recipient
ALTER TABLE admin_invitations ADD COLUMN openedAt DATETIME NULL AFTER completedAt;

-- Track when the invitation email was actually sent
ALTER TABLE admin_invitations ADD COLUMN emailSentAt DATETIME NULL AFTER openedAt;
