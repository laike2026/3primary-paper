import {redirect} from 'next/navigation';
import {can,currentAdmin,type Permission} from '@/lib/admin/auth';
import {AdminShell,type AdminNavItem} from '@/components/admin/AdminShell';
const nav:(AdminNavItem&{permission:Permission})[]=[
  {href:'/admin',label:'总览',group:'工作台',icon:'dashboard',permission:'dashboard:read'},
  {href:'/admin/content/categories',label:'产品分类',group:'内容管理',icon:'categories',permission:'content:read'},
  {href:'/admin/content/products',label:'产品管理',group:'内容管理',icon:'products',permission:'content:read'},
  {href:'/admin/content/news-categories',label:'新闻分类',group:'内容管理',icon:'newsCategories',permission:'content:read'},
  {href:'/admin/content/articles',label:'新闻管理',group:'内容管理',icon:'articles',permission:'content:read'},
  {href:'/admin/inquiries',label:'询盘管理',group:'客户与数据',icon:'inquiries',permission:'inquiries:read'},
  {href:'/admin/tracking',label:'数据追踪',group:'客户与数据',icon:'tracking',permission:'analytics:read'},
  {href:'/admin/analytics',label:'访问分析',group:'客户与数据',icon:'traffic',permission:'analytics:read'},
  {href:'/admin/seo',label:'搜索表现',group:'客户与数据',icon:'search',permission:'seo:read'},
  {href:'/admin/media',label:'媒体库',group:'网站资源',icon:'media',permission:'media:read'},
  {href:'/admin/sync',label:'数据同步',group:'网站资源',icon:'sync',permission:'sync:read'},
  {href:'/admin/users',label:'账号权限',group:'系统管理',icon:'users',permission:'users:read'},
  {href:'/admin/audit',label:'操作记录',group:'系统管理',icon:'audit',permission:'audit:read'},
  {href:'/admin/settings',label:'网站设置',group:'系统管理',icon:'settings',permission:'settings:read'}
];
export default async function AdminProtectedLayout({children}:{children:React.ReactNode}){
  const user=await currentAdmin();if(!user)redirect('/admin/login');
  const items=nav.filter(item=>can(user.role,item.permission)).map(item=>({href:item.href,label:item.label,group:item.group,icon:item.icon}));
  return <AdminShell items={items} user={user}>{children}</AdminShell>;
}
