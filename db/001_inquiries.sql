-- Apply with a direct, non-pooled Postgres connection in a dedicated project.
CREATE TABLE IF NOT EXISTS inquiries (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  company text NOT NULL,
  email text NOT NULL,
  country text NOT NULL,
  product_id text NOT NULL,
  product_slug text NOT NULL,
  quantity text NOT NULL DEFAULT '',
  requirements text NOT NULL,
  locale text NOT NULL,
  source_url text NOT NULL,
  referrer text NOT NULL DEFAULT '',
  utm_source text NOT NULL DEFAULT '',
  utm_medium text NOT NULL DEFAULT '',
  utm_campaign text NOT NULL DEFAULT '',
  ip_hash text NOT NULL,
  notification_status text NOT NULL DEFAULT 'pending',
  notified_at timestamptz
);
CREATE INDEX IF NOT EXISTS inquiries_ip_created_idx ON inquiries(ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_created_idx ON inquiries(created_at DESC);
