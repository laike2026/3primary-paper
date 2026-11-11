-- Keep transport locations private while business content uses first-party file links.
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS storage_url text NOT NULL DEFAULT '';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS thumbnail_storage_url text NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS business_cleanup_archive (
  operation_id text NOT NULL,
  table_name text NOT NULL,
  row_key text NOT NULL,
  snapshot jsonb NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(operation_id,table_name,row_key)
);
