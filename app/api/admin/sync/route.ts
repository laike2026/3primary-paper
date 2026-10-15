import {NextRequest,NextResponse} from 'next/server';
import {audit} from '@/lib/admin/auth';
import {db,pagination} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';
import {enqueueGsc,enqueueNotifications,runJobs} from '@/lib/admin/jobs';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(request:NextRequest){
  const auth=await guard('sync:read');if(auth.response)return auth.response;
  const {page,size,offset}=pagination(request.nextUrl.searchParams);const sql=db();
  const [items,total]=await Promise.all([sql.query('SELECT id,job_type,status,payload,attempt,max_attempts,available_at,last_error,created_at,started_at,finished_at FROM sync_jobs ORDER BY created_at DESC LIMIT $1 OFFSET $2',[size,offset]),sql.query('SELECT count(*)::int AS n FROM sync_jobs')]);
  return NextResponse.json({items,total:Number(total[0].n),page,size});
}
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('sync:run');if(auth.response)return auth.response;
  const kind=(await request.json().catch(()=>({}))).kind;
  if(kind!=='gsc'&&kind!=='notification')return jsonError('同步类型无效');
  const added=kind==='gsc'?await enqueueGsc(7):await enqueueNotifications();
  const jobs=await runJobs(3);
  await audit(auth.user!.id,'manual_sync','sync',kind,{added});
  return NextResponse.json({added,jobs});
}
