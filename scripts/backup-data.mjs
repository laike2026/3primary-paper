import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {randomBytes, scryptSync, createCipheriv, createDecipheriv, createHash} from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import {neon} from '@neondatabase/serverless';

const tables = ['admin_users', 'content_categories', 'news_categories', 'content_products',
  'content_articles', 'media_assets', 'inquiries', 'admin_sessions', 'admin_password_resets',
  'admin_audit_log', 'content_versions', 'url_redirects', 'product_categories', 'product_media',
  'inquiry_notes', 'analytics_events', 'analytics_daily', 'search_console_daily', 'sync_jobs',
  'site_settings', 'import_jobs', 'website_content', 'website_content_versions', 'business_cleanup_archive'];
const transientTables = new Set(['admin_sessions', 'admin_password_resets']);
const optionalTables = ['website_content', 'website_content_versions', 'business_cleanup_archive'];
const [operation, file, mediaDestination] = process.argv.slice(2);
const passphrase = process.env.BACKUP_PASSPHRASE;
const maxMediaFile = 8 * 1024 * 1024;
const maxMediaTotal = 128 * 1024 * 1024;
const maxPlaintext = 384 * 1024 * 1024;
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

if (!['create', 'verify', 'restore', 'restore-media'].includes(operation) || !file ||
    (operation === 'restore-media' && !mediaDestination)) {
  throw new Error('Usage: node scripts/backup-data.mjs create|verify|restore <archive> OR restore-media <archive> <new-directory>');
}
if (!passphrase || passphrase.length < 24) throw new Error('Set BACKUP_PASSPHRASE to at least 24 characters');

const derive = (salt) => scryptSync(passphrase, salt, 32);
function encrypt(payload) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const plaintext = Buffer.from(JSON.stringify(payload));
  if (plaintext.length > maxPlaintext) throw new Error('Archive is too large. Use the managed recovery snapshot.');
  const cipher = createCipheriv('aes-256-gcm', derive(salt), iv);
  const ciphertext = Buffer.concat([cipher.update(gzipSync(plaintext)), cipher.final()]);
  return Buffer.concat([Buffer.from('TPCBACK1'), salt, iv, cipher.getAuthTag(), ciphertext]);
}
function decrypt(bytes) {
  if (bytes.length < 53 || bytes.subarray(0, 8).toString() !== 'TPCBACK1') throw new Error('Invalid backup format');
  const decipher = createDecipheriv('aes-256-gcm', derive(bytes.subarray(8, 24)), bytes.subarray(24, 36));
  decipher.setAuthTag(bytes.subarray(36, 52));
  const compressed = Buffer.concat([decipher.update(bytes.subarray(52)), decipher.final()]);
  return JSON.parse(gunzipSync(compressed, {maxOutputLength: maxPlaintext}).toString());
}

function identity(connection) {
  const url = new URL(connection);
  // A pooled endpoint and its direct counterpart identify the same database.
  return url.hostname.replace(/-pooler(?=\.)/, '') + url.pathname;
}

function blobUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(url.hostname) ||
      url.port || url.username || url.password || url.search || url.hash || url.pathname === '/') {
    throw new Error('The media manifest contains a non-public Blob URL');
  }
  return url;
}

function referencedMedia(data) {
  const assets = new Map();
  for (const row of data.tables.media_assets) {
    if (row.deleted_at) continue;
    const source=row.storage_url||row.url,thumbnail=row.thumbnail_storage_url||row.thumbnail_url;
    if(!source.startsWith('/'))assets.set(blobUrl(source).href,Number(row.byte_size));
    if(thumbnail&&!thumbnail.startsWith('/'))assets.set(blobUrl(thumbnail).href,undefined);
  }
  const additional = (value) => {
    if (typeof value === 'string' && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(value)) {
      const href = blobUrl(value).href;
      if (!assets.has(href)) assets.set(href, undefined);
    } else if (value && typeof value === 'object') {
      for (const child of Object.values(value)) additional(child);
    }
  };
  for (const table of ['content_categories', 'content_products', 'content_articles', 'website_content']) {
    for (const row of data.tables[table]) if (!row.deleted_at) additional(row);
  }
  for(const row of data.tables.business_cleanup_archive||[])additional(row.snapshot);
  return assets;
}

async function fetchMedia(url, expectedSize) {
  const response = await fetch(url, {redirect: 'error', signal: AbortSignal.timeout(15_000)});
  if (!response.ok || !response.body) throw new Error('A media object could not be downloaded: ' + response.status);
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxMediaFile) {
        await reader.cancel();
        throw new Error('A media object exceeds the per-file archive limit');
      }
      chunks.push(Buffer.from(chunk.value));
    }
  } finally {
    reader.releaseLock();
  }
  if (!size || (expectedSize && size !== expectedSize)) throw new Error('Media object size differs from the manifest');
  const bytes = Buffer.concat(chunks);
  return {url, size, sha256: hash(bytes), bytes: bytes.toString('base64')};
}

function verifyMedia(data) {
  if (!Array.isArray(data.media)) throw new Error('Media manifest is missing');
  const expected = referencedMedia(data);
  let total = 0;
  for (const row of data.media) {
    const url = blobUrl(row.url).href;
    if (!expected.has(url) || typeof row.bytes !== 'string' || row.bytes.length > Math.ceil(maxMediaFile / 3) * 4) {
      throw new Error('Invalid or duplicate media archive entry');
    }
    const bytes = Buffer.from(row.bytes, 'base64');
    const expectedSize = expected.get(url);
    if (!bytes.length || row.size !== bytes.length || (expectedSize && row.size !== expectedSize) || row.sha256 !== hash(bytes)) {
      throw new Error('Media hash or size verification failed');
    }
    total += bytes.length;
    expected.delete(url);
  }
  if (expected.size || total > maxMediaTotal) throw new Error('Media archive is incomplete or exceeds its total size limit');
  return total;
}

async function restoreDatabase(data) {
  if (process.env.RESTORE_ALLOW_DISPOSABLE !== 'yes') throw new Error('RESTORE_ALLOW_DISPOSABLE=yes is required');
  const url = process.env.RESTORE_DATABASE_URL;
  if (!url) throw new Error('RESTORE_DATABASE_URL is required');
  if (identity(url) === data.source.replace(/-pooler(?=\.)/, '') || [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED]
      .filter(Boolean).some((connection) => identity(connection) === identity(url))) {
    throw new Error('Restore target must differ from the source and configured application database');
  }
  const sql = neon(url);
  const columnsWithSelfReferences = [
    ['content_categories', 'slug', 'parent_slug'],
    ['inquiries', 'id', 'duplicate_of'],
  ];
  const sequences = [['admin_audit_log_id_seq','admin_audit_log'], ['content_versions_id_seq','content_versions'],
    ['inquiry_notes_id_seq','inquiry_notes'], ['website_content_versions_id_seq','website_content_versions']];
  const checks = tables.map((table) => sql.query('SELECT count(*)::int AS n FROM ' + table));
  const counts = await sql.transaction(checks);
  const populated = counts.findIndex((rows) => Number(rows[0].n) > 0);
  if (populated !== -1) throw new Error('Restore target is not empty: ' + tables[populated]);
  const operations = [
    sql.query('LOCK TABLE ' + tables.join(',') + ' IN ACCESS EXCLUSIVE MODE'),
    sql.query('SELECT 1 / CASE WHEN (' + tables.map((table) => '(SELECT count(*) FROM ' + table + ')').join('+') + ')=0 THEN 1 ELSE 0 END'),
  ];

  for (const table of tables) {
    if (transientTables.has(table)) continue;
    const reference = columnsWithSelfReferences.find(([name]) => name === table);
    const records = data.tables[table];
    for (let i = 0; i < records.length; i += 100) {
      const batch = records.slice(i, i + 100);
      const firstPass = reference ? batch.map((row) => ({...row, [reference[2]]: null})) : batch;
      operations.push(sql.query(`INSERT INTO ${table} SELECT * FROM jsonb_populate_recordset(NULL::${table},$1::jsonb)`,
        [JSON.stringify(firstPass)]));
    }
  }
  for (const [table, key, reference] of columnsWithSelfReferences) {
    const references = data.tables[table].filter((row) => row[reference]);
    for (let i = 0; i < references.length; i += 500) {
      const values = references.slice(i, i + 500).map((row) => ({key: row[key], value: row[reference]}));
      operations.push(sql.query(`UPDATE ${table} AS target SET ${reference}=source.value
        FROM jsonb_to_recordset($1::jsonb) AS source(key text,value text) WHERE target.${key}=source.key`, [JSON.stringify(values)]));
    }
  }
  for (const [sequence, table] of sequences) {
    operations.push(sql.query(`SELECT setval('${sequence}',greatest(1,(SELECT coalesce(max(id),0) FROM ${table})),(SELECT count(*)>0 FROM ${table}))`));
  }
  await sql.transaction(operations);
  const after = await sql.transaction(tables.map((table) => sql.query('SELECT count(*)::int AS n FROM ' + table)));
  for (const [index, table] of tables.entries()) {
    const expected = transientTables.has(table) ? 0 : data.tables[table].length;
    if (Number(after[index][0].n) !== expected) throw new Error('Restore count mismatch: ' + table);
  }
  process.stdout.write('Database restored and verified in the disposable target. Administrator sessions require a new login.\n');
}

if (operation === 'create') {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error('Database URL required');
  const sql = neon(url);
  const reads = tables.map((table) => sql.query('SELECT * FROM ' + table + (transientTables.has(table) ? ' LIMIT 0' : ' ORDER BY ctid')));
  const rows = await sql.transaction(reads, {isolationLevel: 'RepeatableRead', readOnly: true});
  const data = {format: 2, createdAt: new Date().toISOString(), source: identity(url),
    tables: Object.fromEntries(tables.map((table, index) => [table, rows[index]])), media: []};
  let mediaSize = 0;
  for (const [url, size] of referencedMedia(data)) {
    const entry = await fetchMedia(url, size);
    mediaSize += entry.size;
    if (mediaSize > maxMediaTotal) throw new Error('Media backup exceeds the archive limit');
    data.media.push(entry);
  }
  const target = resolve(file);
  await mkdir(dirname(target), {recursive: true});
  await writeFile(target, encrypt(data), {mode: 0o600, flag: 'wx'});
  process.stdout.write('Encrypted database and media archive created: ' + target + '\n');
} else {
  const data = decrypt(await readFile(resolve(file)));
  if (![1, 2].includes(data.format) || !data.source || !data.tables) throw new Error('Backup manifest is incomplete');
  for (const table of optionalTables) if (!Object.hasOwn(data.tables, table)) data.tables[table] = [];
  if (!tables.every((table) => Array.isArray(data.tables[table]))) throw new Error('Backup manifest is incomplete');
  const verifiedBytes = data.format === 2 ? verifyMedia(data) : 0;

  process.stdout.write('Verified backup ' + data.createdAt + ', fingerprint ' + hash(JSON.stringify(data.tables)).slice(0, 16) + '\n');
  for (const table of tables) process.stdout.write(table + ': ' + data.tables[table].length + '\n');
  if (data.format === 2) process.stdout.write('Media objects: ' + data.media.length + ', verified bytes: ' + verifiedBytes + '\n');
  else process.stdout.write('Legacy archive format: database records only.\n');
  if (operation === 'restore') await restoreDatabase(data);
  if (operation === 'restore-media') {
    if (data.format !== 2) throw new Error('This archive has no recoverable media bytes');
    const directory = resolve(mediaDestination);
    await mkdir(directory, {mode: 0o700});
    const manifest = [];
    for (const row of data.media) {
      const name = hash(row.url).slice(0, 32) + '.blob';
      await writeFile(join(directory, name), Buffer.from(row.bytes, 'base64'), {flag: 'wx', mode: 0o600});
      manifest.push({file: name, url: row.url, bytes: row.size, sha256: row.sha256});
    }
    await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2), {flag: 'wx', mode: 0o600});
    process.stdout.write('Recovered media verified and written to the new local directory: ' + directory + '\n');
  }
}
