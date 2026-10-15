import Image from 'next/image';
import Link from 'next/link';
import {ResetForm} from '@/components/admin/ResetForm';
export default async function ResetPassword({searchParams}:{searchParams:Promise<{token?:string}>}){const {token=''}=await searchParams;return <main className="admin-auth-page"><div className="admin-auth-card"><Image className="admin-auth-logo" src="/images/brand/official-logo.jpg" width={174} height={52} alt="3PRIMARY 正式商标"/><small>3PRIMARY · 安全管理</small><h1>设置新密码</h1><p>新密码至少 12 位。</p><ResetForm mode="reset" token={token}/><div className="admin-auth-links"><Link href="/admin/login">返回登录</Link></div></div></main>;}
