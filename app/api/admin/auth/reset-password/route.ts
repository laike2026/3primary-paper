import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {passwordHash,tokenHash} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {jsonError,sameOrigin} from '@/lib/admin/http';
export const runtime='nodejs';
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const parsed=z.object({token:z.string().min(30).max(200),password:z.string().min(12).max(200)}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('重置链接或密码无效');
  const sql=db();const hash=passwordHash(parsed.data.password);
  const rows=await sql.query(`WITH claimed AS (
    UPDATE admin_password_resets r SET used_at=now()
    FROM admin_users u WHERE r.token_hash=$1 AND r.used_at IS NULL AND r.expires_at>now()
      AND u.id=r.user_id AND u.active RETURNING r.user_id
  ), changed AS (
    UPDATE admin_users SET password_hash=$2,failed_attempts=0,locked_until=NULL,updated_at=now()
      WHERE id IN (SELECT user_id FROM claimed) RETURNING id
  ), revoked AS (
    UPDATE admin_sessions SET revoked_at=now() WHERE user_id IN (SELECT id FROM changed)
  ), expired AS (
    UPDATE admin_password_resets SET used_at=now() WHERE user_id IN (SELECT id FROM changed)
      AND used_at IS NULL AND token_hash<>$1
  ), logged AS (
    INSERT INTO admin_audit_log(actor_id,action,entity_type,entity_id)
      SELECT id,'password_reset','admin_user',id::text FROM changed
  ) SELECT id FROM changed`,[tokenHash(parsed.data.token),hash]);
  if(!rows.length)return jsonError('重置链接无效或已过期',410);
  return NextResponse.json({ok:true});
}
