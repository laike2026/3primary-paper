import {NextRequest,NextResponse} from 'next/server';
import {constantEquals} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {enqueueSitemapSubmission,runJobs} from '@/lib/admin/jobs';

export const runtime='nodejs';
export const maxDuration=60;

export async function GET(request:NextRequest){
  const secret=process.env.CRON_SECRET;
  const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||'';
  if(!secret||!constantEquals(token,secret))return NextResponse.json({error:'Forbidden'},{status:403});
  if(!process.env.DATABASE_URL||!process.env.GOOGLE_SERVICE_ACCOUNT_JSON||!process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL)
    return NextResponse.json({error:'Sync unavailable'},{status:503});
  await db().query('SELECT 1');
  const added=await enqueueSitemapSubmission();
  const jobs=await runJobs(1,'sitemap_submit');
  return NextResponse.json({added,jobs});
}
