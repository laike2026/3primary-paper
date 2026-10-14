import {NextRequest, NextResponse} from 'next/server';
import {neon} from '@neondatabase/serverless';
import {z} from 'zod';
import {createHash, randomBytes} from 'node:crypto';
import {products} from '@/lib/content';

export const runtime = 'nodejs';
const schema = z.object({
  name:z.string().trim().min(2).max(120), company:z.string().trim().min(2).max(180),
  email:z.email().max(254), country:z.string().trim().min(2).max(100),
  productId:z.string().min(1).max(40), quantity:z.string().max(100).optional().default(''),
  requirements:z.string().trim().min(10).max(5000), consent:z.literal('true'),
  locale:z.enum(['en','ar','ru','es']), sourceUrl:z.url().max(1000),
  referrer:z.string().max(1000).optional().default(''), website:z.string().optional().default('')
});
function safeText(value:string){return value.replace(/[<>]/g,'').replace(/[\r\n]+/g,' ').slice(0,5000);}

export async function POST(request:NextRequest){
  if(!process.env.DATABASE_URL||!process.env.RESEND_API_KEY||!process.env.INQUIRY_FROM_EMAIL||!process.env.INQUIRY_HASH_SECRET){
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
  const product=products.find(item=>item.id===value.productId);
  if(!product)return NextResponse.json({error:'Unknown product.'},{status:400});
  const sql=neon(process.env.DATABASE_URL);
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const ipHash=createHash('sha256').update(ip+process.env.INQUIRY_HASH_SECRET).digest('hex');
  const submittedAt=new Date();
  const id=`TP-${submittedAt.toISOString().slice(0,10).replaceAll('-','')}-${randomBytes(3).toString('hex').toUpperCase()}`;
  const url=new URL(value.sourceUrl);
  const utm={source:url.searchParams.get('utm_source')||'',medium:url.searchParams.get('utm_medium')||'',campaign:url.searchParams.get('utm_campaign')||''};
  try{
    const rows=await sql`SELECT count(*)::int AS count FROM inquiries WHERE ip_hash=${ipHash} AND created_at > now() - interval '10 minutes'`;
    if(Number(rows[0]?.count||0)>=3)return NextResponse.json({error:'Too many submissions. Please try again later.'},{status:429});
    await sql`INSERT INTO inquiries (id,name,company,email,country,product_id,product_slug,quantity,requirements,locale,source_url,referrer,utm_source,utm_medium,utm_campaign,ip_hash,notification_status)
      VALUES (${id},${value.name},${value.company},${value.email},${value.country},${product.id},${product.slug},${value.quantity},${value.requirements},${value.locale},${value.sourceUrl},${value.referrer},${utm.source},${utm.medium},${utm.campaign},${ipHash},'pending')`;
  }catch(error){console.error('Inquiry storage failed',error);return NextResponse.json({error:'Inquiry service is unavailable. Please use email.'},{status:503});}
  const emailBody=[`Inquiry ${id}`,`Submitted: ${submittedAt.toISOString()}`,`Name: ${safeText(value.name)}`,`Company: ${safeText(value.company)}`,`Email: ${safeText(value.email)}`,`Country: ${safeText(value.country)}`,`Product: ${product.id} — ${product.slug}`,`Quantity: ${safeText(value.quantity)}`,`Requirements: ${safeText(value.requirements)}`,`Source: ${safeText(value.sourceUrl)}`,`Locale: ${value.locale}`].join('\n');
  try{
    const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.INQUIRY_FROM_EMAIL,to:[process.env.INQUIRY_NOTIFY_EMAIL||'alex.chen@3primary.com'],subject:`New 3PRIMARY inquiry ${id}`,text:emailBody})});
    if(!result.ok)throw new Error(`Email API status ${result.status}`);
    await sql`UPDATE inquiries SET notification_status='sent', notified_at=now() WHERE id=${id}`;
    return NextResponse.json({id},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch(error){console.error('Inquiry notification failed',error);return NextResponse.json({error:'Inquiry saved, but notification could not be confirmed. Please email us directly.',id},{status:503});}
}
