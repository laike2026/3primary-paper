import {redirect} from 'next/navigation';
import Link from 'next/link';
import {db} from '@/lib/admin/db';
import {currentAdmin,can,type Permission} from '@/lib/admin/auth';
import {AdminIcon,type AdminIconName} from '@/components/admin/AdminIcon';
export const dynamic='force-dynamic';
export default async function Dashboard(){
  const user=await currentAdmin();if(!user)redirect('/admin/login');const sql=db();
  const [products,articles,inquiries,events,recent]=await Promise.all([
    sql.query('SELECT count(*)::int AS n FROM content_products WHERE deleted_at IS NULL'),
    sql.query('SELECT count(*)::int AS n FROM content_articles WHERE deleted_at IS NULL'),
    can(user.role,'inquiries:read')?sql.query('SELECT count(*)::int AS n FROM inquiries WHERE deleted_at IS NULL'):Promise.resolve([{n:0}]),
    can(user.role,'analytics:read')?sql.query("SELECT count(*)::int AS n FROM analytics_events WHERE occurred_at >= now()-interval '30 days' AND event_type IN ('address_click','whatsapp_click','form_open')"):Promise.resolve([{n:0}]),
    can(user.role,'inquiries:read')?sql.query('SELECT id,name,company,country,product_id,created_at FROM inquiries WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 6'):Promise.resolve([])
  ]);
  const metrics:{label:string;value:number;icon:AdminIconName;href:string;permission?:Permission}[]=[{label:'产品',value:products[0].n,icon:'products',href:'/admin/content/products',permission:'content:read'},{label:'新闻',value:articles[0].n,icon:'articles',href:'/admin/content/articles',permission:'content:read'},{label:'全部询盘',value:inquiries[0].n,icon:'inquiries',href:'/admin/inquiries',permission:'inquiries:read'},{label:'近 30 天联系行为',value:events[0].n,icon:'tracking',href:'/admin/tracking',permission:'analytics:read'}];
  const shortcuts=metrics.filter(m=>!m.permission||can(user.role,m.permission));
  return <><div className="admin-page-heading"><div><small>工作台</small><h1>总览</h1></div><span className="admin-date"><AdminIcon name="calendar"/>{new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',dateStyle:'long'}).format(new Date())}</span></div><div className="admin-kpis">{shortcuts.map(m=><div key={m.label}><div className="admin-kpi-icon"><AdminIcon name={m.icon}/></div><small>{m.label}</small><strong>{Number(m.value).toLocaleString('zh-CN')}</strong><Link href={m.href}>查看详情 <AdminIcon name="arrowRight"/></Link></div>)}</div><section className="admin-panel"><h2><AdminIcon name="dashboard"/>常用操作</h2><div className="admin-shortcuts">{shortcuts.map(m=><Link href={m.href} key={m.href}><AdminIcon name={m.icon}/>{m.label==='近 30 天联系行为'?'数据追踪':`${m.label.replace('全部','')}管理`}<AdminIcon name="arrowRight"/></Link>)}</div></section>{can(user.role,'inquiries:read')&&<section className="admin-panel"><div className="admin-panel-head"><h2><AdminIcon name="inquiries"/>最新询盘</h2><Link href="/admin/inquiries">查看全部 <AdminIcon name="arrowRight"/></Link></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>时间</th><th>客户</th><th>公司</th><th>产品</th><th>国家/地区</th></tr></thead><tbody>{recent.map(row=><tr key={row.id}><td>{new Date(row.created_at).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'})}</td><td>{row.name}</td><td>{row.company||'—'}</td><td>{row.product_id||'—'}</td><td>{row.country||'—'}</td></tr>)}</tbody></table>{!recent.length&&<div className="admin-empty"><AdminIcon name="inquiries"/>暂无询盘</div>}</div></section>}</>;
}
