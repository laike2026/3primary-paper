import 'server-only';
import {randomUUID} from 'node:crypto';
import {site} from '../site';
import {db} from './db';
import {isSearchConsoleConfigured,submitSitemap,syncSearchConsoleDay} from './search-console';
import {inquiryRecipient,isMailConfigured,sendTransactionalMail} from './mail';
import {refreshPublicData} from './public-cache';

export async function enqueueGsc(days=14){
  const sql=db();
  const latest=new Date();latest.setUTCDate(latest.getUTCDate()-2);
  const latestDay=latest.toISOString().slice(0,10);
  const earliestAllowed=new Date(latest);earliestAllowed.setUTCDate(earliestAllowed.getUTCDate()-479);
  const initial=new Date(latest);initial.setUTCDate(initial.getUTCDate()-Math.max(1,days)+1);
  const first=await sql.query("SELECT min(payload->>'day') AS sync_day FROM sync_jobs WHERE job_type='gsc_day' AND payload->>'day' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'");
  const firstDay=String(first[0]?.sync_day||initial.toISOString().slice(0,10));
  const start=firstDay<earliestAllowed.toISOString().slice(0,10)?earliestAllowed:new Date(`${firstDay}T00:00:00Z`);
  const existing=await sql.query(`SELECT payload->>'day' AS sync_day,status,max(coalesce(finished_at,created_at)) AS last_at,
    bool_or(attempt<max_attempts) AS retryable FROM sync_jobs WHERE job_type='gsc_day'
    AND payload->>'day' BETWEEN $1 AND $2 GROUP BY 1,2`,[start.toISOString().slice(0,10),latestDay]);
  const totals=await sql.query("SELECT day::text AS sync_day FROM search_console_daily WHERE site_url=$1 AND day BETWEEN $2 AND $3 AND page_url='' AND query='' AND country='' AND device=''",[process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL||'',start.toISOString().slice(0,10),latestDay]);
  const hasTotal=new Set(totals.map(row=>String(row.sync_day)));
  const byDay=new Map<string,typeof existing>();
  for(const row of existing){const day=String(row.sync_day);byDay.set(day,[...(byDay.get(day)||[]),row]);}
  const candidates:string[]=[];
  for(let date=new Date(start);date<=latest;date.setUTCDate(date.getUTCDate()+1)){
    const day=date.toISOString().slice(0,10);
    const rows=byDay.get(day)||[];
    if(rows.some(row=>row.status==='pending'||row.status==='running'||(row.status==='failed'&&row.retryable)))continue;
    const success=rows.find(row=>row.status==='succeeded');
    const recent=latest.getTime()-date.getTime()<7*86400000;
    if(success&&hasTotal.has(day)&&(!recent||rows.some(row=>row.status==='succeeded'&&Date.now()-new Date(String(row.last_at)).getTime()<72*3600000)))continue;
    if(!success&&rows.some(row=>row.status==='failed'&&Date.now()-new Date(String(row.last_at)).getTime()<72*3600000))continue;
    candidates.push(day);
    if(candidates.length>=30)break;
  }
  if(!candidates.length)return 0;
  const [,created]=await sql.transaction([
    sql.query("SELECT pg_advisory_xact_lock(hashtext('enqueue-gsc'))"),
    sql.query(`INSERT INTO sync_jobs(id,job_type,payload)
      SELECT candidate.id,'gsc_day',jsonb_build_object('day',candidate.day)
      FROM unnest($1::uuid[],$2::text[]) AS candidate(id,day)
      WHERE NOT EXISTS(SELECT 1 FROM sync_jobs WHERE job_type='gsc_day' AND payload->>'day'=candidate.day AND
      (status IN ('pending','running') OR (status='failed' AND attempt<max_attempts) OR
      coalesce(finished_at,created_at)>now()-interval '1 hour')) RETURNING id`,
      [candidates.map(()=>randomUUID()),candidates]),
  ]);
  return created.length;
}
export async function enqueueSitemapSubmission(){
  const sql=db();
  const [,rows]=await sql.transaction([
    sql.query("SELECT pg_advisory_xact_lock(hashtext('enqueue-sitemap'))"),
    sql.query(`INSERT INTO sync_jobs(id,job_type,payload) SELECT $1,'sitemap_submit','{}'::jsonb WHERE NOT EXISTS (
      SELECT 1 FROM sync_jobs WHERE job_type='sitemap_submit' AND (status IN ('pending','running') OR
      (status='failed' AND attempt<max_attempts) OR (status='succeeded' AND finished_at>now()-interval '1 hour'))) RETURNING id`,[randomUUID()]),
  ]);
  return rows.length;
}
async function notifyInquiry(id:string){
  const sql=db();
  const rows=await sql.query("SELECT id,product_id,country,created_at FROM inquiries WHERE id=$1 AND deleted_at IS NULL AND notification_status<>'sent' LIMIT 1",[id]);
  if(!rows.length)return {skipped:true};
  const item=rows[0];
  const page=new URL('/admin/inquiries',site.origin);
  page.searchParams.set('q',id);
  const lines=['Inquiry '+id,'Submitted: '+new Date(String(item.created_at)).toISOString(),
    'Product: '+(item.product_id||'Help choosing a product'),'Country / region: '+item.country,
    '', 'Open the 3PRIMARY admin to see the buyer details:',page.href];
  const deliveryId=await sendTransactionalMail({to:inquiryRecipient,subject:'New 3PRIMARY inquiry '+id,text:lines.join('\n')},'inquiry/'+id);
  await sql.query("UPDATE inquiries SET notification_status='sent',notified_at=now(),updated_at=now() WHERE id=$1",[id]);
  return {deliveryId,acceptedAt:new Date().toISOString()};
}
export async function enqueueNotifications(){
  if(!isMailConfigured())return 0;
  const sql=db();
  const candidates=await sql.query(`SELECT i.id FROM inquiries i WHERE i.deleted_at IS NULL
    AND i.notification_status IN ('pending','failed') AND (i.notification_next_at IS NULL OR i.notification_next_at<=now())
    AND i.notification_attempts<8 AND NOT EXISTS(SELECT 1 FROM sync_jobs j WHERE j.job_type='notify_inquiry'
    AND j.payload->>'id'=i.id AND (j.status IN ('pending','running') OR (j.status='failed' AND j.attempt<j.max_attempts)))
    ORDER BY i.created_at LIMIT 20`);
  if(!candidates.length)return 0;
  const [,rows]=await sql.transaction([
    sql.query("SELECT pg_advisory_xact_lock(hashtext('enqueue-inquiry-mail'))"),
    sql.query(`INSERT INTO sync_jobs(id,job_type,payload)
      SELECT candidate.id,'notify_inquiry',jsonb_build_object('id',i.id)
      FROM unnest($1::uuid[],$2::text[]) AS candidate(id,inquiry_id)
      JOIN inquiries i ON i.id=candidate.inquiry_id
      WHERE i.deleted_at IS NULL AND i.notification_status IN ('pending','failed')
      AND NOT EXISTS(SELECT 1 FROM sync_jobs j WHERE j.job_type='notify_inquiry' AND j.payload->>'id'=i.id
      AND (j.status IN ('pending','running') OR (j.status='failed' AND j.attempt<j.max_attempts))) RETURNING id`,
      [candidates.map(()=>randomUUID()),candidates.map(row=>row.id)]),
  ]);
  return rows.length;
}
export async function runJobs(limit=6,onlyType:'gsc_day'|'sitemap_submit'|'notify_inquiry'|null=null){
  const sql=db();const results:{id:string;type:string;status:string}[]=[];
  const mailReady=isMailConfigured();
  const googleReady=isSearchConsoleConfigured();
  const deadline=Date.now()+40_000;
  await sql.query("UPDATE sync_jobs SET status='failed',locked_until=NULL,finished_at=now(),last_error='执行超时，已达到重试上限' WHERE status='running' AND locked_until<now() AND attempt>=max_attempts");
  for(let i=0;i<limit;i++){
    if(Date.now()>deadline)break;
    const picked=await sql.query(`UPDATE sync_jobs SET status='running',attempt=attempt+1,started_at=now(),locked_until=now()+interval '5 minutes'
      WHERE id=(SELECT id FROM sync_jobs WHERE ($1::text IS NULL OR job_type=$1)
      AND (($2::boolean AND job_type='notify_inquiry') OR ($3::boolean AND job_type IN ('gsc_day','sitemap_submit')))
      AND attempt<max_attempts AND (status IN ('pending','failed') OR (status='running' AND locked_until<now())) AND available_at<=now() ORDER BY CASE WHEN job_type='notify_inquiry' THEN 0 WHEN job_type='sitemap_submit' THEN 1 ELSE 2 END,available_at,id FOR UPDATE SKIP LOCKED LIMIT 1)
      RETURNING id,job_type,payload,attempt`,[onlyType,mailReady,googleReady]);
    if(!picked.length)break;const job=picked[0];
    try{
      let result:Record<string,unknown>={};
      if(job.job_type==='gsc_day')result={rowCount:await syncSearchConsoleDay(String(job.payload.day))};
      else if(job.job_type==='sitemap_submit')result=await submitSitemap();
      else if(job.job_type==='notify_inquiry')result=await notifyInquiry(String(job.payload.id));
      else throw new Error('Unknown job');
      await sql.query("UPDATE sync_jobs SET status='succeeded',finished_at=now(),locked_until=NULL,last_error='',payload=payload||jsonb_build_object('result',$2::jsonb) WHERE id=$1",[job.id,JSON.stringify(result)]);
      results.push({id:String(job.id),type:String(job.job_type),status:'succeeded'});
    }catch(error){
      const message=error instanceof Error?error.message:'Unknown error';
      const delay=Math.min(3600,Math.pow(2,Number(job.attempt))*60);
      await sql.query("UPDATE sync_jobs SET status='failed',last_error=$2,available_at=now()+($3::int*interval '1 second'),locked_until=NULL,finished_at=now() WHERE id=$1",[job.id,message.slice(0,240),delay]);
      if(job.job_type==='notify_inquiry')await sql.query("UPDATE inquiries SET notification_status='failed',notification_attempts=notification_attempts+1,notification_next_at=now()+($2::int*interval '1 second') WHERE id=$1 AND notification_status<>'sent'",[job.payload.id,delay]);
      results.push({id:String(job.id),type:String(job.job_type),status:'failed'});
    }
  }
  return results;
}
export async function publishScheduledProducts(){
  const products=await db().query("UPDATE content_products p SET status='published',published_at=now(),updated_at=now() WHERE p.status='scheduled' AND p.scheduled_at<=now() AND p.deleted_at IS NULL AND coalesce(p.name->>'en','')<>'' AND EXISTS(SELECT 1 FROM content_categories c WHERE c.slug=p.category_slug AND c.status='published' AND c.enabled=true AND c.deleted_at IS NULL) RETURNING p.id");
  if (products.length) refreshPublicData('catalog');
  return products.length;
}
export async function cleanupExpired(){
  const sql=db();
  const [events,sessions,resets,jobs]=await Promise.all([
    sql.query("DELETE FROM analytics_events WHERE event_id IN (SELECT event_id FROM analytics_events WHERE occurred_at<now()-interval '13 months' LIMIT 1000) RETURNING event_id"),
    sql.query("DELETE FROM admin_sessions WHERE expires_at<now()-interval '30 days' RETURNING token_hash"),
    sql.query("DELETE FROM admin_password_resets WHERE expires_at<now()-interval '30 days' RETURNING token_hash"),
    sql.query("DELETE FROM sync_jobs WHERE finished_at<now()-interval '90 days' AND status='succeeded' RETURNING id")
  ]);
  return {events:events.length,sessions:sessions.length,resets:resets.length,jobs:jobs.length};
}
