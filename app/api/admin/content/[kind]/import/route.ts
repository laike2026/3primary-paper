import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit,can,newId} from '@/lib/admin/auth';
import {parseContentCsv} from '@/lib/admin/bulk';
import {config,cleanLocalized,publishIssue} from '@/lib/admin/content';
import {db} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';
export const runtime='nodejs';
type Ctx={params:Promise<{kind:string}>};
const requestSchema=z.object({items:z.array(z.unknown()).min(1).max(200),dryRun:z.boolean()});
const jsonFields=new Set(['name','summary','application','title','intro','description','details','features','specifications','gallery','documents','sections','seo']);
export async function POST(request:NextRequest,{params}:Ctx){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const {kind}=await params;const c=config(kind);if(!c)return jsonError('无效模块',404);
  const auth=await guard('content:write');if(auth.response)return auth.response;
  if(Number(request.headers.get('content-length')||0)>2_000_000)return jsonError('导入文件过大',413);
  let rawInput:unknown;
  if(request.headers.get('content-type')?.includes('multipart/form-data')){
    const form=await request.formData().catch(()=>null);const file=form?.get('file');
    if(!(file instanceof File)||file.size>2_000_000)return jsonError('导入文件无效或超过 2 MB');
    try{const source=await file.text();const json=file.name.toLowerCase().endsWith('.csv')?null:JSON.parse(source);const items=json===null?parseContentCsv(kind as 'categories'|'products'|'articles'|'news-categories',source):(json.items||json);rawInput={items,dryRun:form?.get('dryRun')==='true'};}
    catch(error){return jsonError(error instanceof Error?error.message:'导入文件格式无效');}
  }else rawInput=await request.json().catch(()=>null);
  const input=requestSchema.safeParse(rawInput);if(!input.success)return jsonError('导入数据无效，单次最多 200 条');
  const results:{index:number;id:string;ok:boolean;error?:string}[]=[];
  for(const [index,raw] of input.data.items.entries()){
    const parsed=c.schema.safeParse(raw);
    if(!parsed.success){results.push({index:index+1,id:'',ok:false,error:'字段不完整或格式无效'});continue;}
    const data=parsed.data as Record<string,unknown>;const id=String(data[c.id]);
    if(data.status==='published'&&!can(auth.user!.role,'content:publish')){results.push({index:index+1,id,ok:false,error:'没有发布权限'});continue;}
    for(const field of ['name','summary','application','title','intro','description','details'])if(data[field])data[field]=cleanLocalized(data[field] as Record<string,string>);
    if(data.status==='published'){const issue=await publishIssue(kind,data);if(issue){results.push({index:index+1,id,ok:false,error:issue});continue;}}
    if(input.data.dryRun){results.push({index:index+1,id,ok:true});continue;}
    const fields=Object.keys(data).filter(k=>data[k]!==undefined);
    const values=fields.map(k=>jsonFields.has(k)?JSON.stringify(data[k]):data[k]);
    const assignments=fields.filter(k=>k!==c.id).map(k=>`${k}=excluded.${k}`);
    assignments.push('updated_at=now()');
    const columns=fields.join(',');const paramsSql=fields.map((k,i)=>`$${i+1}${jsonFields.has(k)?'::jsonb':''}`).join(',');
    try{await db().query(`INSERT INTO ${c.table}(${columns}) VALUES(${paramsSql}) ON CONFLICT(${c.id}) DO UPDATE SET ${assignments.join(',')}`,[...values]);results.push({index:index+1,id,ok:true});}
    catch(error){console.error('Import row failed',error);results.push({index:index+1,id,ok:false,error:'数据库保存失败，请检查别名、分类和关联'});}
  }
  let jobId:string|undefined;
  if(!input.data.dryRun){
    jobId=newId();
    await db().query('INSERT INTO import_jobs(id,kind,actor_id,total,succeeded,failed,result) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)',[jobId,kind,auth.user!.id,results.length,results.filter(x=>x.ok).length,results.filter(x=>!x.ok).length,JSON.stringify(results)]);
    await audit(auth.user!.id,'bulk_import',kind,jobId,{success:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length});
  }
  return NextResponse.json({ok:results.every(x=>x.ok),dryRun:input.data.dryRun,jobId,results},{status:results.some(x=>!x.ok)?207:200});
}
