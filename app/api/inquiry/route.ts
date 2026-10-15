import {NextRequest, NextResponse} from 'next/server';
import {neon} from '@neondatabase/serverless';
import {z} from 'zod';
import {createHash, randomBytes} from 'node:crypto';
import {publishedProducts} from '@/lib/admin/content';
import {db} from '@/lib/admin/db';

export const runtime = 'nodejs';
const schema = z.object({
  name:z.string().trim().min(2).max(120), company:z.string().trim().min(2).max(180),phone:z.string().max(50).optional().default(''),
  email:z.email().max(254), country:z.string().trim().min(2).max(100),
  productId:z.string().min(1).max(40), quantity:z.string().max(100).optional().default(''),
  requirements:z.string().trim().min(10).max(5000), consent:z.literal('true'),
  locale:z.enum(['en','ar','ru','es']), sourceUrl:z.url().max(1000),
  referrer:z.string().max(1000).optional().default(''), website:z.string().optional().default(''),
  clientRequestId:z.uuid().optional(),analyticsSessionId:z.uuid().optional(),formId:z.string().max(80).optional().default('')
});
export async function POST(request:NextRequest){
  if(!process.env.DATABASE_URL||!process.env.INQUIRY_HASH_SECRET){
    return NextResponse.json({error:'Online inquiry is not configured. Please email alex.chen@3primary.com.'},{status:503});
  }
  const origin=request.headers.get('origin');
  if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:'Invalid origin'},{status:403});
  const length=Number(request.headers.get('content-length')||0);
  if(length>16000)return NextResponse.json({error:'Request too large'},{status:413});
  let input:unknown;
  try{input=await request.json();}catch{return NextResponse.json({error:'Invalid JSON'},{status:400});}
  const parsed=schema.safeParse(input);
  if(!parsed.success)return NextResponse.json({error:'Please check the required fields.'},{status:400});
  const value=parsed.data;
  if(value.website)return NextResponse.json({error:'Submission rejected.'},{status:400});
  const product=(await publishedProducts()).find(item=>item.id===value.productId);
  if(!product)return NextResponse.json({error:'Unknown product.'},{status:400});
  const sql=neon(process.env.DATABASE_URL);
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const ipHash=createHash('sha256').update(ip+process.env.INQUIRY_HASH_SECRET).digest('hex');
  const submittedAt=new Date();
  const id=`TP-${submittedAt.toISOString().slice(0,10).replaceAll('-','')}-${randomBytes(3).toString('hex').toUpperCase()}`;
  const url=new URL(value.sourceUrl);
  const utm={source:url.searchParams.get('utm_source')||'',medium:url.searchParams.get('utm_medium')||'',campaign:url.searchParams.get('utm_campaign')||''};
  const ua=(request.headers.get('user-agent')||'').slice(0,300);
  const device=/Mobi|Android/i.test(ua)?'mobile':/Tablet|iPad/i.test(ua)?'tablet':'desktop';
  try{
    if(value.clientRequestId){const existing=await sql.query('SELECT id FROM inquiries WHERE client_request_id=$1 LIMIT 1',[value.clientRequestId]);if(existing.length)return NextResponse.json({id:existing[0].id,notificationPending:true},{status:200});}
    const rows=await sql`SELECT count(*)::int AS count FROM inquiries WHERE ip_hash=${ipHash} AND created_at > now() - interval '10 minutes'`;
    if(Number(rows[0]?.count||0)>=3)return NextResponse.json({error:'Too many submissions. Please try again later.'},{status:429});
    const previous=await sql.query("SELECT id FROM inquiries WHERE lower(email)=lower($1) AND created_at>now()-interval '30 days' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1",[value.email]);
    await sql.query(`INSERT INTO inquiries (id,name,company,email,country,product_id,product_slug,quantity,requirements,locale,source_url,referrer,utm_source,utm_medium,utm_campaign,utm_content,utm_term,ip_hash,notification_status,client_request_id,notification_next_at,form_type,phone,user_agent,device_type,consent_at,duplicate_of)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'pending',$19,now(),$20,$21,$22,$23,now(),$24)`,
      [id,value.name,value.company,value.email,value.country,product.id,product.slug,value.quantity,value.requirements,value.locale,value.sourceUrl,value.referrer,utm.source,utm.medium,utm.campaign,url.searchParams.get('utm_content')||'',url.searchParams.get('utm_term')||'',ipHash,value.clientRequestId||null,value.formId||'general',value.phone,ua,device,previous[0]?.id||null]);
    if(request.cookies.get('analytics_consent')?.value==='yes'&&value.analyticsSessionId){
      await db().query(`INSERT INTO analytics_events(event_id,event_type,session_id,visitor_id,page_path,placement,locale,product_id,form_id,metadata)
        VALUES(gen_random_uuid(),'form_submit_success',$1,$2,$3,'form',$4,$5,$6,$7::jsonb)`,
        [value.analyticsSessionId,request.cookies.get('primary_visitor')?.value||'',url.pathname,value.locale,product.id,value.formId,JSON.stringify({inquiryId:id})]).catch(error=>console.error('Inquiry analytics failed',error));
    }
  }catch(error){console.error('Inquiry storage failed',error);return NextResponse.json({error:'Inquiry service is unavailable. Please use email.'},{status:503});}
  // Delivery is retried by the worker. An email outage must never make a stored lead look lost.
  return NextResponse.json({id,notificationPending:true},{status:201,headers:{'Cache-Control':'no-store'}});
}
