'use client';
import {useEffect,useState,useSyncExternalStore} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {AdminIcon,type AdminIconName} from './AdminIcon';
import {AdminLogout} from './AdminLogout';
import {roleLabels} from '@/lib/admin/presentation';
const mobileQuery='(max-width:800px)';
const subscribe=(callback:()=>void)=>{const media=window.matchMedia(mobileQuery);media.addEventListener('change',callback);return()=>media.removeEventListener('change',callback);};
const mobileSnapshot=()=>window.matchMedia(mobileQuery).matches;
export type AdminNavItem={href:string;label:string;group:string;icon:AdminIconName};
export function AdminShell({items,user,children}:{items:AdminNavItem[];user:{name:string;role:string;email:string|null;username:string|null};children:React.ReactNode}){
  const pathname=usePathname();const [open,setOpen]=useState(false);const mobile=useSyncExternalStore(subscribe,mobileSnapshot,()=>false);
  useEffect(()=>{if(!open||!mobile)return;const original=document.body.style.overflow;document.body.style.overflow='hidden';const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};document.addEventListener('keydown',escape);return()=>{document.body.style.overflow=original;document.removeEventListener('keydown',escape);};},[open,mobile]);
  const current=items.find(item=>item.href===pathname)||items.find(item=>item.href!=='/admin'&&pathname.startsWith(item.href));
  return <div className={`admin-shell${open?' nav-open':''}`}>
    {open&&<button className="admin-nav-scrim" aria-label="关闭导航" onClick={()=>setOpen(false)}/>}
    <aside className="admin-sidebar" id="admin-navigation" inert={mobile&&!open} aria-hidden={mobile&&!open}>
      <Link href="/admin" className="admin-brand" onClick={()=>setOpen(false)}><Image src="/images/brand/official-logo.jpg" width={166} height={50} alt="3PRIMARY" priority/><span>管理后台</span></Link>
      <nav aria-label="后台导航">{items.map((item,index)=><div key={item.href}>{items[index-1]?.group!==item.group&&<span className="admin-nav-group">{item.group}</span>}<Link href={item.href} className={current?.href===item.href?'active':''} aria-current={current?.href===item.href?'page':undefined} onClick={()=>setOpen(false)}><AdminIcon name={item.icon}/><span>{item.label}</span></Link></div>)}</nav>
      <div className="admin-sidebar-bottom"><div className="admin-user"><AdminIcon name="user"/><div><strong>{user.name}</strong><small>{roleLabels[user.role]||'成员'}</small></div></div><AdminLogout/></div>
    </aside>
    <div className="admin-main"><header className="admin-topbar"><div className="admin-topbar-title"><button className="admin-menu-button" aria-label="打开导航" aria-expanded={open} aria-controls="admin-navigation" onClick={()=>setOpen(!open)}><AdminIcon name="menu"/></button><span>3PRIMARY <span className="admin-topbar-divider">/</span> {current?.label||'管理后台'}</span></div><div className="admin-topbar-actions"><Link href="/en" target="_blank" rel="noopener noreferrer">查看网站<AdminIcon name="external"/></Link><span className="admin-topbar-user"><AdminIcon name="user"/>{user.name}</span></div></header><main className="admin-content">{children}</main></div>
  </div>;
}
