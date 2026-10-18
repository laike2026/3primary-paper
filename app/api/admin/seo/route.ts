import {NextRequest,NextResponse} from 'next/server';
import {db} from '@/lib/admin/db';
import {guard} from '@/lib/admin/http';
export const runtime='nodejs';
export async function GET(request:NextRequest){
  const auth=await guard('seo:read');if(auth.response)return auth.response;
  const days=Math.max(1,Math.min(365,Number(request.nextUrl.searchParams.get('days'))||30));const sql=db();
  const [summary,daily,queries,pages,issues,lastSync,lastSubmission]=await Promise.all([
    sql.query(`SELECT coalesce(sum(clicks),0)::int AS clicks,coalesce(sum(impressions),0)::int AS impressions,coalesce(round((sum(position*impressions)/nullif(sum(impressions),0))::numeric,1),0) AS position FROM search_console_daily WHERE day>=current_date-$1::int`,[days]),
    sql.query(`SELECT day::text AS day,sum(clicks)::int AS clicks,sum(impressions)::int AS impressions FROM search_console_daily WHERE day>=current_date-$1::int GROUP BY day ORDER BY day DESC`,[days]),
    sql.query(`SELECT query,sum(clicks)::int AS clicks,sum(impressions)::int AS impressions FROM search_console_daily WHERE day>=current_date-$1::int AND query<>'' GROUP BY query ORDER BY clicks DESC,impressions DESC LIMIT 30`,[days]),
    sql.query(`SELECT page_url,sum(clicks)::int AS clicks,sum(impressions)::int AS impressions FROM search_console_daily WHERE day>=current_date-$1::int AND page_url<>'' GROUP BY page_url ORDER BY clicks DESC,impressions DESC LIMIT 30`,[days]),
    sql.query(`SELECT 'product_missing_english' AS type,count(*)::int AS count FROM content_products WHERE status='published' AND deleted_at IS NULL AND coalesce(name->>'en','')='' UNION ALL SELECT 'article_missing_english',count(*)::int FROM content_articles WHERE status='published' AND deleted_at IS NULL AND coalesce(title->>'en','')='' UNION ALL SELECT 'media_missing_alt',count(*)::int FROM media_assets WHERE deleted_at IS NULL AND coalesce(alt->>'en','')=''`),
    sql.query("SELECT created_at,finished_at,status,last_error,payload->'result' AS result FROM sync_jobs WHERE job_type='gsc_day' ORDER BY created_at DESC LIMIT 1"),
    sql.query("SELECT created_at,finished_at,status,last_error,payload->'result' AS result FROM sync_jobs WHERE job_type='sitemap_submit' ORDER BY created_at DESC LIMIT 1")
  ]);
  const clicks=Number(summary[0].clicks),impressions=Number(summary[0].impressions);
  return NextResponse.json({summary:{clicks,impressions,ctr:impressions?clicks/impressions:0,position:Number(summary[0].position)},daily,queries,pages,issues,lastSync:lastSync[0]||null,lastSubmission:lastSubmission[0]||null,property:process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL||''});
}
