import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit,passwordHash,roles} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';

export const runtime='nodejs';
type Ctx={params:Promise<{id:string}>};
const schema=z.object({name:z.string().trim().min(2).max(100),email:z.union([z.email().max(254),z.literal(''),z.null()]).optional(),role:z.enum(roles),active:z.boolean(),password:z.union([z.string().min(12).max(200),z.literal('')]).optional()});
export async function PATCH(request:NextRequest,{params}:Ctx){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('users:write');if(auth.response)return auth.response;
  const {id}=await params;const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('账号信息无效');
  const sql=db();const existing=await sql.query('SELECT role,email FROM admin_users WHERE id=$1',[id]);if(!existing.length)return jsonError('账号不存在',404);
  if((existing[0].role==='superadmin'||parsed.data.role==='superadmin')&&auth.user!.role!=='superadmin')return jsonError('只有超级管理员可修改超级管理员',403);
  if(id===auth.user!.id&&(!parsed.data.active||parsed.data.role!==auth.user!.role))return jsonError('不能停用或降低自己的权限');
  if(existing[0].role==='superadmin'&&(!parsed.data.active||parsed.data.role!=='superadmin')){const count=await sql.query("SELECT count(*)::int AS n FROM admin_users WHERE role='superadmin' AND active=true");if(Number(count[0].n)<=1)return jsonError('必须保留至少一名可用的超级管理员');}
  const email=parsed.data.email?.toLowerCase()||null;
  if(existing[0].email&&email&&email!==existing[0].email)return jsonError('已绑定邮箱不可修改');
  try{await sql.query('UPDATE admin_users SET name=$1,role=$2,active=$3,password_hash=coalesce($4,password_hash),email=coalesce(email,$5),updated_at=now() WHERE id=$6',[parsed.data.name,parsed.data.role,parsed.data.active,parsed.data.password?passwordHash(parsed.data.password):null,email,id]);}
  catch{return jsonError('邮箱已存在或保存失败',409);}
  if(!parsed.data.active||parsed.data.password||parsed.data.role!==existing[0].role)await sql.query('UPDATE admin_sessions SET revoked_at=now() WHERE user_id=$1',[id]);
  await audit(auth.user!.id,'update','admin_user',id,{role:parsed.data.role,active:parsed.data.active,passwordChanged:Boolean(parsed.data.password),emailBound:!existing[0].email&&Boolean(email)});
  return NextResponse.json({ok:true});
}
