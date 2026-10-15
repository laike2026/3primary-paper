import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {randomBytes,scryptSync,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {neon} from '@neondatabase/serverless';

const tables=['admin_users','content_categories','news_categories','content_products','content_articles','media_assets','inquiries','admin_sessions','admin_password_resets','admin_audit_log','content_versions','url_redirects','product_categories','product_media','inquiry_notes','analytics_events','analytics_daily','search_console_daily','sync_jobs','site_settings','import_jobs'];
const [operation,file]=process.argv.slice(2);
const passphrase=process.env.BACKUP_PASSPHRASE;
if(!['create','verify','restore'].includes(operation)||!file)throw Error('Usage: node scripts/backup-data.mjs create|verify|restore <encrypted-file>');
if(!passphrase||passphrase.length<24)throw Error('Set BACKUP_PASSPHRASE to at least 24 characters');
const derive=salt=>scryptSync(passphrase,salt,32);
function encrypt(payload){const salt=randomBytes(16),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',derive(salt),iv);const data=Buffer.concat([cipher.update(gzipSync(Buffer.from(JSON.stringify(payload)))),cipher.final()]);return Buffer.concat([Buffer.from('TPCBACK1'),salt,iv,cipher.getAuthTag(),data]);}
function decrypt(fileData){if(fileData.subarray(0,8).toString()!=='TPCBACK1')throw Error('Invalid backup format');const salt=fileData.subarray(8,24),iv=fileData.subarray(24,36),tag=fileData.subarray(36,52),ciphertext=fileData.subarray(52);const decipher=createDecipheriv('aes-256-gcm',derive(salt),iv);decipher.setAuthTag(tag);return JSON.parse(gunzipSync(Buffer.concat([decipher.update(ciphertext),decipher.final()])).toString());}
function identity(url){const parsed=new URL(url);return `${parsed.hostname}/${parsed.pathname.replace(/^\//,'')}`;}
if(operation==='create'){
  const url=process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL;if(!url)throw Error('Database URL required');
  const sql=neon(url),data={format:1,createdAt:new Date().toISOString(),source:identity(url),tables:{}};
  for(const table of tables){const rows=[];for(let offset=0;;offset+=500){const batch=await sql.query(`SELECT * FROM ${table} ORDER BY ctid LIMIT 500 OFFSET $1`,[offset]);rows.push(...batch);if(batch.length<500)break;}data.tables[table]=rows;process.stdout.write(`${table}: ${rows.length}\n`);}
  const target=resolve(file);await mkdir(dirname(target),{recursive:true});await writeFile(target,encrypt(data),{mode:0o600});
  process.stdout.write(`Encrypted backup created: ${target}\n`);
}else{
  const data=decrypt(await readFile(resolve(file)));
  if(data.format!==1||!data.source||!data.tables||!tables.every(table=>Array.isArray(data.tables[table])))throw Error('Backup manifest is incomplete');
  const digest=createHash('sha256').update(JSON.stringify(data.tables)).digest('hex').slice(0,16);
  process.stdout.write(`Verified backup ${data.createdAt}, source ${data.source}, fingerprint ${digest}\n`);
  for(const table of tables)process.stdout.write(`${table}: ${data.tables[table].length}\n`);
  if(operation==='restore'){
    if(process.env.RESTORE_ALLOW_DISPOSABLE!=='yes')throw Error('RESTORE_ALLOW_DISPOSABLE=yes is required');
    const url=process.env.RESTORE_DATABASE_URL;if(!url)throw Error('RESTORE_DATABASE_URL is required');
    if(identity(url)===data.source)throw Error('Restore target must differ from backup source');
    const sql=neon(url);
    for(const table of tables){const count=await sql.query(`SELECT count(*)::int AS n FROM ${table}`);if(Number(count[0].n)>0)throw Error(`Restore target is not empty: ${table}`);}
    for(const table of tables){for(let i=0;i<data.tables[table].length;i+=100){const batch=data.tables[table].slice(i,i+100);await sql.query(`INSERT INTO ${table} SELECT * FROM jsonb_populate_recordset(NULL::${table},$1::jsonb)`,[JSON.stringify(batch)]);}process.stdout.write(`Restored ${table}: ${data.tables[table].length}\n`);}
    for(const [sequence,table] of [['admin_audit_log_id_seq','admin_audit_log'],['content_versions_id_seq','content_versions'],['inquiry_notes_id_seq','inquiry_notes']])await sql.query(`SELECT setval('${sequence}',greatest(1,(SELECT coalesce(max(id),0) FROM ${table})),(SELECT count(*)>0 FROM ${table}))`);
    process.stdout.write('Restore completed to a separate empty database. Verify counts and application flows before use.\n');
  }
}
