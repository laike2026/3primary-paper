import Image from 'next/image';
import Link from 'next/link';
import {ResetForm} from '@/components/admin/ResetForm';
export default function ForgotPassword(){return <main className="admin-auth-page"><div className="admin-auth-card"><Image className="admin-auth-logo" src="/images/brand/official-logo.jpg" width={174} height={52} alt="3PRIMARY 正式商标"/><small>3PRIMARY · 安全管理</small><h1>找回密码</h1><p>输入管理员邮箱，系统会发送 30 分钟有效的重置链接。</p><ResetForm mode="request"/><div className="admin-auth-links"><Link href="/admin/login">返回登录</Link></div></div></main>;}
