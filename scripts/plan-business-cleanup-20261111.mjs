import {isDeepStrictEqual} from 'node:util';
import {operationId,tableKeys,testReasons} from './business-cleanup-rules-20261111.mjs';
import {assetAliases,canonicalAsset,rewriteAssets,cleanBusinessMetadata,retiredAssetPaths,isStorageUrl,operationalMessage} from '../lib/business-assets.mjs';

const reviews=new Set(['review-bpa-product','review-addresses','review-certifications','review-expanded-range','review-original-faq','review-catalogue','review-source-template']);
const jsonFields=new Set(['name','summary','application','details','description','features','specifications','gallery','documents','seo','title','intro','sections','body','alt','caption','payload','details','snapshot','result','metadata']);
const businessTables=new Set(['content_products','content_categories','content_articles','news_categories','website_content']);
const mutable={
  content_products:['image','gallery','documents','video_url','source','seo'],content_categories:['image','icon','source','seo'],
  content_articles:['image','seo','sections'],website_content:['image','file_url','source','notes'],
  media_assets:['url','thumbnail_url','storage_url','thumbnail_storage_url','alt','caption'],
  content_versions:['snapshot'],website_content_versions:['snapshot'],admin_audit_log:['details'],sync_jobs:['payload','last_error'],
};
function businessRow(table,row,aliases,index){
  const result=rewriteAssets(row,aliases);
  for(const key of ['source','notes'])if(typeof result[key]==='string')result[key]=cleanBusinessMetadata(result[key]);
  if(table==='media_assets'){
    result.url=canonicalAsset(row,index);
    result.storage_url=row.storage_url||(isStorageUrl(row.url)?row.url:'');
    result.thumbnail_storage_url=row.thumbnail_storage_url||(isStorageUrl(row.thumbnail_url)?row.thumbnail_url:'');
    result.thumbnail_url=row.thumbnail_url?'/files/'+row.id+'?variant=thumbnail':'';
    result.alt=cleanBusinessMetadata(row.alt);result.caption=cleanBusinessMetadata(row.caption);
  }
  if(table==='sync_jobs'&&row.last_error)result.last_error=operationalMessage(row.last_error,'同步暂时失败，请稍后重试');
  return result;
}
export function planBusinessCleanup(rows,index){
  const aliases=assetAliases(rows.media_assets,index),deletes=[],updates=[];
  const addDelete=(table,row,reason)=>{if(!deletes.some(d=>d.table===table&&d.before===row))deletes.push({table,before:row,reason});};
  for(const [table,items]of Object.entries(rows))for(const row of items){
    const reasons=testReasons(table,row);if(reasons.length)addDelete(table,row,reasons.join(', '));
    if(table==='website_content'&&reviews.has(row.slug)&&row.kind==='review'&&row.status==='draft')addDelete(table,row,'unverified legacy worksheet or obsolete review note');
    if(table==='content_products'&&row.id==='TP-BPA-FREE'&&row.status==='draft'&&row.name?.en==='BPA/BPS-Free Thermal Paper Rolls')addDelete(table,row,'unverified material and certification claims in an unpublished draft');
    if(table==='media_assets'&&retiredAssetPaths.includes(row.storage_key))addDelete(table,row,'superseded artwork or catalog; current approved replacement is available');
  }
  const removed=(table,key)=>new Set(deletes.filter(d=>d.table===table).map(d=>String(d.before[key])));
  const productIds=removed('content_products','id'),categoryIds=removed('content_categories','slug'),articleIds=removed('content_articles','slug'),websiteIds=removed('website_content','slug');
  const leadIds=removed('inquiries','id'),userIds=removed('admin_users','id');
  const remainingOwners=rows.admin_users.filter(row=>row.active&&row.role==='superadmin'&&!userIds.has(String(row.id)));
  if(!remainingOwners.length)throw new Error('Cleanup must retain an active owner account');
  for(const row of rows.content_products)if(!productIds.has(String(row.id))&&categoryIds.has(String(row.category_slug)))throw new Error('A retained product depends on a proposed test category');
  for(const row of rows.product_media)if(removed('media_assets','id').has(String(row.media_id))&&!productIds.has(String(row.product_id)))throw new Error('A retained product still uses a superseded media record');
  for(const row of rows.product_media)if(productIds.has(String(row.product_id)))addDelete('product_media',row,'relationship belonging to a removed product');
  for(const row of rows.product_categories)if(productIds.has(String(row.product_id)))addDelete('product_categories',row,'relationship belonging to a removed product');
  for(const row of rows.inquiry_notes)if(leadIds.has(String(row.inquiry_id)))addDelete('inquiry_notes',row,'note belonging to a test inquiry');
  for(const row of rows.analytics_events)if(leadIds.has(String(row.metadata?.inquiryId)))addDelete('analytics_events',row,'telemetry belonging to a test inquiry');
  for(const row of rows.sync_jobs)if(leadIds.has(String(row.payload?.id)))addDelete('sync_jobs',row,'notification task belonging to a test inquiry');
  for(const row of rows.content_versions)if((row.entity_type==='product'&&productIds.has(String(row.entity_id)))||(row.entity_type==='category'&&categoryIds.has(String(row.entity_id)))||(row.entity_type==='article'&&articleIds.has(String(row.entity_id))))addDelete('content_versions',row,'history belonging to removed test or unverified content');
  for(const row of rows.website_content_versions)if(websiteIds.has(String(row.slug)))addDelete('website_content_versions',row,'history belonging to removed review notes');
  for(const row of rows.admin_audit_log)if(userIds.has(String(row.actor_id)))addDelete('admin_audit_log',row,'operation belonging to an explicit test account');
  for(const [table,fields]of Object.entries(mutable))for(const row of rows[table]){
    if(deletes.some(d=>d.table===table&&d.before===row))continue;
    const after=businessRow(table,row,aliases,index);
    const changed=fields.filter(field=>!isDeepStrictEqual(row[field]??'',after[field]??''));
    if(changed.length)updates.push({table,before:row,after,fields:changed,reason:table==='media_assets'?'first-party business link; private transport retained':'remove retired or platform references from business content'});
  }
  const statements=[{text:'SELECT pg_advisory_xact_lock(hashtext($1))',values:[operationId]}];
  const absent=`NOT EXISTS (SELECT 1 FROM site_settings WHERE key='${operationId}')`;
  const marked=`EXISTS (SELECT 1 FROM site_settings WHERE key='${operationId}')`;
  function selected(table,row){
    const key=tableKeys[table],projection=table==='admin_users'?"to_jsonb(t)-'password_hash'":'to_jsonb(t)';
    return {key:String(key?row[key]:JSON.stringify(row)),where:projection+'=$1::jsonb',values:[JSON.stringify(row)]};
  }
  function archive(change){
    const {table,before,reason}=change,s=selected(table,before);
    statements.push({text:`INSERT INTO business_cleanup_archive(operation_id,table_name,row_key,snapshot,reason)
      SELECT $2,$3,$4,to_jsonb(t),$5 FROM ${table} t WHERE ${s.where} AND ${absent}
      ON CONFLICT(operation_id,table_name,row_key) DO NOTHING`,values:[...s.values,operationId,table,s.key,reason]});
  }
  for(const change of [...updates,...deletes])archive(change);
  for(const change of updates){
    const {table,before,after,fields}=change,s=selected(table,before);
    const values=fields.map(field=>jsonFields.has(field)?JSON.stringify(after[field]):after[field]);
    const matchIndex=values.length+1;values.push(...s.values);
    const sets=fields.map((field,i)=>`${field}=$${i+1}${jsonFields.has(field)?'::jsonb':''}`);
    if(businessTables.has(table)||table==='media_assets')sets.push('updated_at=now()');
    if(table==='content_products'||table==='content_articles')sets.push('version=version+1');
    const where=s.where.replace('$1','$'+matchIndex);
    statements.push({text:`WITH changed AS (UPDATE ${table} t SET ${sets.join(',')} WHERE ${where} AND ${absent} RETURNING 1)
      SELECT 1/(CASE WHEN (SELECT count(*) FROM changed)=1 OR ${marked} THEN 1 ELSE 0 END) AS applied`,values});
  }
  const priority=['inquiry_notes','analytics_events','sync_jobs','content_versions','website_content_versions','admin_audit_log','product_media','product_categories','content_products','content_articles','website_content','media_assets','content_categories','news_categories','inquiries','admin_users'];
  deletes.sort((a,b)=>priority.indexOf(a.table)-priority.indexOf(b.table));
  for(const change of deletes){
    const {table,before}=change,s=selected(table,before);
    if(table==='admin_users'){
      for(const child of ['admin_sessions','admin_password_resets']){
        statements.push({text:`INSERT INTO business_cleanup_archive(operation_id,table_name,row_key,snapshot,reason) SELECT $1,$2,token_hash,to_jsonb(t),'session or reset of a test account' FROM ${child} t WHERE user_id=$3 AND ${absent} ON CONFLICT DO NOTHING`,values:[operationId,child,before.id]});
        statements.push({text:`DELETE FROM ${child} WHERE user_id=$1 AND ${absent}`,values:[before.id]});
      }
    }
    statements.push({text:`WITH changed AS (DELETE FROM ${table} t WHERE ${s.where} AND ${absent} RETURNING 1)
      SELECT 1/(CASE WHEN (SELECT count(*) FROM changed)=1 OR ${marked} THEN 1 ELSE 0 END) AS applied`,values:s.values});
  }
  const countBy=changes=>Object.fromEntries([...new Set(changes.map(c=>c.table))].map(table=>[table,changes.filter(c=>c.table===table).length]));
  const receipt={operationId,deleted:countBy(deletes),updated:countBy(updates),
    retained:{activeOwners:remainingOwners.length,inquiries:rows.inquiries.length-leadIds.size,searchDataRows:rows.search_console_daily.length,articles:rows.content_articles.length-articleIds.size},
    mediaAliases:rows.media_assets.filter(m=>!removed('media_assets','id').has(String(m.id))).map(m=>({id:m.id,url:canonicalAsset(m,index),sha256:m.sha256})),
    archivedRows:updates.length+deletes.length};
  statements.push({text:`INSERT INTO admin_audit_log(action,entity_type,entity_id,details) SELECT 'cleanup','business_data',$1,$2::jsonb WHERE ${absent}`,values:[operationId,JSON.stringify({deleted:receipt.deleted,updated:receipt.updated})]});
  statements.push({text:'INSERT INTO site_settings(key,value) VALUES($1,$2::jsonb) ON CONFLICT(key) DO NOTHING',values:[operationId,JSON.stringify(receipt)]});
  return {updates,deletes,statements,receipt};
}
