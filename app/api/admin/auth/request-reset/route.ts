import {NextRequest,NextResponse} from 'next/server';
import {randomBytes} from 'node:crypto';
import {z} from 'zod';
import {tokenHash} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {jsonError,sameOrigin} from '@/lib/admin/http';
import {isMailConfigured,sendTransactionalMail} from '@/lib/admin/mail';
export const runtime='nodejs';
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const parsed=z.object({email:z.email().max(254)}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('邮箱无效');
  const generic=NextResponse.json({ok:true,message:'如果账号存在且邮件服务可用，重置链接将发送至该邮箱。'});
  if(!process.env.DATABASE_URL||!isMailConfigured())return generic;
  const sql=db();const rows=await sql.query('SELECT id,email FROM admin_users WHERE email=$1 AND active=true LIMIT 1',[parsed.data.email.toLowerCase()]);if(!rows.length)return generic;
  const user=rows[0];const recent=await sql.query("SELECT count(*)::int AS n FROM admin_password_resets WHERE user_id=$1 AND created_at>now()-interval '1 hour'",[user.id]);if(Number(recent[0].n)>=3)return generic;
  const token=randomBytes(32).toString('base64url');
  const hashedToken=tokenHash(token);
  await sql.query("INSERT INTO admin_password_resets(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')",[hashedToken,user.id]);
  const origin=process.env.NEXT_PUBLIC_SITE_URL||request.nextUrl.origin;
  const link=new URL('/admin/reset-password',origin);link.searchParams.set('token',token);
  try {
    await sendTransactionalMail({
      to: String(user.email),
      subject: '3PRIMARY 管理后台密码重置',
      text: '请在 30 分钟内打开以下链接重置密码。若不是本人操作，可忽略此邮件。\n\n' + link.href,
    }, 'password-reset/' + hashedToken);
  } catch {
    console.error('Password reset email submission failed');
  }
  return generic;
}
