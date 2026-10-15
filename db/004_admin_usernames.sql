-- Allow an initial administrator to sign in with a username before a real mailbox is verified.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE admin_users ALTER COLUMN email DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_unique ON admin_users (lower(username)) WHERE username IS NOT NULL;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_identity_required CHECK (username IS NOT NULL OR email IS NOT NULL);
ALTER TABLE admin_users ADD CONSTRAINT admin_users_username_format CHECK (username IS NULL OR username ~ '^[a-z][a-z0-9_-]{2,31}$');
