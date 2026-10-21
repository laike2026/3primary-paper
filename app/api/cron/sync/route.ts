import {NextRequest,NextResponse} from 'next/server';
import {constantEquals} from '@/lib/admin/auth';
import {cleanupExpired,enqueueGsc,enqueueNotifications,publishScheduledProducts,runJobs} from '@/lib/admin/jobs';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(request:NextRequest){
  const secret=process.env.CRON_SECRET;const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||'';
  if(!secret||!constantEquals(token,secret))return NextResponse.json({error:'Forbidden'},{status:403});
  if(!process.env.DATABASE_URL)return NextResponse.json({error:'Database unavailable'},{status:503});
  const searchDays=process.env.GOOGLE_SERVICE_ACCOUNT_JSON&&process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?await enqueueGsc(14):0;
  const notifications=await enqueueNotifications();
  const published=await publishScheduledProducts();
  const jobs=await runJobs(6);
  const cleanup=await cleanupExpired();
  return NextResponse.json({searchDays,notifications,published,jobs,cleanup});
}
