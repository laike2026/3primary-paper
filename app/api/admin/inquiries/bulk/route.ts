import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';
export const runtime='nodejs';
const schema=z.object({ids:z.array(z.string().max(50)).min(1).max(50),status:z.enum(['new','pending_contact','contacted','qualified','unqualified','quoting','quoted','won','lost','spam','archived']).optional(),assignedTo:z.uuid().nullable().optional()});
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);const auth=await guard('inquiries:write');if(auth.response)return auth.response;
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success||parsed.data.status===undefined&&parsed.data.assignedTo===undefined)return jsonError('批量操作无效');
  const {ids,status,assignedTo}=parsed.data;const sql=db();
  if(assignedTo){const users=await sql.query("SELECT id FROM admin_users WHERE id=$1 AND active=true AND role IN ('superadmin','admin','sales')",[assignedTo]);if(!users.length)return jsonError('负责人不存在或不可分配');}
  const results:{id:string;ok:boolean}[]=[];
  for(const id of new Set(ids)){
    const sets:string[]=[];const args:unknown[]=[];
    if(status!==undefined){sets.push(`status=$${args.length+1}`);args.push(status);}
    if(assignedTo!==undefined){sets.push(`assigned_to=$${args.length+1}`);args.push(assignedTo);}
    const rows=await sql.query(`UPDATE inquiries SET ${sets.join(',')},updated_at=now() WHERE id=$${args.length+1} AND deleted_at IS NULL RETURNING id`,[...args,id]);results.push({id,ok:rows.length>0});
  }
  await audit(auth.user!.id,'bulk_update','inquiries','',{count:results.filter(x=>x.ok).length,status,assignedTo});
  return NextResponse.json({results});
}
