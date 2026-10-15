'use client';
import {useRouter} from 'next/navigation';
export function AdminLogout(){const router=useRouter();return <button className="admin-logout" onClick={async()=>{await fetch('/api/admin/auth/logout',{method:'POST'});router.push('/admin/login');router.refresh();}}>退出登录</button>;}
