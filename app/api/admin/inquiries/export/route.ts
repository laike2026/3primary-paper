import {NextRequest,NextResponse} from 'next/server';
import {audit} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {guard} from '@/lib/admin/http';
export const runtime='nodejs';
function csv(value:unknown){const s=String(value??'').replace(/^[=+\-@]/,"'");return `"${s.replace(/"/g,'""')}"`;}
export async function GET(request:NextRequest){
  const auth=await guard('inquiries:export');if(auth.response)return auth.response;
  const from=request.nextUrl.searchParams.get('from')||'1970-01-01';const to=request.nextUrl.searchParams.get('to')||'2100-01-01';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>to)return NextResponse.json({error:'日期范围无效'},{status:400});
  const status=(request.nextUrl.searchParams.get('status')||'').slice(0,30),country=(request.nextUrl.searchParams.get('country')||'').slice(0,100),product=(request.nextUrl.searchParams.get('product')||'').slice(0,50);
  const rows=await db().query(`SELECT id,created_at,form_type,name,company,email,phone,country,product_id,quantity,requirements,locale,source_url,referrer,utm_source,utm_medium,utm_campaign,utm_content,utm_term,status,assigned_to,tags,duplicate_of,notification_status FROM inquiries WHERE deleted_at IS NULL AND created_at >= $1::date AND created_at < ($2::date+interval '1 day') AND ($3='' OR status=$3) AND ($4='' OR country ILIKE '%'||$4||'%') AND ($5='' OR product_id=$5) ORDER BY created_at DESC LIMIT 50000`,[from,to,status,country,product]);
  const keys=['id','created_at','form_type','name','company','email','phone','country','product_id','quantity','requirements','locale','source_url','referrer','utm_source','utm_medium','utm_campaign','utm_content','utm_term','status','assigned_to','tags','duplicate_of','notification_status'];
  const content='\uFEFF'+[keys.join(','),...rows.map(row=>keys.map(key=>csv(row[key])).join(','))].join('\r\n');
  await audit(auth.user!.id,'export','inquiries','',{count:rows.length,from,to,status,country,product});
  return new NextResponse(content,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="3primary-inquiries.csv"','Cache-Control':'no-store'}});
}
