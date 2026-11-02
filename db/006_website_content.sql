CREATE TABLE IF NOT EXISTS website_content (
  slug text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('about','factory','faq','download','review')),
  name jsonb NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  image text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  topic text NOT NULL DEFAULT '',
  product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (kind <> 'review' OR status <> 'published')
);
CREATE INDEX IF NOT EXISTS website_content_public_idx ON website_content(kind,sort_order) WHERE status='published' AND deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS website_content_versions (
  id bigserial PRIMARY KEY,
  slug text NOT NULL,
  snapshot jsonb NOT NULL,
  actor_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
