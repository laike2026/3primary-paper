import {NextRequest,NextResponse} from 'next/server';
import {stringify} from 'csv-stringify/sync';
import {audit} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {guard,jsonError} from '@/lib/admin/http';
import {inquiryFilter,safeCsvCell} from '@/lib/admin/inquiry-filter';
export const runtime='nodejs';
export async function GET(request:NextRequest){
  const auth=await guard('inquiries:export');if(auth.response)return auth.response;
  const filter=inquiryFilter(request.nextUrl.searchParams);
  if(filter.error)return jsonError(filter.error);
  const rows=await db().query(`SELECT id,created_at,form_type,name,company,email,phone,country,product_id,quantity,requirements,locale,source_url,referrer,utm_source,utm_medium,utm_campaign,utm_content,utm_term,status,assigned_to,tags,duplicate_of,notification_status
    FROM inquiries ${filter.where} ORDER BY created_at ${filter.sort},id ${filter.sort} LIMIT 50000`,[...filter.args]);
  const keys=['id','created_at','form_type','name','company','email','phone','country','product_id','quantity','requirements','locale','source_url','referrer','utm_source','utm_medium','utm_campaign','utm_content','utm_term','status','assigned_to','tags','duplicate_of','notification_status'];
  const content=stringify(rows.map(row=>keys.map(key=>safeCsvCell(row[key]))),
    {bom:true,header:true,columns:keys,record_delimiter:'windows'});
  await audit(auth.user!.id,'export','inquiries','',{count:rows.length,...filter.audit});
  return new NextResponse(content,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="3primary-inquiries.csv"','Cache-Control':'no-store'}});
}
