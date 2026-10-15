import Image from 'next/image';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {currentAdmin} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {AuthForm} from '@/components/admin/AuthForm';
export default async function Login(){if(await currentAdmin())redirect('/admin');const firstUse=process.env.DATABASE_URL?Number((await db().query('SELECT count(*)::int AS n FROM admin_users'))[0].n)===0:false;return <main className="admin-auth-page"><div className="admin-auth-card"><Image className="admin-auth-logo" src="/images/brand/official-logo.jpg" width={174} height={52} alt="3PRIMARY 正式商标" priority/><small>3PRIMARY · 管理后台</small><h1>登录管理后台</h1><p>管理产品、询盘与网站数据</p><AuthForm mode="login"/><div className="admin-auth-links"><Link href="/admin/forgot-password">忘记密码</Link>{firstUse&&<Link href="/admin/setup">首次开通</Link>}<Link href="/en">返回网站</Link></div></div></main>;}
