import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit,constantEquals,issueSession,newId,passwordHash} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {jsonError,sameOrigin} from '@/lib/admin/http';

export const runtime='nodejs';
const schema=z.object({token:z.string().min(20),email:z.email().max(254),name:z.string().trim().min(2).max(100),password:z.string().min(12).max(200)});
export async function POST(request:NextRequest) {
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  if(!process.env.ADMIN_BOOTSTRAP_TOKEN || !process.env.DATABASE_URL)return jsonError('初始化未配置',503);
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return jsonError('请填写完整信息');
  if(!constantEquals(parsed.data.token,process.env.ADMIN_BOOTSTRAP_TOKEN))return jsonError('初始化口令无效',403);
  const sql=db();const count=await sql.query('SELECT count(*)::int AS total FROM admin_users');
  if(Number(count[0].total)>0)return jsonError('管理员已创建',409);
  const id=newId();
  await sql.query('INSERT INTO admin_users(id,email,name,password_hash,role) VALUES($1,$2,$3,$4,\'superadmin\')',[id,parsed.data.email.toLowerCase(),parsed.data.name,passwordHash(parsed.data.password)]);
  await issueSession(id,false,request.headers.get('user-agent')||'');
  await audit(id,'bootstrap','admin_user',id);
  return NextResponse.json({ok:true});
}
