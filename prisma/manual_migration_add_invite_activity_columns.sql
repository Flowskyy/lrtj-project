-- Manual migration: Add real-time activity tracking to admin_invitations
-- Safe additive migration: new nullable columns, no data loss, no defaults needed
-- Applied: August 12, 2026

-- Track which step the invited user is currently on in the signup flow
ALTER TABLE admin_invitations ADD COLUMN activityStep VARCHAR(100) NULL AFTER emailSentAt;

-- Track when the step was last reported (for Idle/active detection)
ALTER TABLE admin_invitations ADD COLUMN lastActivityAt DATETIME NULL AFTER activityStep;