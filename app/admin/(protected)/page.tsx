import {redirect} from 'next/navigation';
import Link from 'next/link';
import {db} from '@/lib/admin/db';
import {currentAdmin,can} from '@/lib/admin/auth';

export const dynamic='force-dynamic';
export default async function Dashboard(){
  const user=await currentAdmin();if(!user)redirect('/admin/login');
  const sql=db();
  const [products,articles,inquiries,events]=await Promise.all([
    sql.query('SELECT count(*)::int AS n FROM content_products WHERE deleted_at IS NULL'),
    sql.query('SELECT count(*)::int AS n FROM content_articles WHERE deleted_at IS NULL'),
    can(user.role,'inquiries:read')?sql.query('SELECT count(*)::int AS n FROM inquiries WHERE deleted_at IS NULL'):Promise.resolve([{n:0}]),
    can(user.role,'analytics:read')?sql.query("SELECT count(*)::int AS n FROM analytics_events WHERE occurred_at >= now()-interval '30 days'"):Promise.resolve([{n:0}])
  ]);
  return <><div className="admin-page-heading"><div><small>网站运营</small><h1>总览</h1><p>内容、询盘与追踪数据来自当前连接的数据库。</p></div><span className="admin-date">近 30 天事件</span></div><div className="admin-kpis"><div><small>产品</small><strong>{products[0].n}</strong><Link href="/admin/content/products">管理产品 →</Link></div><div><small>新闻</small><strong>{articles[0].n}</strong><Link href="/admin/content/articles">管理新闻 →</Link></div>{can(user.role,'inquiries:read')&&<div><small>全部询盘</small><strong>{inquiries[0].n}</strong><Link href="/admin/inquiries">查看询盘 →</Link></div>}{can(user.role,'analytics:read')&&<div><small>追踪事件</small><strong>{events[0].n}</strong><Link href="/admin/tracking">查看漏斗 →</Link></div>}</div><section className="admin-panel"><h2>工作入口</h2><div className="admin-shortcuts">{[['产品管理','/admin/content/products'],['询盘管理','/admin/inquiries'],['数据追踪','/admin/tracking'],['Search Console','/admin/seo']].map(([label,href])=><Link key={href} href={href}>{label} <span>→</span></Link>)}</div></section></>;
}
