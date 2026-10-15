-- 3PRIMARY admin platform. Apply after 001_inquiries.sql with a direct connection.
CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('superadmin','admin','editor','marketing','sales','analyst','viewer')),
  active boolean NOT NULL DEFAULT true,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON admin_sessions(user_id, expires_at DESC);
CREATE TABLE IF NOT EXISTS admin_password_resets (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_entity_idx ON admin_audit_log(entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS content_categories (
  slug text PRIMARY KEY,
  parent_slug text REFERENCES content_categories(slug) ON DELETE SET NULL,
  name jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  image text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_categories_parent_idx ON content_categories(parent_slug, sort_order);
CREATE TABLE IF NOT EXISTS content_products (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  category_slug text REFERENCES content_categories(slug) ON DELETE SET NULL,
  name jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  application jsonb NOT NULL DEFAULT '{}'::jsonb,
  image text NOT NULL DEFAULT '',
  size text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','scheduled','archived')),
  scheduled_at timestamptz,
  published_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_products_public_idx ON content_products(status, category_slug, sort_order) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS news_categories (
  slug text PRIMARY KEY,
  name jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS content_articles (
  slug text PRIMARY KEY,
  category_slug text REFERENCES news_categories(slug) ON DELETE SET NULL,
  title jsonb NOT NULL DEFAULT '{}'::jsonb,
  intro jsonb NOT NULL DEFAULT '{}'::jsonb,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  image text NOT NULL DEFAULT '',
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','scheduled','archived')),
  scheduled_at timestamptz,
  published_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_articles_public_idx ON content_articles(status, published_at DESC) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS content_versions (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('category','product','news_category','article')),
  entity_id text NOT NULL,
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  actor_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, version)
);
CREATE TABLE IF NOT EXISTS url_redirects (
  source_path text PRIMARY KEY,
  destination_path text NOT NULL,
  status_code integer NOT NULL DEFAULT 301 CHECK (status_code IN (301,308)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY,
  storage_key text NOT NULL UNIQUE,
  url text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  width integer,
  height integer,
  alt jsonb NOT NULL DEFAULT '{}'::jsonb,
  uploaded_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_assets_created_idx ON media_assets(created_at DESC);

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES admin_users(id) ON DELETE SET NULL;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notification_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS notification_next_at timestamptz;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS client_request_id uuid UNIQUE;
CREATE INDEX IF NOT EXISTS inquiries_status_created_idx ON inquiries(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS inquiry_notes (
  id bigserial PRIMARY KEY,
  inquiry_id text NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  event_id uuid PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('page_view','product_view','article_view','address_click','whatsapp_click','form_cta_click','form_view','form_open','form_start','form_field_complete','form_submit_attempt','form_submit_success','form_submit_failure')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  session_id text NOT NULL DEFAULT '',
  visitor_id text NOT NULL DEFAULT '',
  page_path text NOT NULL,
  placement text NOT NULL DEFAULT '',
  locale text NOT NULL DEFAULT 'en',
  product_id text NOT NULL DEFAULT '',
  form_id text NOT NULL DEFAULT '',
  field_key text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  utm_source text NOT NULL DEFAULT '',
  utm_medium text NOT NULL DEFAULT '',
  utm_campaign text NOT NULL DEFAULT '',
  device_type text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS analytics_events_type_time_idx ON analytics_events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_page_time_idx ON analytics_events(page_path, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON analytics_events(session_id, occurred_at DESC);
CREATE TABLE IF NOT EXISTS analytics_daily (
  day date NOT NULL,
  event_type text NOT NULL,
  page_path text NOT NULL,
  placement text NOT NULL,
  locale text NOT NULL,
  event_count bigint NOT NULL DEFAULT 0,
  unique_sessions bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(day,event_type,page_path,placement,locale)
);

CREATE TABLE IF NOT EXISTS search_console_daily (
  day date NOT NULL,
  site_url text NOT NULL,
  page_url text NOT NULL DEFAULT '',
  query text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  device text NOT NULL DEFAULT '',
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  ctr double precision NOT NULL DEFAULT 0,
  position double precision NOT NULL DEFAULT 0,
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(day,site_url,page_url,query,country,device)
);
CREATE INDEX IF NOT EXISTS search_console_daily_day_idx ON search_console_daily(day DESC);
CREATE TABLE IF NOT EXISTS sync_jobs (
  id uuid PRIMARY KEY,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','succeeded','failed')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempt integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  last_error text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS sync_jobs_due_idx ON sync_jobs(status, available_at) WHERE status IN ('pending','failed');
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
