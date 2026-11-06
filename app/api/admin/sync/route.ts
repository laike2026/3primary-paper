import {NextRequest,NextResponse} from 'next/server';
import {audit} from '@/lib/admin/auth';
import {db,pagination} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';
import {enqueueGsc,enqueueNotifications,enqueueSitemapSubmission,runJobs} from '@/lib/admin/jobs';
import {isSearchConsoleConfigured} from '@/lib/admin/search-console';
import {isMailConfigured} from '@/lib/admin/mail';
import {isIndexingEnabled} from '@/lib/site';
import {z} from 'zod';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(request:NextRequest){
  const auth=await guard('sync:read');if(auth.response)return auth.response;
  const {page,size,offset}=pagination(request.nextUrl.searchParams);const sql=db();
  const [items,total,summary]=await Promise.all([
    sql.query('SELECT id,job_type,status,payload,attempt,max_attempts,available_at,last_error,created_at,started_at,finished_at FROM sync_jobs ORDER BY created_at DESC LIMIT $1 OFFSET $2',[size,offset]),
    sql.query('SELECT count(*)::int AS n FROM sync_jobs'),
    sql.query(`SELECT
      max(finished_at) FILTER (WHERE job_type='gsc_day' AND status='succeeded') AS last_search_sync,
      max(finished_at) FILTER (WHERE job_type='sitemap_submit' AND status='succeeded') AS last_submission,
      count(*) FILTER (WHERE status IN ('pending','running') OR (status='failed' AND attempt<max_attempts))::int AS open,
      count(*) FILTER (WHERE status='failed' AND attempt>=max_attempts)::int AS exhausted
      FROM sync_jobs`),
  ]);
  return NextResponse.json({items,total:Number(total[0].n),page,size,summary:summary[0],
    ready:{gsc:isSearchConsoleConfigured(),mail:isMailConfigured(),submission:isIndexingEnabled}});
}
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('sync:run');if(auth.response)return auth.response;
  const body=await request.json().catch(()=>({}));
  const kind=body.kind;
  if(kind==='retry'){
    const id=z.uuid().safeParse(body.id);
    if(!id.success)return jsonError('任务编号无效');
    const sql=db();
    const [job]=await sql.query('SELECT job_type FROM sync_jobs WHERE id=$1 AND status=$2',[id.data,'failed']);
    if(!job)return jsonError('任务已处理或不存在',409);
    if(job.job_type==='notify_inquiry'&&!isMailConfigured())return jsonError('邮件通知待配置',503);
    if(job.job_type!=='notify_inquiry'&&!isSearchConsoleConfigured())return jsonError('Search Console 尚未配置',503);
    if(job.job_type==='sitemap_submit'&&!isIndexingEnabled)return jsonError('正式站点提交尚未启用',503);
    const updated=await sql.query("UPDATE sync_jobs SET status='pending',attempt=0,available_at=now(),locked_until=NULL,finished_at=NULL WHERE id=$1 AND status='failed' RETURNING id",[id.data]);
    if(!updated.length)return jsonError('任务已重新排队',409);
    await audit(auth.user!.id,'manual_sync','sync',id.data,{kind:'retry'});
    return NextResponse.json({added:1,jobs:[]});
  }
  if(kind!=='gsc'&&kind!=='notification'&&kind!=='sitemap')return jsonError('同步类型无效');
  if(kind==='notification'&&!isMailConfigured())return jsonError('邮件通知待配置',503);
  if(kind!=='notification'&&!isSearchConsoleConfigured())return jsonError('Search Console 尚未配置',503);
  if(kind==='sitemap'&&!isIndexingEnabled)return jsonError('正式站点提交尚未启用',503);
  const added=kind==='gsc'?await enqueueGsc(14):kind==='sitemap'?await enqueueSitemapSubmission():await enqueueNotifications();
  const jobs=await runJobs(kind==='gsc'?2:kind==='sitemap'?1:3,kind==='gsc'?'gsc_day':kind==='sitemap'?'sitemap_submit':'notify_inquiry');
  await audit(auth.user!.id,'manual_sync','sync',kind,{added});
  return NextResponse.json({added,jobs});
}
