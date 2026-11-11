import {pathToFileURL} from 'node:url';
import {neon} from '@neondatabase/serverless';
import {inventory,tableKeys} from './business-cleanup-rules-20261111.mjs';

export async function readBusinessRows(sql){
  const results=await Promise.all(Object.keys(tableKeys).map(async table=>{
    const fields=table==='admin_users'?'id,username,email,name,role,active,created_at,updated_at': '*';
    const rows=await sql.query(`SELECT ${fields} FROM ${table} LIMIT 20001`);
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
  const result=inventory(await readBusinessRows(sql));
  if(mode!=='audit')throw new Error('Only the reviewed read-only audit stage is currently enabled');
  console.log('BUSINESS_CLEANUP_AUDIT_SUMMARY',JSON.stringify({operationId:result.operationId,tables:result.tables,activeOwners:result.activeOwners,candidates:result.candidates}));
  for(const item of result.unpublished)console.log('BUSINESS_CLEANUP_UNPUBLISHED',JSON.stringify(item));
  for(const item of result.exposure)console.log('BUSINESS_CLEANUP_EXPOSURE',JSON.stringify(item));
  console.log('BUSINESS_CLEANUP_AUDIT_COMPLETE',JSON.stringify({candidates:result.candidates.length,unpublished:result.unpublished.length,exposure:result.exposure.length,readOnly:true}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)runBusinessCleanup().catch(()=>{console.error('Business content maintenance failed; no credentials are printed.');process.exitCode=1;});
