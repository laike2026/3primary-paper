import {redirect} from 'next/navigation';
import Link from 'next/link';
import {db} from '@/lib/admin/db';
import {currentAdmin,can} from '@/lib/admin/auth';
import {isMailConfigured} from '@/lib/admin/mail';
import {AdminIcon,type AdminIconName} from '@/components/admin/AdminIcon';
import {DashboardRefresh} from '@/components/admin/DashboardRefresh';

export const dynamic='force-dynamic';
const chinaDate=(value:Date, dateStyle:'short'|'long'='short')=>
  new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',dateStyle}).format(value);

export default async function Dashboard(){
  const user=await currentAdmin();
  if(!user)redirect('/admin/login');
  const sql=db();
  const content=can(user.role,'content:read');
  const leads=can(user.role,'inquiries:read');
  const analytics=can(user.role,'analytics:read');
  const sync=can(user.role,'sync:read');

  const [products,articles,inquiries,events,recent,jobs]=await Promise.all([
    content ? sql.query('SELECT count(*)::int AS n FROM content_products WHERE deleted_at IS NULL') : [],
    content ? sql.query('SELECT count(*)::int AS n FROM content_articles WHERE deleted_at IS NULL') : [],
    leads ? sql.query(`SELECT count(*)::int AS n,
      count(*) FILTER(WHERE status IN ('new','pending_contact'))::int AS followup,
      count(*) FILTER(WHERE status IN ('new','pending_contact') AND assigned_to IS NULL)::int AS unassigned
      FROM inquiries WHERE deleted_at IS NULL`) : [],
    analytics ? sql.query("SELECT count(*)::int AS n FROM analytics_events WHERE occurred_at >= now()-interval '30 days' AND event_type IN ('address_click','whatsapp_click','form_open')") : [],
    leads ? sql.query('SELECT id,name,company,country,product_id,created_at FROM inquiries WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 6') : [],
    sync ? sql.query(`SELECT
      count(*) FILTER(WHERE status='failed')::int AS failed,
      count(*) FILTER(WHERE job_type='notify_inquiry' AND status='failed')::int AS failed_mail,
      max(finished_at) FILTER(WHERE job_type='gsc_day' AND status='succeeded') AS gsc_at
      FROM sync_jobs`) : [],
  ]);

  const metrics:{label:string;value:number;icon:AdminIconName;href:string}[]=[];
  if(content)metrics.push({label:'产品',value:products[0].n,icon:'products',href:'/admin/content/products'},
    {label:'新闻',value:articles[0].n,icon:'articles',href:'/admin/content/articles'});
  if(leads)metrics.push({label:'全部询盘',value:inquiries[0].n,icon:'inquiries',href:'/admin/inquiries'});
  if(analytics)metrics.push({label:'近 30 天联系行为',value:events[0].n,icon:'tracking',href:'/admin/tracking'});

  return <>
    <DashboardRefresh/>
    <div className="admin-page-heading"><div><small>工作台</small><h1>总览</h1></div>
      <span className="admin-date"><AdminIcon name="calendar"/>{chinaDate(new Date(),'long')}</span>
    </div>
    {(leads || sync) && <section className="admin-panel workbench-panel">
      <h2><AdminIcon name="dashboard"/>待办与同步</h2>
      <div className="workbench-grid">
        {leads && <>
          <Link href="/admin/inquiries?status=needs-followup"><span>待跟进询盘</span><strong>{inquiries[0].followup}</strong><small>新询盘与待联系</small></Link>
          <Link href="/admin/inquiries?status=needs-followup&assignee=unassigned"><span>待分配负责人</span><strong>{inquiries[0].unassigned}</strong><small>仍需跟进的询盘</small></Link>
        </>}
        {sync && <>
          <Link href="/admin/sync"><span>邮件通知失败</span><strong>{jobs[0].failed_mail}</strong><small>{isMailConfigured()?'查看发送与重试':'发信服务待配置'}</small></Link>
          <Link href="/admin/sync"><span>同步状态</span><strong>{jobs[0].failed}</strong><small>{jobs[0].gsc_at?'最近搜索数据 '+chinaDate(new Date(jobs[0].gsc_at)):'暂无成功的搜索数据同步'}</small></Link>
        </>}
      </div>
    </section>}
    {metrics.length>0 && <div className="admin-kpis">{metrics.map(metric=><div key={metric.label}>
      <div className="admin-kpi-icon"><AdminIcon name={metric.icon}/></div>
      <small>{metric.label}</small><strong>{Number(metric.value).toLocaleString('zh-CN')}</strong>
      <Link href={metric.href}>查看详情 <AdminIcon name="arrowRight"/></Link>
    </div>)}</div>}
    {leads && <section className="admin-panel">
      <div className="admin-panel-head"><h2><AdminIcon name="inquiries"/>最新询盘</h2>
        <Link href="/admin/inquiries">查看全部 <AdminIcon name="arrowRight"/></Link>
      </div>
      <div className="admin-table-wrap admin-card-wrap"><table className="admin-table admin-card-table">
        <thead><tr><th>时间</th><th>客户</th><th>公司</th><th>产品</th><th>国家/地区</th></tr></thead>
        <tbody>{recent.map(row=><tr key={row.id}>
          <td data-label="时间">{chinaDate(new Date(row.created_at))}</td>
          <td data-label="客户"><Link href={'/admin/inquiries?q='+encodeURIComponent(row.id)}>{row.name}</Link></td>
          <td data-label="公司">{row.company||'—'}</td><td data-label="产品">{row.product_id||'待选型'}</td>
          <td data-label="国家/地区">{row.country||'—'}</td>
        </tr>)}</tbody>
      </table>{!recent.length&&<div className="admin-empty"><AdminIcon name="inquiries"/>暂无询盘</div>}</div>
    </section>}
  </>;
}
