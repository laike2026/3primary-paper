import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';
export const runtime='nodejs';
type Ctx={params:Promise<{id:string}>};
export async function GET(_request:NextRequest,{params}:Ctx){
  const auth=await guard('inquiries:read');if(auth.response)return auth.response;
  const {id}=await params;const sql=db();
  const [items,notes]=await Promise.all([sql.query('SELECT * FROM inquiries WHERE id=$1 AND deleted_at IS NULL',[id]),sql.query('SELECT n.id,n.body,n.created_at,u.name AS actor FROM inquiry_notes n LEFT JOIN admin_users u ON u.id=n.actor_id WHERE n.inquiry_id=$1 ORDER BY n.created_at DESC',[id])]);
  if(!items.length)return jsonError('询盘不存在',404);
  return NextResponse.json({item:items[0],notes});
}
const schema=z.object({status:z.enum(['new','pending_contact','contacted','qualified','unqualified','quoting','quoted','won','lost','spam','archived']).optional(),assignedTo:z.uuid().nullable().optional(),tags:z.array(z.string().trim().max(30)).max(20).optional()});
export async function PATCH(request:NextRequest,{params}:Ctx){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('inquiries:write');if(auth.response)return auth.response;
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('字段无效');
  const {id}=await params;const data=parsed.data;const sets:string[]=[];const args:unknown[]=[];
  if(data.assignedTo){const users=await db().query("SELECT id FROM admin_users WHERE id=$1 AND active=true AND role IN ('superadmin','admin','sales')",[data.assignedTo]);if(!users.length)return jsonError('负责人不存在或不可分配');}
  if(data.status!==undefined){sets.push(`status=$${args.length+1}`);args.push(data.status);}
  if(data.assignedTo!==undefined){sets.push(`assigned_to=$${args.length+1}`);args.push(data.assignedTo);}
  if(data.tags!==undefined){sets.push(`tags=$${args.length+1}`);args.push(data.tags);}
  if(!sets.length)return jsonError('没有可更新字段');
  const rows=await db().query(`UPDATE inquiries SET ${sets.join(',')},updated_at=now() WHERE id=$${args.length+1} AND deleted_at IS NULL RETURNING id`,[...args,id]);
  if(!rows.length)return jsonError('询盘不存在',404);
  await audit(auth.user!.id,'update','inquiry',id,{status:data.status,assignedTo:data.assignedTo});
  return NextResponse.json({ok:true});
}
