import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('inquiries:write');if(auth.response)return auth.response;
  const parsed=z.object({body:z.string().trim().min(2).max(5000)}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('备注内容无效');
  const {id}=await params;const rows=await db().query('INSERT INTO inquiry_notes(inquiry_id,actor_id,body) VALUES($1,$2,$3) RETURNING id',[id,auth.user!.id,parsed.data.body]);
  await audit(auth.user!.id,'note','inquiry',id,{noteId:rows[0].id});
  return NextResponse.json({ok:true},{status:201});
}
