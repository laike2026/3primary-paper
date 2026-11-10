import {readFile} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {neon} from '@neondatabase/serverless';
import {put} from '@vercel/blob';
import {releaseId, thermalIds, reviseProduct, reviseWebsite, replaceReferences} from './content-update-20261110.mjs';

const root = new URL('../', import.meta.url);
const absent = `NOT EXISTS (SELECT 1 FROM site_settings WHERE key='${releaseId}')`;
const present = `EXISTS (SELECT 1 FROM site_settings WHERE key='${releaseId}')`;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const jsonFields = new Set(['specifications', 'gallery', 'documents', 'seo']);
const same = isDeepStrictEqual;

function changes(rows, transform, fields) {
  return rows.flatMap(before => {
    const after = transform(before);
    const changed = fields.filter(field => !same(before[field], after[field]));
    return changed.length ? [{before, after, fields:changed}] : [];
  });
}

export function planContentUpdate({products, categories, website}, assets) {
  for (const id of thermalIds) if (!products.some(row => row.id === id)) throw new Error('Missing approved product '+id);
  const urls = Object.fromEntries(assets.map(asset => [asset.localPath, asset.url]));
  const productChanges = changes(products, row => reviseProduct(row, urls), ['size','specifications','image','gallery','documents','seo']);
  const categoryChanges = changes(categories, row => replaceReferences(row, urls), ['image','seo']);
  const websiteChanges = changes(website, row => reviseWebsite(row, urls), ['image','file_url']);
  const counts = {products:productChanges.length,categories:categoryChanges.length,website:websiteChanges.length,assets:assets.length};
  const receipt = {releaseId,approvedAt:'2026-11-10',counts,products:productChanges.map(row=>row.before.id),
    assets:assets.map(({localPath,url,sha256})=>({localPath,url,sha256}))};
  const statements = [{text:'SELECT pg_advisory_xact_lock(hashtext($1))',values:[releaseId]}];
  statements.push({text:`INSERT INTO site_settings(key,value)
    SELECT $1,jsonb_build_object(
      'products',COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM content_products p WHERE id=ANY($2::text[])),'[]'::jsonb),
      'categories',COALESCE((SELECT jsonb_agg(to_jsonb(c)) FROM content_categories c WHERE slug=ANY($3::text[])),'[]'::jsonb),
      'website',COALESCE((SELECT jsonb_agg(to_jsonb(w)) FROM website_content w WHERE slug=ANY($4::text[])),'[]'::jsonb))
    WHERE ${absent} ON CONFLICT(key) DO NOTHING`,values:[releaseId+'-before',productChanges.map(row=>row.before.id),categoryChanges.map(row=>row.before.slug),websiteChanges.map(row=>row.before.slug)]});
  for (const change of productChanges) {
    statements.push({text:`INSERT INTO content_versions(entity_type,entity_id,version,snapshot)
      SELECT 'product',id,version,to_jsonb(p) FROM content_products p WHERE id=$1 AND ${absent}
      ON CONFLICT(entity_type,entity_id,version) DO NOTHING`,values:[change.before.id]});
    const fields = change.fields;
    const values = fields.map(field => jsonFields.has(field) ? JSON.stringify(change.after[field]) : change.after[field]);
    values.push(change.before.id,change.before.version);
    const set = fields.map((field,i)=>`${field}=$${i+1}${jsonFields.has(field)?'::jsonb':''}`).join(',');
    statements.push({text:`WITH changed AS (UPDATE content_products SET ${set},updated_at=now(),version=version+1
      WHERE id=$${fields.length+1} AND version=$${fields.length+2} AND ${absent} RETURNING id)
      SELECT 1/(CASE WHEN (SELECT count(*) FROM changed)=1 OR ${present} THEN 1 ELSE 0 END) AS applied`,values});
  }
  for (const change of categoryChanges) {
    statements.push({text:`INSERT INTO content_versions(entity_type,entity_id,version,snapshot)
      SELECT 'category',slug,COALESCE((SELECT max(version) FROM content_versions WHERE entity_type='category' AND entity_id=c.slug),0)+1,to_jsonb(c)
      FROM content_categories c WHERE slug=$1 AND ${absent}`,values:[change.before.slug]});
    const fields = change.fields;
    const values = fields.map(field=>field==='seo'?JSON.stringify(change.after[field]):change.after[field]);
    values.push(change.before.slug,change.before.expected_updated_at);
    statements.push({text:`WITH changed AS (UPDATE content_categories SET ${fields.map((field,i)=>`${field}=$${i+1}${field==='seo'?'::jsonb':''}`).join(',')},updated_at=now()
      WHERE slug=$${fields.length+1} AND updated_at=$${fields.length+2}::timestamptz AND ${absent} RETURNING slug)
      SELECT 1/(CASE WHEN (SELECT count(*) FROM changed)=1 OR ${present} THEN 1 ELSE 0 END) AS applied`,values});
  }
  for (const change of websiteChanges) {
    statements.push({text:`INSERT INTO website_content_versions(slug,snapshot) SELECT slug,to_jsonb(w) FROM website_content w
      WHERE slug=$1 AND ${absent}`,values:[change.before.slug]});
    const fields = change.fields;
    const values = fields.map(field=>change.after[field]);values.push(change.before.slug,change.before.expected_updated_at);
    statements.push({text:`WITH changed AS (UPDATE website_content SET ${fields.map((field,i)=>`${field}=$${i+1}`).join(',')},updated_at=now()
      WHERE slug=$${fields.length+1} AND updated_at=$${fields.length+2}::timestamptz AND ${absent} RETURNING slug)
      SELECT 1/(CASE WHEN (SELECT count(*) FROM changed)=1 OR ${present} THEN 1 ELSE 0 END) AS applied`,values});
  }
  for (const asset of assets) {
    statements.push({text:`INSERT INTO media_assets(id,storage_key,url,filename,mime_type,byte_size,width,height,alt,caption,category,sha256)
      SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12 WHERE ${absent}
      ON CONFLICT(storage_key) DO NOTHING`,values:[randomUUID(),asset.localPath,asset.url,asset.localPath.split('/').at(-1),asset.mimeType,
      asset.byteSize,asset.width||null,asset.height||null,JSON.stringify(asset.alt),JSON.stringify({en:'Approved content update 10 November 2026'}),asset.mimeType==='application/pdf'?'downloads':'products',asset.sha256]});
  }
  statements.push({text:`INSERT INTO admin_audit_log(action,entity_type,entity_id,details)
    SELECT 'publish','content_release',$1,$2::jsonb WHERE ${absent}`,values:[releaseId,JSON.stringify(receipt)]});
  statements.push({text:'INSERT INTO site_settings(key,value) VALUES($1,$2::jsonb) ON CONFLICT(key) DO NOTHING',values:[releaseId,JSON.stringify(receipt)]});
  return {statements,receipt,productChanges,categoryChanges,websiteChanges};
}

async function readRows(sql) {
  const [products,categories,website] = await Promise.all([
    sql.query('SELECT id,slug,version,size,specifications,image,gallery,documents,seo FROM content_products WHERE deleted_at IS NULL'),
    sql.query('SELECT slug,image,seo,updated_at::text AS expected_updated_at FROM content_categories WHERE deleted_at IS NULL'),
    sql.query("SELECT slug,kind,topic,image,file_url,updated_at::text AS expected_updated_at FROM website_content WHERE deleted_at IS NULL AND kind<>'review'")
  ]);
  return {products,categories,website};
}

async function uploadAssets(manifest, origin) {
  const result=[];
  for (const asset of manifest.assets) {
    const bytes=await readFile(new URL('public'+asset.localPath,root));
    if (digest(bytes)!==asset.sha256) throw new Error('Release asset checksum changed: '+asset.localPath);
    const pathname='materials-2026-11/'+asset.localPath.split('/').at(-1);
    const url=origin+'/'+pathname;
    const existing=await fetch(url,{signal:AbortSignal.timeout(20000),cache:'no-store'});
    let uploaded;
    if (existing.ok) {
      if (digest(Buffer.from(await existing.arrayBuffer()))!==asset.sha256) throw new Error('Refusing a different existing release asset: '+pathname);
      uploaded={url};
    } else {
      if (existing.status!==404) throw new Error('Asset preflight returned '+existing.status);
      try {
        uploaded=await put(pathname,bytes,{access:'public',addRandomSuffix:false,contentType:asset.mimeType,cacheControlMaxAge:31536000});
      } catch(error) {
        const check=await fetch(url,{signal:AbortSignal.timeout(20000),cache:'no-store'});
        if (!check.ok || digest(Buffer.from(await check.arrayBuffer()))!==asset.sha256) throw error;
        uploaded={url};
      }
      if (new URL(uploaded.url).origin!==origin) throw new Error('Unexpected release asset store');
    }
    result.push({...asset,url:uploaded.url});
  }
  return result;
}

export async function applyApprovedContent() {
  if (process.env.TPC_CONTENT_RELEASE_20261110!=='1') {
    console.log('Approved content release: inactive; no production changes.');return;
  }
  if (process.env.VERCEL_ENV!=='production' || process.env.NEXT_PUBLIC_SITE_URL!=='https://tpc-paper.com') throw new Error('Approved content release requires the intended production site');
  if (process.env.VERCEL_PROJECT_ID && process.env.VERCEL_PROJECT_ID!=='prj_fnwCWegmkDN7wwpZ6I8gsYbx0zcd') throw new Error('Wrong production project');
  const connection=process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL;
  if (!connection || !process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Production content storage is not configured');
  const sql=neon(connection);
  const marker=await sql.query('SELECT value FROM site_settings WHERE key=$1',[releaseId]);
  if (marker.length) {console.log('Approved content release already recorded:',JSON.stringify(marker[0].value.counts));return;}
  const rows=await readRows(sql);
  const image=rows.products.map(row=>row.image).find(url=>/^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//.test(url));
  if (!image) throw new Error('Cannot resolve the production media store');
  const manifest=JSON.parse(await readFile(new URL('data/content-update-20261110-assets.json',root),'utf8'));
  const assets=await uploadAssets(manifest,new URL(image).origin);
  const plan=planContentUpdate(rows,assets);
  await sql.transaction(plan.statements.map(statement=>sql.query(statement.text,statement.values)));
  const after=await readRows(sql);
  const pending=planContentUpdate(after,assets);
  if (pending.productChanges.length || pending.categoryChanges.length || pending.websiteChanges.length) throw new Error('Release committed but a content reference still needs verification');
  console.log('APPROVED_CONTENT_RELEASE_VERIFIED',JSON.stringify(plan.receipt));
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  applyApprovedContent().catch(error=>{console.error('Approved content release failed:',error.message);process.exitCode=1;});
}
