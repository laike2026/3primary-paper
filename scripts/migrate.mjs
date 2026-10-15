import {readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {neon} from '@neondatabase/serverless';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required');
const sql = neon(url);
await sql.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
const files = (await readdir(join(root, 'db'))).filter(name => /^\d+_.*\.sql$/.test(name)).sort();
for (const name of files) {
  const recorded = await sql.query('SELECT 1 FROM schema_migrations WHERE version=$1', [name]);
  if (recorded.length) continue;
  const source = await readFile(join(root, 'db', name), 'utf8');
  // Migrations in this project contain no procedural blocks or semicolons in strings.
  const statements = source.split(';').map(statement => statement.trim()).filter(statement => statement && !/^--[^\n]*$/.test(statement));
  for (const statement of statements) await sql.query(statement);
  await sql.query('INSERT INTO schema_migrations(version) VALUES($1) ON CONFLICT DO NOTHING', [name]);
  process.stdout.write(`Applied ${name}\n`);
}
