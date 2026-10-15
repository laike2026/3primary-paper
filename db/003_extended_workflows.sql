-- Extended content, lead and media fields for operational workflows.
ALTER TABLE content_categories ADD COLUMN IF NOT EXISTS description jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_categories ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT '';
ALTER TABLE content_categories ADD COLUMN IF NOT EXISTS nav_visible boolean NOT NULL DEFAULT true;
ALTER TABLE content_categories ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;

ALTER TABLE content_products DROP CONSTRAINT IF EXISTS content_products_status_check;
ALTER TABLE content_products ADD CONSTRAINT content_products_status_check CHECK (status IN ('draft','review','published','scheduled','unlisted','archived'));
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT '';
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS moq text NOT NULL DEFAULT '';
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS lead_time text NOT NULL DEFAULT '';
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS price_mode text NOT NULL DEFAULT 'quote';
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS price_min numeric(12,2);
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS price_max numeric(12,2);
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE content_products ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS product_categories (
  product_id text NOT NULL REFERENCES content_products(id) ON DELETE CASCADE,
  category_slug text NOT NULL REFERENCES content_categories(slug) ON DELETE CASCADE,
  PRIMARY KEY (product_id,category_slug)
);
CREATE TABLE IF NOT EXISTS product_media (
  product_id text NOT NULL REFERENCES content_products(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id,media_id)
);

ALTER TABLE content_articles DROP CONSTRAINT IF EXISTS content_articles_status_check;
ALTER TABLE content_articles ADD CONSTRAINT content_articles_status_check CHECK (status IN ('draft','review','published','scheduled','unlisted','archived'));
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS author text NOT NULL DEFAULT '';
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS related_products text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS view_count bigint NOT NULL DEFAULT 0;

ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS sha256 text;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS caption jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS thumbnail_url text NOT NULL DEFAULT '';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS media_assets_hash_idx ON media_assets(sha256) WHERE deleted_at IS NULL;

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS form_type text NOT NULL DEFAULT 'general';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS utm_content text NOT NULL DEFAULT '';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS utm_term text NOT NULL DEFAULT '';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS user_agent text NOT NULL DEFAULT '';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS device_type text NOT NULL DEFAULT '';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consent_at timestamptz;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS duplicate_of text REFERENCES inquiries(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS inquiries_email_created_idx ON inquiries(email,created_at DESC);

CREATE TABLE IF NOT EXISTS import_jobs (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  actor_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  total integer NOT NULL,
  succeeded integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  result jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS import_jobs_created_idx ON import_jobs(created_at DESC);
