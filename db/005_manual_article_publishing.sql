-- Existing scheduled articles become drafts; only a logged-in editor can publish them.
UPDATE content_articles SET status='draft',scheduled_at=NULL,updated_at=now() WHERE status='scheduled';
ALTER TABLE content_articles DROP CONSTRAINT IF EXISTS content_articles_status_check;
ALTER TABLE content_articles ADD CONSTRAINT content_articles_status_check CHECK (status IN ('draft','review','published','unlisted','archived'));
ALTER TABLE content_articles DROP COLUMN IF EXISTS scheduled_at;
