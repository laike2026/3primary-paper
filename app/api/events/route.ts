import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/admin/db';

export const runtime='nodejs';
const eventType=z.enum(['page_view','product_view','article_view','address_click','whatsapp_click','form_cta_click','form_view','form_open','form_start','form_field_complete','form_submit_attempt','form_submit_failure']);
const schema=z.object({eventId:z.uuid(),type:eventType,sessionId:z.uuid(),visitorId:z.uuid(),pagePath:z.string().startsWith('/').max(500),placement:z.string().max(80).optional().default(''),locale:z.enum(['en','ar','ru','es']).optional().default('en'),productId:z.string().max(50).optional().default(''),formId:z.string().max(80).optional().default(''),fieldKey:z.string().max(60).optional().default(''),metadata:z.record(z.string(),z.union([z.string().max(100),z.number(),z.boolean()])).optional().default({})});
export async function POST(request:NextRequest){
  if(request.cookies.get('analytics_consent')?.value!=='yes')return new NextResponse(null,{status:204});
  const origin=request.headers.get('origin');if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:'origin'},{status:403});
  if(Number(request.headers.get('content-length')||0)>4000)return NextResponse.json({error:'size'},{status:413});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'invalid'},{status:400});
  if(!process.env.DATABASE_URL)return NextResponse.json({error:'unavailable'},{status:503});
  const e=parsed.data;const url=new URL(e.pagePath,request.nextUrl.origin);const country=(request.headers.get('x-vercel-ip-country')||'').slice(0,2);
  const source=(request.headers.get('referer')||'').slice(0,500);const ua=request.headers.get('user-agent')||'';
  const device=/Mobi|Android/i.test(ua)?'mobile':/Tablet|iPad/i.test(ua)?'tablet':'desktop';
  try{
    const sql=db();
    const quota=await sql.query("SELECT count(*)::int AS n FROM analytics_events WHERE session_id=$1 AND occurred_at>now()-interval '1 minute'",[e.sessionId]);
    if(Number(quota[0].n)>60)return new NextResponse(null,{status:429});
    await sql.query(`INSERT INTO analytics_events(event_id,event_type,session_id,visitor_id,page_path,placement,locale,product_id,form_id,field_key,source,utm_source,utm_medium,utm_campaign,device_type,country,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb) ON CONFLICT(event_id) DO NOTHING`,
      [e.eventId,e.type,e.sessionId,e.visitorId,url.pathname,e.placement,e.locale,e.productId,e.formId,e.fieldKey,source,url.searchParams.get('utm_source')||'',url.searchParams.get('utm_medium')||'',url.searchParams.get('utm_campaign')||'',device,country,JSON.stringify(e.metadata)]);
    return new NextResponse(null,{status:202});
  }catch(error){console.error('Event write failed',error);return NextResponse.json({error:'unavailable'},{status:503});}
}
