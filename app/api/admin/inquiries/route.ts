import {NextRequest,NextResponse} from 'next/server';
import {db,pagination} from '@/lib/admin/db';
import {guard,jsonError} from '@/lib/admin/http';
import {inquiryFilter} from '@/lib/admin/inquiry-filter';
export const runtime='nodejs';
export async function GET(request:NextRequest){
  const auth=await guard('inquiries:read');if(auth.response)return auth.response;
  const {page,size,offset}=pagination(request.nextUrl.searchParams);
  const filter=inquiryFilter(request.nextUrl.searchParams);
  if(filter.error)return jsonError(filter.error);
  const {args,where,sort}=filter;
  const sql=db();
  const [items,count]=await Promise.all([
    sql.query(`SELECT id,created_at,name,company,email,phone,country,product_id,form_type,locale,status,assigned_to,
      notification_status,notification_attempts,notified_at,utm_source,duplicate_of FROM inquiries ${where}
      ORDER BY created_at ${sort},id ${sort} LIMIT $10 OFFSET $11`,[...args,size,offset]),
    sql.query(`SELECT count(*)::int AS total FROM inquiries ${where}`,[...args]),
  ]);
  return NextResponse.json({items,total:Number(count[0].total),page,size});
}
