import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit,passwordHash,tokenHash} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {jsonError,sameOrigin} from '@/lib/admin/http';
export const runtime='nodejs';
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const parsed=z.object({token:z.string().min(30).max(200),password:z.string().min(12).max(200)}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('重置链接或密码无效');
  const sql=db();const hash=passwordHash(parsed.data.password);
  const rows=await sql.query('UPDATE admin_password_resets SET used_at=now() WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() RETURNING user_id',[tokenHash(parsed.data.token)]);if(!rows.length)return jsonError('重置链接无效或已过期',410);
  const id=String(rows[0].user_id);await sql.query('UPDATE admin_users SET password_hash=$1,failed_attempts=0,locked_until=NULL,updated_at=now() WHERE id=$2',[hash,id]);await sql.query('UPDATE admin_sessions SET revoked_at=now() WHERE user_id=$1',[id]);await audit(id,'password_reset','admin_user',id);return NextResponse.json({ok:true});
}
