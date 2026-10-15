import Image from 'next/image';
import {AuthForm} from '@/components/admin/AuthForm';
export default function Setup(){return <main className="admin-auth-page"><div className="admin-auth-card"><Image className="admin-auth-logo" src="/images/brand/official-logo.jpg" width={174} height={52} alt="3PRIMARY 正式商标"/><small>3PRIMARY · 首次初始化</small><h1>创建首位管理员</h1><p>使用开通口令创建管理员账号。</p><AuthForm mode="setup"/></div></main>;}
