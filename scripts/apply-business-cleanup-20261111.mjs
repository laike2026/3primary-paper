import {pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
import {neon} from '@neondatabase/serverless';
import {inventory,tableKeys,operationId} from './business-cleanup-rules-20261111.mjs';
import {planBusinessCleanup} from './plan-business-cleanup-20261111.mjs';

function logReceipt(prefix,receipt){
  const {mediaAliases,...summary}=receipt;
  console.log(prefix,JSON.stringify({...summary,mediaCount:mediaAliases.length}));
  for(const media of mediaAliases)console.log('BUSINESS_CLEANUP_MEDIA',JSON.stringify(media));
}

export async function readBusinessRows(sql){
  const results=await Promise.all(Object.keys(tableKeys).map(async table=>{
    const fields=table==='admin_users'?"to_jsonb(t)-'password_hash'":'to_jsonb(t)';
    const selected=await sql.query(`SELECT ${fields} AS record FROM ${table} t LIMIT 20001`);
    const rows=selected.map(row=>row.record);
    if(rows.length>20000)throw new Error('Maintenance read limit reached for '+table);
    return [table,rows];
  }));
  return Object.fromEntries(results);
}
export async function runBusinessCleanup(){
  const mode=process.env.TPC_BUSINESS_CLEANUP_20261111;
  if(!mode||mode==='0'){console.log('Business content maintenance: inactive.');return;}
  if(process.env.VERCEL_ENV!=='production'||process.env.NEXT_PUBLIC_SITE_URL!=='https://tpc-paper.com'||
    (process.env.VERCEL_PROJECT_ID&&process.env.VERCEL_PROJECT_ID!=='prj_fnwCWegmkDN7wwpZ6I8gsYbx0zcd'))throw new Error('Maintenance is limited to the intended production project');
  const connection=process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL;
  if(!connection)throw new Error('Business data source is unavailable');
  const sql=neon(connection,{fetchOptions:{signal:AbortSignal.timeout(25000)}});
  if(mode==='apply'){
    const existing=await sql.query('SELECT value FROM site_settings WHERE key=$1',[operationId]);
    if(existing.length){logReceipt('BUSINESS_CLEANUP_ALREADY_APPLIED',existing[0].value);return;}
    const schema=await readFile(new URL('../db/007_business_media.sql',import.meta.url),'utf8');
    await sql.transaction(schema.split(';').map(text=>text.trim()).filter(Boolean).map(text=>sql.query(text)));
    const index=JSON.parse(await readFile(new URL('../data/public-asset-index.json',import.meta.url),'utf8'));
    const before=await readBusinessRows(sql),plan=planBusinessCleanup(before,index);
    if(plan.deletes.length>100||plan.updates.length>1000)throw new Error('Maintenance change limit exceeded');
    await sql.transaction(plan.statements.map(s=>sql.query(s.text,s.values)));
    const after=await readBusinessRows(sql),pending=planBusinessCleanup(after,index);
    if(pending.deletes.length||pending.updates.length)throw new Error('Cleanup requires a further consistency check');
    if(after.admin_users.filter(r=>r.active&&r.role==='superadmin').length!==plan.receipt.retained.activeOwners||after.search_console_daily.length<before.search_console_daily.length)throw new Error('Protected business records changed');
    logReceipt('BUSINESS_CLEANUP_VERIFIED',plan.receipt);
    return;
  }
  const result=inventory(await readBusinessRows(sql));
  if(mode!=='audit')throw new Error('Unrecognized maintenance stage');
  console.log('BUSINESS_CLEANUP_AUDIT_SUMMARY',JSON.stringify({operationId:result.operationId,tables:result.tables,activeOwners:result.activeOwners,candidates:result.candidates}));
  for(const item of result.unpublished)console.log('BUSINESS_CLEANUP_UNPUBLISHED',JSON.stringify({...item,text:item.text.slice(0,600)}));
  for(const item of result.exposure)console.log('BUSINESS_CLEANUP_EXPOSURE',JSON.stringify(item));
  console.log('BUSINESS_CLEANUP_AUDIT_COMPLETE',JSON.stringify({candidates:result.candidates.length,unpublished:result.unpublished.length,exposure:result.exposure.length,readOnly:true}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)runBusinessCleanup().catch(()=>{console.error('Business content maintenance failed; no credentials are printed.');process.exitCode=1;});
