import {readFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {neon} from '@neondatabase/serverless';
const file=process.argv[2];
if(!file||process.env.MATERIALS_IMPORT!=='2026-11-02')throw Error('Set MATERIALS_IMPORT=2026-11-02 and provide the reviewed private import manifest');
const data=JSON.parse(await readFile(file,'utf8'));
const sql=neon(process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL);
const marker='materials-import-2026-11-02';
if((await sql.query('SELECT 1 FROM site_settings WHERE key=$1',[marker])).length){console.log('Materials already imported; no changes made.');process.exit(0);}
const statements=[];
for(const row of data.products){
  const keys=Object.keys(row),json=new Set(['name','summary','application','details','features','specifications','gallery','documents']);
  statements.push(sql.query(`INSERT INTO content_versions(entity_type,entity_id,version,snapshot) SELECT 'product',id,coalesce((SELECT max(version) FROM content_versions WHERE entity_type='product' AND entity_id=p.id),0)+1,to_jsonb(p) FROM content_products p WHERE id=$1`,[row.id]));
  statements.push(sql.query(`INSERT INTO content_products(${keys.join(',')},published_at) VALUES(${keys.map((key,i)=>`$${i+1}${json.has(key)?'::jsonb':''}`).join(',')},${row.status==='published'?'now()':'NULL'}) ON CONFLICT(id) DO UPDATE SET ${keys.filter(k=>!['id','slug'].includes(k)).map(k=>`${k}=excluded.${k}`).join(',')},updated_at=now(),version=content_products.version+1`,keys.map(k=>json.has(k)?JSON.stringify(row[k]):row[k])));
}
for(const row of data.website){
  const keys=Object.keys(row),json=new Set(['name','summary','body','product_ids']);
  statements.push(sql.query(`INSERT INTO website_content_versions(slug,snapshot) SELECT slug,to_jsonb(w) FROM website_content w WHERE slug=$1`,[row.slug]));
  statements.push(sql.query(`INSERT INTO website_content(${keys.join(',')}) VALUES(${keys.map((k,i)=>`$${i+1}${json.has(k)?'::jsonb':''}`).join(',')}) ON CONFLICT(slug) DO UPDATE SET ${keys.filter(k=>k!=='slug').map(k=>`${k}=excluded.${k}`).join(',')},updated_at=now()`,keys.map(k=>json.has(k)?JSON.stringify(row[k]):row[k])));
}
for(const a of data.assets){
  const bytes=await readFile(new URL(`../public${a.local_url||a.url}`,import.meta.url));
  statements.push(sql.query(`INSERT INTO media_assets(id,storage_key,url,filename,mime_type,byte_size,width,height,alt,caption,category,sha256) VALUES($1,$2,$3,$4,'image/webp',$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11) ON CONFLICT(storage_key) DO NOTHING`,[randomUUID(),a.local_url||a.url,a.url,a.filename,a.byte_size,a.width,a.height,JSON.stringify(a.alt||{en:a.filename,ar:a.filename,ru:a.filename,es:a.filename}),JSON.stringify({en:a.source}),a.category,createHash('sha256').update(bytes).digest('hex')]));
}
const catalogPath='/downloads/3primary-product-catalog-2026-11.pdf';
const catalog=await readFile(new URL(`../public${catalogPath}`,import.meta.url));
statements.push(sql.query(`INSERT INTO media_assets(id,storage_key,url,filename,mime_type,byte_size,alt,category,sha256) VALUES($1,$2,$3,$4,'application/pdf',$5,$6::jsonb,'downloads',$7) ON CONFLICT(storage_key) DO NOTHING`,[randomUUID(),catalogPath,data.asset_map?.[catalogPath]||catalogPath,'3primary-product-catalog-2026-11.pdf',catalog.length,JSON.stringify({en:'3PRIMARY product catalog - November 2026',ar:'كتالوج منتجات 3PRIMARY',ru:'Каталог продукции 3PRIMARY',es:'Catálogo de productos 3PRIMARY'}),createHash('sha256').update(catalog).digest('hex')]));
const cats=[['thermal-paper-rolls','/images/materials/product-01-2.webp'],['thermal-jumbo-rolls','/images/materials/product-10-2.webp'],['thermal-labels','/images/materials/product-06-3.webp'],['printed-paper','/images/materials/product-04-1.webp']];
for(const [slug,image]of cats)statements.push(sql.query('UPDATE content_categories SET image=$2,updated_at=now() WHERE slug=$1',[slug,data.asset_map?.[image]||image]));
statements.push(sql.query(`UPDATE content_categories SET name=$1::jsonb,summary=$2::jsonb WHERE slug='thermal-labels'`,[JSON.stringify({en:'Self-Adhesive Labels',ar:'ملصقات ذاتية اللصق',ru:'Самоклеящиеся этикетки',es:'Etiquetas autoadhesivas'}),JSON.stringify({en:'Direct thermal, thermal transfer and fanfold labels.',ar:'ملصقات حرارية مباشرة ونقل حراري ومطوية.',ru:'Термоэтикетки, термотрансферные и складные этикетки.',es:'Etiquetas térmicas directas, de transferencia y plegadas.'})]));
statements.push(sql.query(`INSERT INTO site_settings(key,value) VALUES($1,$2::jsonb)`,[marker,JSON.stringify({date:'2026-11-02',products:data.products.length,website:data.website.length,assets:data.assets.length})]));
statements.push(sql.query(`INSERT INTO admin_audit_log(action,entity_type,entity_id,details) VALUES('import','materials',$1,$2::jsonb)`,[marker,JSON.stringify({products:data.products.length,website:data.website.length,assets:data.assets.length})]));
await sql.transaction(statements);
console.log(`Imported ${data.products.length} products, ${data.website.length} website entries, ${data.assets.length} media records in one transaction.`);
