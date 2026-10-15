'use client';
import {AdminIcon} from './AdminIcon';
import {useRouter} from 'next/navigation';
export function AdminLogout(){const router=useRouter();return <button className="admin-logout" onClick={async()=>{await fetch('/api/admin/auth/logout',{method:'POST'});router.push('/admin/login');router.refresh();}}><AdminIcon name="logout"/>退出登录</button>;}
