import {NextRequest,NextResponse} from 'next/server';
import {stringify} from 'csv-stringify/sync';
import {db} from '@/lib/admin/db';
import {guard,jsonError} from '@/lib/admin/http';
export const runtime='nodejs';
const dimensions={page:'page_path',placement:'placement',locale:'locale',device:'device_type',country:'country',source:'utm_source',product:'product_id',form:'form_id'} as const;
function range(params:URLSearchParams){
  const days=Math.max(1,Math.min(365,Number(params.get('days'))||30));
  const to=params.get('to')||new Date(Date.now()+8*3600000).toISOString().slice(0,10);
  const from=params.get('from')||new Date(Date.now()+8*3600000-(days-1)*86400000).toISOString().slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to))return null;
  const start=new Date(`${from}T00:00:00Z`),end=new Date(`${to}T00:00:00Z`);
  if(!Number.isFinite(start.valueOf())||!Number.isFinite(end.valueOf())||end<start||end.valueOf()-start.valueOf()>366*86400000)return null;
  return {from,to,days};
}
export async function GET(request:NextRequest){
  const auth=await guard('analytics:read');if(auth.response)return auth.response;
  const period=range(request.nextUrl.searchParams);if(!period)return jsonError('日期范围无效，最多 366 天');
  const dimension=(request.nextUrl.searchParams.get('dimension')||'page') as keyof typeof dimensions;
  const column=dimensions[dimension]||dimensions.page;
  const from=`${period.from}T00:00:00+08:00`,to=new Date(Date.parse(`${period.to}T00:00:00+08:00`)+86400000).toISOString();
  const sql=db();
  const [events,sessions,breakdown,daily,leads]=await Promise.all([
    sql.query('SELECT event_type,count(*)::int AS count,count(DISTINCT session_id)::int AS unique_sessions FROM analytics_events WHERE occurred_at>=$1 AND occurred_at<$2 GROUP BY event_type ORDER BY count DESC',[from,to]),
    sql.query(`WITH visits AS (SELECT session_id,visitor_id,count(*) FILTER (WHERE event_type='page_view') AS views,min(occurred_at) AS first_at,max(occurred_at) AS last_at FROM analytics_events WHERE occurred_at>=$1 AND occurred_at<$2 AND session_id<>'' GROUP BY session_id,visitor_id)
      SELECT count(*) FILTER (WHERE views>0)::int AS sessions,count(DISTINCT visitor_id) FILTER (WHERE views>0 AND visitor_id<>'')::int AS visitors,coalesce(round(avg(extract(epoch FROM last_at-first_at)) FILTER (WHERE views>0)),0)::int AS average_seconds,
      coalesce(round(100.0*count(*) FILTER (WHERE views=1)/nullif(count(*) FILTER (WHERE views>0),0),1),0) AS bounce_percent FROM visits`,[from,to]),
    sql.query(`SELECT ${column} AS label,event_type,count(*)::int AS count,count(DISTINCT session_id)::int AS unique_sessions FROM analytics_events WHERE occurred_at>=$1 AND occurred_at<$2 GROUP BY ${column},event_type ORDER BY count DESC LIMIT 1000`,[from,to]),
    sql.query("SELECT to_char(occurred_at AT TIME ZONE 'Asia/Shanghai','YYYY-MM-DD') AS day,event_type,count(*)::int AS count FROM analytics_events WHERE occurred_at>=$1 AND occurred_at<$2 GROUP BY day,event_type ORDER BY day",[from,to]),
    sql.query('SELECT count(*)::int AS total FROM inquiries WHERE created_at>=$1 AND created_at<$2 AND deleted_at IS NULL',[from,to])
  ]);
  if(request.nextUrl.searchParams.get('format')==='csv'){
    const rows=breakdown.map(row=>({dimension:dimension,label:row.label||'',event_type:row.event_type,count:row.count,unique_sessions:row.unique_sessions,from:period.from,to:period.to}));
    return new NextResponse('\ufeff'+stringify(rows,{header:true,columns:['dimension','label','event_type','count','unique_sessions','from','to']}),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="analytics-${period.from}-${period.to}.csv"`}});
  }
  return NextResponse.json({period,dimension,events,sessions:sessions[0],breakdown,daily,leadCount:Number(leads[0].total),source:'first_party_consent',notice:'行为事件仅统计同意匿名分析的访客；询盘数来自服务端入库。来源维度只记录 UTM 标记，不是 GA4 渠道报告。'});
}
