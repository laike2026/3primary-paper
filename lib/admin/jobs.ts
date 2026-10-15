import 'server-only';
import {randomUUID} from 'node:crypto';
import {db} from './db';
import {syncSearchConsoleDay} from './search-console';

export async function enqueueGsc(days=3){
  const sql=db();let added=0;
  for(let offset=2;offset<days+2;offset++){
    const date=new Date();date.setUTCDate(date.getUTCDate()-offset);const day=date.toISOString().slice(0,10);
    const rows=await sql.query(`INSERT INTO sync_jobs(id,job_type,payload) SELECT $1,'gsc_day',$2::jsonb WHERE NOT EXISTS (
      SELECT 1 FROM sync_jobs WHERE job_type='gsc_day' AND payload->>'day'=$3 AND created_at>now()-interval '6 hours' AND status IN ('pending','running','succeeded')) RETURNING id`,[randomUUID(),JSON.stringify({day}),day]);
    added+=rows.length;
  }
  return added;
}
async function notifyInquiry(id:string){
  const sql=db();const rows=await sql.query('SELECT * FROM inquiries WHERE id=$1 AND notification_status<>\'sent\' LIMIT 1',[id]);if(!rows.length)return;
  const item=rows[0];
  if(!process.env.RESEND_API_KEY||!process.env.INQUIRY_FROM_EMAIL)throw new Error('Email sender is not configured');
  const lines=[`Inquiry ${item.id}`,`Submitted: ${item.created_at}`,`Name: ${item.name}`,`Company: ${item.company}`,`Email: ${item.email}`,`Country: ${item.country}`,`Product: ${item.product_id}`,`Quantity: ${item.quantity}`,`Requirements: ${item.requirements}`,`Source: ${item.source_url}`];
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${process.env.RESEND_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({from:process.env.INQUIRY_FROM_EMAIL,to:[process.env.INQUIRY_NOTIFY_EMAIL||'alex.chen@3primary.com'],subject:`New 3PRIMARY inquiry ${item.id}`,text:lines.join('\n')})});
  if(!response.ok)throw new Error(`Email API ${response.status}`);
  await sql.query("UPDATE inquiries SET notification_status='sent',notified_at=now(),updated_at=now() WHERE id=$1",[id]);
}
export async function enqueueNotifications(){
  const sql=db();const rows=await sql.query(`SELECT id FROM inquiries WHERE notification_status IN ('pending','failed') AND (notification_next_at IS NULL OR notification_next_at<=now()) AND notification_attempts<8 ORDER BY created_at LIMIT 20`);
  let added=0;
  for(const row of rows){const found=await sql.query(`INSERT INTO sync_jobs(id,job_type,payload) SELECT $1,'notify_inquiry',$2::jsonb WHERE NOT EXISTS (
    SELECT 1 FROM sync_jobs WHERE job_type='notify_inquiry' AND payload->>'id'=$3 AND (status IN ('pending','running') OR (status='failed' AND attempt<max_attempts))) RETURNING id`,[randomUUID(),JSON.stringify({id:row.id}),row.id]);added+=found.length;}
  return added;
}
export async function runJobs(limit=6){
  const sql=db();const results:{id:string;type:string;status:string}[]=[];
  for(let i=0;i<limit;i++){
    const picked=await sql.query(`UPDATE sync_jobs SET status='running',attempt=attempt+1,started_at=now(),locked_until=now()+interval '5 minutes'
      WHERE id=(SELECT id FROM sync_jobs WHERE (status='pending' OR (status='failed' AND attempt<max_attempts) OR (status='running' AND locked_until<now())) AND available_at<=now() ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1)
      RETURNING id,job_type,payload,attempt`);
    if(!picked.length)break;const job=picked[0];
    try{
      if(job.job_type==='gsc_day')await syncSearchConsoleDay(String(job.payload.day));
      else if(job.job_type==='notify_inquiry')await notifyInquiry(String(job.payload.id));
      else throw new Error('Unknown job');
      await sql.query("UPDATE sync_jobs SET status='succeeded',finished_at=now(),locked_until=NULL,last_error='' WHERE id=$1",[job.id]);
      results.push({id:String(job.id),type:String(job.job_type),status:'succeeded'});
    }catch(error){
      const message=error instanceof Error?error.message:'Unknown error';
      const delay=Math.min(3600,Math.pow(2,Number(job.attempt))*60);
      await sql.query("UPDATE sync_jobs SET status='failed',last_error=$2,available_at=now()+($3::int*interval '1 second'),locked_until=NULL WHERE id=$1",[job.id,message.slice(0,500),delay]);
      if(job.job_type==='notify_inquiry')await sql.query("UPDATE inquiries SET notification_status='failed',notification_attempts=notification_attempts+1,notification_next_at=now()+($2::int*interval '1 second') WHERE id=$1",[job.payload.id,delay]);
      results.push({id:String(job.id),type:String(job.job_type),status:'failed'});
    }
  }
  return results;
}
export async function publishScheduled(){
  const sql=db();
  const [products,articles]=await Promise.all([
    sql.query("UPDATE content_products p SET status='published',published_at=now(),updated_at=now() WHERE p.status='scheduled' AND p.scheduled_at<=now() AND p.deleted_at IS NULL AND coalesce(p.name->>'en','')<>'' AND EXISTS(SELECT 1 FROM content_categories c WHERE c.slug=p.category_slug AND c.status='published' AND c.enabled=true AND c.deleted_at IS NULL) RETURNING p.id"),
    sql.query("UPDATE content_articles a SET status='published',published_at=now(),updated_at=now() WHERE a.status='scheduled' AND a.scheduled_at<=now() AND a.deleted_at IS NULL AND coalesce(a.title->>'en','')<>'' AND EXISTS(SELECT 1 FROM news_categories c WHERE c.slug=a.category_slug AND c.status='published' AND c.deleted_at IS NULL) RETURNING a.slug")
  ]);
  return products.length+articles.length;
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
