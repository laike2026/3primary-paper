import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit,issueSession,verifyPassword} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {jsonError,sameOrigin} from '@/lib/admin/http';

export const runtime='nodejs';
const schema=z.object({email:z.email(),password:z.string(),remember:z.boolean().optional()});
export async function POST(request:NextRequest) {
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  if(!process.env.DATABASE_URL)return jsonError('登录服务未配置',503);
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return jsonError('邮箱或密码错误',400);
  const sql=db();const email=parsed.data.email.toLowerCase();
  const rows=await sql.query('SELECT id,password_hash,active,failed_attempts,locked_until FROM admin_users WHERE email=$1 LIMIT 1',[email]);
  const user=rows[0];
  if(!user || !user.active || (user.locked_until && new Date(String(user.locked_until))>new Date()) || !verifyPassword(parsed.data.password,String(user.password_hash))){
    if(user && user.active)await sql.query(`UPDATE admin_users SET failed_attempts=failed_attempts+1,locked_until=CASE WHEN failed_attempts+1>=5 THEN now()+interval '15 minutes' ELSE locked_until END WHERE id=$1`,[user.id]);
    return jsonError('邮箱或密码错误，或账号暂时锁定',401);
  }
  await sql.query('UPDATE admin_users SET failed_attempts=0,locked_until=NULL,last_login_at=now() WHERE id=$1',[user.id]);
  await issueSession(String(user.id),Boolean(parsed.data.remember),request.headers.get('user-agent')||'');
  await audit(String(user.id),'login','admin_user',String(user.id));
  return NextResponse.json({ok:true});
}
