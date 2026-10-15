import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';

export const runtime='nodejs';
type Ctx={params:Promise<{id:string}>};
export async function PATCH(request:NextRequest,{params}:Ctx){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('media:write');if(auth.response)return auth.response;
  const {id}=await params;
  const parsed=z.object({alt:z.partialRecord(z.enum(['en','ar','ru','es']),z.string().max(300)).optional(),caption:z.partialRecord(z.enum(['en','ar','ru','es']),z.string().max(500)).optional(),filename:z.string().trim().min(1).max(180).optional(),category:z.string().trim().min(1).max(40).optional()}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return jsonError('图片说明无效');
  const sets:string[]=[];const values:unknown[]=[];
  for(const [key,value] of Object.entries(parsed.data)){sets.push(key==='alt'||key==='caption'?`${key}=${key} || $${values.length+1}::jsonb`:`${key}=$${values.length+1}`);values.push(key==='alt'||key==='caption'?JSON.stringify(value):value);}
  if(!sets.length)return jsonError('没有可更新字段');
  await db().query(`UPDATE media_assets SET ${sets.join(',')},updated_at=now() WHERE id=$${values.length+1} AND deleted_at IS NULL`,[...values,id]);
  await audit(auth.user!.id,'update','media',id);
  return NextResponse.json({ok:true});
}
export async function DELETE(request:NextRequest,{params}:Ctx){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('media:write');if(auth.response)return auth.response;
  const {id}=await params;
  const used=await db().query('SELECT (SELECT count(*) FROM content_products p JOIN media_assets m ON m.id=$1 WHERE p.deleted_at IS NULL AND (p.image=m.url OR p.gallery ? m.url))+(SELECT count(*) FROM content_articles a JOIN media_assets m ON m.id=$1 WHERE a.deleted_at IS NULL AND a.image=m.url) AS n',[id]);
  if(Number(used[0].n)>0)return jsonError('文件正在被内容使用，请先移除引用',409);
  await db().query('UPDATE media_assets SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL',[id]);
  await audit(auth.user!.id,'delete','media',id);
  return NextResponse.json({ok:true});
}
