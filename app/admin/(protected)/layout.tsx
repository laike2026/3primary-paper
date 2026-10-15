import Link from 'next/link';
import Image from 'next/image';
import {redirect} from 'next/navigation';
import {can,currentAdmin,type Permission} from '@/lib/admin/auth';
import {AdminLogout} from '@/components/admin/AdminLogout';

const nav:{href:string;label:string;permission:Permission}[]=[
  {href:'/admin',label:'总览',permission:'dashboard:read'},
  {href:'/admin/content/categories',label:'产品分类',permission:'content:read'},
  {href:'/admin/content/products',label:'产品管理',permission:'content:read'},
  {href:'/admin/content/news-categories',label:'新闻分类',permission:'content:read'},
  {href:'/admin/content/articles',label:'新闻管理',permission:'content:read'},
  {href:'/admin/inquiries',label:'询盘管理',permission:'inquiries:read'},
  {href:'/admin/tracking',label:'数据追踪',permission:'analytics:read'},
  {href:'/admin/analytics',label:'访问分析',permission:'analytics:read'},
  {href:'/admin/seo',label:'SEO / Search Console',permission:'seo:read'},
  {href:'/admin/media',label:'媒体库',permission:'media:read'},
  {href:'/admin/sync',label:'同步任务',permission:'sync:read'},
  {href:'/admin/users',label:'账号权限',permission:'users:read'},
  {href:'/admin/audit',label:'操作审计',permission:'audit:read'},
  {href:'/admin/settings',label:'系统设置',permission:'settings:read'}
];
export default async function AdminProtectedLayout({children}:{children:React.ReactNode}){
  const user=await currentAdmin();if(!user)redirect('/admin/login');
  return <div className="admin-shell"><aside className="admin-sidebar"><Link href="/admin" className="admin-brand"><Image src="/images/brand/official-logo.jpg" width={135} height={42} alt="3PRIMARY"/><span>管理后台</span></Link><nav aria-label="后台导航">{nav.filter(item=>can(user.role,item.permission)).map(item=><Link href={item.href} key={item.href}>{item.label}</Link>)}</nav><div className="admin-sidebar-bottom"><strong>{user.name}</strong><small>{user.email}</small><AdminLogout/></div></aside><div className="admin-main"><header className="admin-topbar"><span>3PRIMARY · 全球 B2B 网站</span><div><span>{user.name} · {user.role}</span><Link href="/en" target="_blank">查看网站 ↗</Link></div></header><main className="admin-content">{children}</main></div></div>;
}
