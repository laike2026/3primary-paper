import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {del} from '@vercel/blob';
import {neon} from '@neondatabase/serverless';

const base=process.env.SMOKE_BASE_URL;
if(process.env.SMOKE_ALLOW_DB!=='yes'||!base||!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))throw new Error('Set SMOKE_ALLOW_DB=yes and SMOKE_BASE_URL=http://localhost:<port>');
if(!process.env.DATABASE_URL||!process.env.ADMIN_BOOTSTRAP_TOKEN)throw new Error('Database and bootstrap token required');
const sql=neon(process.env.DATABASE_URL);
const existing=await sql.query('SELECT count(*)::int AS n FROM admin_users');
if(Number(existing[0].n)!==0)throw new Error('Smoke test only runs before the first permanent administrator is created');
const email=`qa-${randomBytes(6).toString('hex')}@example.invalid`,password=randomBytes(24).toString('base64url');
const qaIds=[],eventIds=[],redirects=[],blobUrls=[],importJobs=[];let leadId='',categorySlug='',productId='',mediaId='';
async function call(path,method='GET',body,cookie=''){
  const response=await fetch(base+path,{method,headers:{origin:base,...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const raw=await response.text();let data=null;try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
  return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]||''};
}
function expect(result,status,label){if(result.status!==status)throw new Error(`${label}: expected ${status}, got ${result.status}: ${JSON.stringify(result.data).slice(0,300)}`);console.log(`${label}: ${status}`);}
try{
  expect(await call('/api/admin/content/products'),401,'Unauthorized API');
  const setup=await call('/api/admin/auth/setup','POST',{token:process.env.ADMIN_BOOTSTRAP_TOKEN,email,name:'QA Temporary',password});expect(setup,200,'Bootstrap');
  const adminCookie=setup.cookie;if(!adminCookie)throw new Error('Session cookie missing');
  qaIds.push(...(await sql.query('SELECT id FROM admin_users WHERE email=$1',[email])).map(row=>row.id));
  for(const path of ['/api/admin/content/categories','/api/admin/content/products','/api/admin/content/articles','/api/admin/inquiries','/api/admin/analytics','/api/admin/seo','/api/admin/media','/api/admin/users','/api/admin/settings','/api/admin/audit','/api/admin/sync','/api/admin/redirects'])expect(await call(path,'GET',null,adminCookie),200,path);
  const localized={en:'QA Category',ar:'',ru:'',es:''};
  const slug=`qa-${randomBytes(4).toString('hex')}`;categorySlug=slug;
  const create=await call('/api/admin/content/categories','POST',{slug,name:localized,summary:localized,image:'',source:'',parent_slug:null,status:'published',sort_order:99,seo:{}},adminCookie);expect(create,201,'Create draft category');
  const imported=await call('/api/admin/content/categories/import','POST',{items:[{slug,name:localized,summary:localized,image:'',source:'',parent_slug:null,status:'published',sort_order:99,seo:{}}],dryRun:false},adminCookie);expect(imported,200,'Import category');importJobs.push(imported.data.jobId);
  productId=`QA-${randomBytes(4).toString('hex')}`;
  const product={id:productId,slug:`qa-product-${randomBytes(4).toString('hex')}`,category_slug:slug,name:{...localized,en:'QA Product'},summary:localized,application:localized,image:'',size:'',source:'',status:'draft',sort_order:99,seo:{}};
  expect(await call('/api/admin/content/products','POST',product,adminCookie),201,'Create draft product');
  expect(await call(`/api/admin/content/products/${productId}`,'PATCH',{...product,status:'published'},adminCookie),200,'Publish product');
  expect(await call(`/api/admin/content/products/${productId}/versions`,'GET',null,adminCookie),200,'Content versions');
  expect(await call('/api/admin/content/products/import','POST',{items:[product],dryRun:true},adminCookie),200,'Validate import');
  expect(await call('/api/admin/content/products/export?format=csv','GET',null,adminCookie),200,'Export CSV');
  expect(await call(`/api/admin/content/products/${productId}`,'DELETE',null,adminCookie),200,'Soft delete product');
  expect(await call(`/api/admin/content/products/${productId}`,'POST',{action:'restore'},adminCookie),200,'Restore product');
  if(process.env.BLOB_READ_WRITE_TOKEN){
    const logo=await readFile(new URL('../public/images/brand/official-logo.jpg',import.meta.url));
    const form=new FormData();form.set('file',new File([logo],'qa-logo.jpg',{type:'image/jpeg'}));form.set('altEn','QA logo');form.set('category','brand');
    const response=await fetch(base+'/api/admin/media',{method:'POST',headers:{origin:base,cookie:adminCookie},body:form});const body=await response.json();expect({status:response.status,data:body},201,'Media upload');mediaId=body.item.id;blobUrls.push(body.item.url,body.item.thumbnail_url);
    const media=await call('/api/admin/media?q=qa-logo','GET',null,adminCookie);expect(media,200,'Media search');if(!media.data.items.some(x=>x.id===mediaId))throw Error('Uploaded media not found');
    expect(await call(`/api/admin/media/${mediaId}`,'PATCH',{filename:'qa-logo-updated.jpg',alt:{en:'QA logo updated'}},adminCookie),200,'Media metadata');
    expect(await call(`/api/admin/media/${mediaId}`,'DELETE',null,adminCookie),200,'Media soft delete');
  }
  expect(await call(`/api/admin/content/products/${productId}`,'DELETE',null,adminCookie),200,'Remove test product');
  expect(await call(`/api/admin/content/categories/${slug}`,'DELETE',null,adminCookie),200,'Soft delete category');
  const sessionId=randomUUID();const eventId=randomUUID();eventIds.push(eventId);
  expect(await call('/api/events','POST',{eventId,type:'whatsapp_click',sessionId,visitorId:randomUUID(),pagePath:'/en/contact',placement:'qa',locale:'en'},'analytics_consent=yes'),202,'Tracking event');
  const inquiry=await call('/api/inquiry','POST',{name:'QA Test',company:'QA Company',email:'qa@example.invalid',country:'Testland',productId:'TP-8080',quantity:'1 carton',requirements:'This is a temporary automated test inquiry.',consent:'true',locale:'en',sourceUrl:`${base}/en/contact`,clientRequestId:randomUUID(),analyticsSessionId:sessionId,formId:'general'},'analytics_consent=yes');expect(inquiry,201,'Inquiry submission');leadId=inquiry.data.id;
  const leads=await call('/api/admin/inquiries','GET',null,adminCookie);if(!leads.data.items.some(row=>row.id===leadId))throw new Error('Inquiry not visible in admin');console.log('Inquiry visible in admin');
  expect(await call(`/api/admin/inquiries/${leadId}/notes`,'POST',{body:'QA follow-up note'},adminCookie),201,'Inquiry note');
  expect(await call('/api/admin/inquiries/bulk','POST',{ids:[leadId],status:'contacted'},adminCookie),200,'Inquiry bulk status');
  expect(await call(`/api/admin/inquiries/${leadId}`,'GET',null,adminCookie),200,'Inquiry detail');
  expect(await call('/api/admin/inquiries/export?format=csv','GET',null,adminCookie),200,'Inquiry CSV');
  const source=`/en/product/qa-${randomBytes(4).toString('hex')}`;redirects.push(source);
  expect(await call('/api/admin/redirects','POST',{sourcePath:source,destinationPath:'/en/products',statusCode:301},adminCookie),200,'Redirect save');
  expect(await call('/api/admin/analytics?dimension=form&format=csv','GET',null,adminCookie),200,'Analytics CSV');
  expect(await call('/api/admin/audit?format=csv&q=QA','GET',null,adminCookie),200,'Audit CSV');
  const salt=randomBytes(16).toString('hex'),salesPassword=randomBytes(24).toString('base64url');
  const salesId=randomUUID();qaIds.push(salesId);await sql.query('INSERT INTO admin_users(id,email,name,password_hash,role) VALUES($1,$2,$3,$4,$5)',[salesId,`qa-sales-${randomBytes(4).toString('hex')}@example.invalid`,'QA Sales',`scrypt$${salt}$${scryptSync(salesPassword,salt,64).toString('hex')}`,'sales']);
  const sale=await sql.query('SELECT email FROM admin_users WHERE id=$1',[salesId]);const login=await call('/api/admin/auth/login','POST',{email:sale[0].email,password:salesPassword});expect(login,200,'Sales login');
  expect(await call('/api/admin/content/products','GET',null,login.cookie),403,'Sales content denied');
  expect(await call('/api/admin/inquiries','GET',null,login.cookie),200,'Sales inquiry allowed');
  console.log('All smoke checks passed');
}finally{
  if(leadId){await sql.query('DELETE FROM analytics_events WHERE metadata->>\'inquiryId\'=$1',[leadId]);await sql.query('DELETE FROM inquiries WHERE id=$1',[leadId]);}
  for(const id of eventIds)await sql.query('DELETE FROM analytics_events WHERE event_id=$1',[id]);
  for(const source of redirects)await sql.query('DELETE FROM url_redirects WHERE source_path=$1',[source]);
  for(const id of importJobs)if(id)await sql.query('DELETE FROM import_jobs WHERE id=$1',[id]);
  if(mediaId){await sql.query('DELETE FROM media_assets WHERE id=$1',[mediaId]);if(blobUrls.length)await del(blobUrls.filter(Boolean)).catch(error=>console.warn('Temporary Blob cleanup failed',error));}
  if(productId){await sql.query('DELETE FROM content_versions WHERE entity_type=$1 AND entity_id=$2',['product',productId]);await sql.query('DELETE FROM content_products WHERE id=$1',[productId]);}
  if(categorySlug)await sql.query('DELETE FROM content_categories WHERE slug=$1',[categorySlug]);
  for(const id of qaIds)await sql.query('DELETE FROM admin_users WHERE id=$1',[id]);
  console.log('Temporary records removed');
}
