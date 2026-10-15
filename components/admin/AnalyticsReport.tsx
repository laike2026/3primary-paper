'use client';
import {Fragment,useEffect,useState} from 'react';
import {AdminIcon,type AdminIconName} from './AdminIcon';
import {TrendChart,type ChartSeries,type ChartPoint} from './TrendChart';
type EventRow={event_type:string;count:number;unique_sessions:number};
type Breakdown={label:string;event_type:string;count:number};
type Report={period:{from:string;to:string};events:EventRow[];sessions:{sessions:number;visitors:number;average_seconds:number;bounce_percent:number};breakdown:Breakdown[];daily:{day:string;event_type:string;count:number}[];leadCount:number};
const eventNames:Record<string,string>={page_view:'页面浏览',product_view:'产品浏览',article_view:'新闻浏览',address_click:'地址点击',whatsapp_click:'WhatsApp 点击',form_cta_click:'表单入口点击',form_view:'表单展现',form_open:'表单打开',form_start:'开始填写',form_field_complete:'字段完成',form_submit_attempt:'尝试提交',form_submit_success:'提交成功',form_submit_failure:'提交失败'};
const dimensions=[['page','页面'],['placement','入口位置'],['locale','语言'],['device','设备'],['country','国家'],['source','来源'],['product','产品'],['form','表单']] as const;
const trackingSeries:ChartSeries[]=[{key:'address_click',label:'地址点击',color:'#6ce4ad'},{key:'whatsapp_click',label:'WhatsApp',color:'#63b9f1'},{key:'form_open',label:'表单打开',color:'#eebc62'}];
const trafficSeries:ChartSeries[]=[{key:'page_view',label:'页面浏览',color:'#6ce4ad'},{key:'product_view',label:'产品浏览',color:'#63b9f1'}];
const format=(n:number)=>n.toLocaleString('zh-CN');
export function AnalyticsReport({mode}:{mode:'tracking'|'traffic'}){
  const [days,setDays]=useState(30),[dimension,setDimension]=useState('page'),[from,setFrom]=useState(''),[to,setTo]=useState(''),[report,setReport]=useState<Report|null>(null),[countries,setCountries]=useState<Breakdown[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const query=new URLSearchParams({days:String(days),dimension,...(from?{from}:{}),...(to?{to}:{})}).toString();
  useEffect(()=>{let cancelled=false;
    async function load(){setLoading(true);setError('');try{const read=async(q:string)=>{const r=await fetch(`/api/admin/analytics?${q}`);const b=await r.json();if(!r.ok)throw new Error(b.error||'加载失败');return b as Report;};const [main,country]=await Promise.all([read(query),mode==='tracking'?read(new URLSearchParams({...Object.fromEntries(new URLSearchParams(query)),dimension:'country'}).toString()):Promise.resolve(null)]);if(!cancelled){setReport(main);setCountries(country?.breakdown||[]);}}catch(e){if(!cancelled)setError(e instanceof Error?e.message:'加载失败');}finally{if(!cancelled)setLoading(false);}}
    void load();return()=>{cancelled=true;};
  },[query,mode]);
  const count=(type:string)=>report?.events.find(x=>x.event_type===type)?.count||0;
  const unique=(type:string)=>report?.events.find(x=>x.event_type===type)?.unique_sessions||0;
  const percent=(n:number,total:number)=>total?`${(n*100/total).toFixed(1)}%`:'—';
  const series=mode==='tracking'?trackingSeries:trafficSeries;
  const dayMap=new Map<string,ChartPoint>();
  if(report?.period){const start=Date.parse(`${report.period.from}T00:00:00Z`),end=Date.parse(`${report.period.to}T00:00:00Z`);for(let t=start;t<=end;t+=86400000){const day=new Date(t).toISOString().slice(0,10);dayMap.set(day,{day,values:{}});}}
  for(const row of report?.daily||[]){const day=String(row.day).slice(0,10);const point=dayMap.get(day)||{day,values:{}};point.values[row.event_type]=row.count;dayMap.set(day,point);}
  const points=Array.from(dayMap.values()).sort((a,b)=>a.day.localeCompare(b.day));
  const metric=(type:string,icon:AdminIconName)=><div className="admin-metric-card" key={type}><div className="admin-kpi-icon"><AdminIcon name={icon}/></div><div><small>{eventNames[type]}</small><strong>{loading?'—':format(count(type))}</strong><span>{format(unique(type))} 个会话</span></div></div>;
  const contactTable=(rows:Breakdown[],title:string)=>{
    const grouped=new Map<string,Record<string,number>>();for(const row of rows){if(!trackingSeries.some(s=>s.key===row.event_type))continue;const label=row.label||'未识别';const group=grouped.get(label)||{};group[row.event_type]=row.count;grouped.set(label,group);}
    const entries=Array.from(grouped).sort((a,b)=>Object.values(b[1]).reduce((x,y)=>x+y,0)-Object.values(a[1]).reduce((x,y)=>x+y,0)).slice(0,10);
    return <div className="admin-table-wrap admin-contact-table"><table className="admin-table"><thead><tr><th>{title}</th><th>地址点击</th><th>WhatsApp</th><th>表单打开</th></tr></thead><tbody>{entries.map(([label,values])=><tr key={label}><td className="admin-long-url">{label}</td>{trackingSeries.map(s=><td key={s.key}>{format(values[s.key]||0)}</td>)}</tr>)}</tbody></table>{!entries.length&&<div className="admin-empty"><AdminIcon name="empty"/>{loading?'加载中…':'暂无联系行为'}</div>}</div>;
  };
  return <>
    <div className="admin-page-heading"><div><small>客户与数据</small><h1>{mode==='tracking'?'数据追踪':'访问分析'}</h1></div><div className="admin-toolbar"><select aria-label="快捷日期" value={days} onChange={e=>{setDays(Number(e.target.value));setFrom('');setTo('');}}>{[1,7,30,90,365].map(n=><option value={n} key={n}>近 {n} 天</option>)}</select><input aria-label="开始日期" type="date" value={from} onChange={e=>setFrom(e.target.value)}/><input aria-label="结束日期" type="date" value={to} onChange={e=>setTo(e.target.value)}/><a className="admin-primary" href={`/api/admin/analytics?${query}&format=csv`}><AdminIcon name="download"/>导出数据</a></div></div>
    {error&&<p className="admin-error" role="alert"><AdminIcon name="warning"/>{error}</p>}
    {mode==='tracking'?<>
      <div className="admin-kpis admin-tracking-kpis">{metric('address_click','address')}{metric('whatsapp_click','whatsapp')}{metric('form_open','form')}</div>
      <div className="admin-report-grid"><section className="admin-panel"><div className="admin-panel-head"><h2><AdminIcon name="filter"/>表单转化流程</h2><span className="admin-pill">{percent(unique('form_submit_success'),unique('form_open'))}</span></div><div className="admin-funnel">{([['form_open','表单打开','form'],['form_start','开始填写','write'],['form_submit_success','提交成功','success']] as const).map(([type,label,icon],i)=><Fragment key={type}><div className="admin-funnel-step"><div className="admin-kpi-icon"><AdminIcon name={icon}/></div><small>{label}</small><strong>{loading?'—':format(unique(type))}</strong><span>{i?percent(unique(type),unique('form_open')):'会话数'}</span></div>{i<2&&<AdminIcon name="arrowRight" className="admin-funnel-arrow"/>}</Fragment>)}</div><div className="admin-inline-stats"><span>字段完成<strong>{format(count('form_field_complete'))}</strong></span><span>尝试提交<strong>{format(count('form_submit_attempt'))}</strong></span><span>全部询盘<strong>{format(report?.leadCount||0)}</strong></span></div></section><section className="admin-panel"><div className="admin-panel-head"><h2><AdminIcon name="tracking"/>关键行为趋势</h2></div><div className="admin-legend">{series.map(s=><span key={s.key}><i style={{'--series-color':s.color} as React.CSSProperties}/>{s.label}</span>)}</div><TrendChart points={points} series={series} loading={loading}/></section></div>
      <div className="admin-two-col"><section className="admin-panel"><div className="admin-panel-head"><h2><AdminIcon name="link"/>联系行为来源</h2><select className="admin-select" aria-label="分析维度" value={dimension} onChange={e=>setDimension(e.target.value)}>{dimensions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>{contactTable(report?.breakdown||[],dimensions.find(x=>x[0]===dimension)?.[1]||'页面')}</section><section className="admin-panel"><h2><AdminIcon name="globe"/>国家与地区</h2>{contactTable(countries,'国家/地区')}</section></div>
    </>:<>
      <div className="admin-kpis">{[['访问量',format(count('page_view')),'traffic'],['访客',format(report?.sessions.visitors||0),'users'],['平均参与时长',`${report?.sessions.average_seconds||0} 秒`,'audit'],['单页会话占比',`${report?.sessions.bounce_percent||0}%`,'dashboard']].map(([label,value,icon])=><div key={label}><div className="admin-kpi-icon"><AdminIcon name={icon as AdminIconName}/></div><small>{label}</small><strong>{loading?'—':value}</strong></div>)}</div>
      <section className="admin-panel"><div className="admin-panel-head"><h2><AdminIcon name="traffic"/>访问趋势</h2><div className="admin-legend">{series.map(s=><span key={s.key}><i style={{'--series-color':s.color} as React.CSSProperties}/>{s.label}</span>)}</div></div><TrendChart points={points} series={series} loading={loading}/></section>
      <section className="admin-panel"><div className="admin-panel-head"><h2><AdminIcon name="filter"/>访问明细</h2><select className="admin-select" aria-label="分析维度" value={dimension} onChange={e=>setDimension(e.target.value)}>{dimensions.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{dimensions.find(x=>x[0]===dimension)?.[1]}</th><th>行为</th><th>次数</th></tr></thead><tbody>{report?.breakdown.map((row,i)=><tr key={i}><td className="admin-long-url">{row.label||'未识别'}</td><td>{eventNames[row.event_type]||'其他行为'}</td><td>{format(row.count)}</td></tr>)}</tbody></table>{!report?.breakdown.length&&<div className="admin-empty"><AdminIcon name="empty"/>暂无访问数据</div>}</div></section>
    </>}
    <details className="admin-stat-note"><summary><AdminIcon name="shield"/>统计口径</summary><p>联系行为统计已同意访问分析的访客。表单漏斗按会话去重；全部询盘包含未参与访问统计的有效提交。地址与 WhatsApp 点击表示联系意向。</p></details>
  </>;
}
