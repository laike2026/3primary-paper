import {createHash} from 'node:crypto';

export const operationId='business-data-cleanup-2026-11-11';
export const tableKeys={
  content_products:'id',content_categories:'slug',content_articles:'slug',news_categories:'slug',
  website_content:'slug',media_assets:'id',inquiries:'id',inquiry_notes:'id',analytics_events:'event_id',
  analytics_daily:null,search_console_daily:null,sync_jobs:'id',url_redirects:'source_path',
  admin_users:'id',admin_audit_log:'id',import_jobs:'id',site_settings:'key',
  content_versions:'id',website_content_versions:'id',product_media:null,product_categories:null,
};
export const providerWords=/\b(?:ai|openai|chatgpt|codex|github|vercel)\b|artificial intelligence|人工智能|AI生成/iu;
export const providerHost=/(?:^|\.)(?:github\.com|githubusercontent\.com|vercel\.app|vercel-storage\.com|openai\.com|chatgpt\.com)$/i;
const fixtureId=/^(?:qa|fixture|mock|dummy)[-_]/i;
const explicitName=/^(?:QA (?:Test|Temporary|Sales|Company|Product|Category|logo)|Test (?:User|Company|Product|Inquiry)|Fixture(?:\b|[-_])|Demo (?:User|Company|Product)|测试(?:用户|客户|公司|产品|询盘)|演示(?:用户|客户|公司|产品))/iu;
export function canonical(value){
  if(value===null||typeof value!=='object')return value;
  if(value instanceof Date)return value.toISOString();
  if(Array.isArray(value))return value.map(canonical);
  return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
}
export const fingerprint=row=>createHash('sha256').update(JSON.stringify(canonical(row))).digest('hex');
export function testReasons(table,row){
  const reasons=[];
  const identity=String(row[tableKeys[table]]||row.slug||'');
  if(fixtureId.test(identity)||/(?:^|\/)(?:qa|fixture|mock|dummy)[-_]/i.test(identity))reasons.push('explicit-test-identifier');
  if(typeof row.email==='string'&&/@(?:[^@.]+\.)*(?:example\.(?:com|org|net)|invalid)$/i.test(row.email))reasons.push('reserved-test-mail-domain');
  const names=[row.name?.en||row.name,row.title?.en||row.title,row.company,row.filename].filter(x=>typeof x==='string');
  if(names.some(x=>explicitName.test(x)))reasons.push('explicit-test-name');
  if(row.filename&&fixtureId.test(row.filename))reasons.push('explicit-test-filename');
  if(row.payload?.fixture===true||row.payload?.isTest===true||row.metadata?.fixture===true||row.metadata?.isTest===true)reasons.push('explicit-test-marker');
  if(table==='analytics_events'&&[/^(?:qa|fixture|mock)(?:[-_]|$)/i].some(re=>re.test(row.placement||'')||re.test(row.session_id||'')))reasons.push('test-telemetry-placement');
  return [...new Set(reasons)];
}
function paths(value,prefix='',result=[]){
  if(typeof value==='string'&&providerWords.test(value))result.push({path:prefix,excerpt:value.slice(0,220)});
  else if(value&&typeof value==='object')for(const [key,item]of Object.entries(value))paths(item,prefix?prefix+'.'+key:key,result);
  return result;
}
export function inventory(rows){
  const tables=Object.fromEntries(Object.entries(rows).map(([table,items])=>[table,{total:items.length,active:items.filter(r=>!r.deleted_at).length}]));
  const candidates=[],exposure=[],unpublished=[];
  for(const [table,items]of Object.entries(rows))for(const row of items){
    const key=String(row[tableKeys[table]]??'');
    const reasons=testReasons(table,row);
    if(reasons.length)candidates.push({table,key,reasons,fingerprint:fingerprint(row)});
    if(['content_products','content_categories','content_articles','news_categories','website_content'].includes(table)&&!row.deleted_at&&row.status!=='published')unpublished.push({table,key,status:row.status,title:row.name?.en||row.title?.en||'',source:row.source||'',notes:row.notes||'',text:JSON.stringify({summary:row.summary,details:row.details,body:row.body,specifications:row.specifications}).slice(0,1800),fingerprint:fingerprint(row)});
    if(['content_products','content_categories','content_articles','website_content','media_assets','sync_jobs','admin_audit_log','content_versions','website_content_versions'].includes(table)){
      const hits=paths(row);if(hits.length)exposure.push({table,key,fields:hits.map(x=>x.path),examples:hits.filter(x=>!x.path.includes('snapshot')).slice(0,3),fingerprint:fingerprint(row)});
    }
  }
  return {operationId,tables,candidates,unpublished,exposure,activeOwners:rows.admin_users.filter(r=>r.active&&r.role==='superadmin').length};
}
