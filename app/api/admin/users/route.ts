import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit,newId,passwordHash,roles} from '@/lib/admin/auth';
import {db,pagination} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';

export const runtime='nodejs';
const schema=z.object({email:z.email().max(254),name:z.string().trim().min(2).max(100),role:z.enum(roles),password:z.string().min(12).max(200)});
export async function GET(request:NextRequest){const auth=await guard('users:read');if(auth.response)return auth.response;const {page,size,offset}=pagination(request.nextUrl.searchParams);const sql=db();const [items,count]=await Promise.all([sql.query('SELECT id,username,email,name,role,active,last_login_at,created_at FROM admin_users ORDER BY created_at DESC LIMIT $1 OFFSET $2',[size,offset]),sql.query('SELECT count(*)::int AS total FROM admin_users')]);return NextResponse.json({items,total:Number(count[0].total),page,size});}
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('users:write');if(auth.response)return auth.response;
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('账号信息无效。密码至少 12 位');
  if(parsed.data.role==='superadmin'&&auth.user!.role!=='superadmin')return jsonError('只有超级管理员可创建超级管理员',403);
  const id=newId();try{await db().query('INSERT INTO admin_users(id,email,name,password_hash,role) VALUES($1,$2,$3,$4,$5)',[id,parsed.data.email.toLowerCase(),parsed.data.name,passwordHash(parsed.data.password),parsed.data.role]);await audit(auth.user!.id,'create','admin_user',id,{role:parsed.data.role});return NextResponse.json({ok:true,id},{status:201});}catch{return jsonError('邮箱已存在或保存失败',409);}
}
