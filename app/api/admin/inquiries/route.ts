import {NextRequest,NextResponse} from 'next/server';
import {db,pagination} from '@/lib/admin/db';
import {guard,jsonError} from '@/lib/admin/http';
export const runtime='nodejs';
export async function GET(request:NextRequest){
  const auth=await guard('inquiries:read');if(auth.response)return auth.response;
  const {page,size,offset}=pagination(request.nextUrl.searchParams);
  const q=(request.nextUrl.searchParams.get('q')||'').trim().slice(0,120);
  const status=(request.nextUrl.searchParams.get('status')||'').trim().slice(0,30);
  const country=(request.nextUrl.searchParams.get('country')||'').trim().slice(0,100);
  const product=(request.nextUrl.searchParams.get('product')||'').trim().slice(0,50);
  const source=(request.nextUrl.searchParams.get('source')||'').trim().slice(0,100);
  const assignee=request.nextUrl.searchParams.get('assignee')||'';
  const from=request.nextUrl.searchParams.get('from')||'';
  const to=request.nextUrl.searchParams.get('to')||'';
  if(assignee&&!/^[a-f0-9-]{36}$/i.test(assignee))return jsonError('负责人编号无效');
  if((from&&!/^\d{4}-\d{2}-\d{2}$/.test(from))||(to&&!/^\d{4}-\d{2}-\d{2}$/.test(to))||(from&&to&&from>to))return jsonError('日期范围无效');
  const sort=request.nextUrl.searchParams.get('sort')==='oldest'?'ASC':'DESC';
  const args=[q,status,country,product,source,assignee||null,from||null,to||null];
  const sql=db();const where=`WHERE deleted_at IS NULL AND ($1='' OR id ILIKE '%'||$1||'%' OR name ILIKE '%'||$1||'%' OR company ILIKE '%'||$1||'%' OR email ILIKE '%'||$1||'%' OR phone ILIKE '%'||$1||'%') AND ($2='' OR status=$2) AND ($3='' OR country ILIKE '%'||$3||'%') AND ($4='' OR product_id=$4) AND ($5='' OR utm_source ILIKE '%'||$5||'%') AND ($6::uuid IS NULL OR assigned_to=$6::uuid) AND ($7::date IS NULL OR created_at>=$7::date) AND ($8::date IS NULL OR created_at<($8::date+interval '1 day'))`;
  const [items,count]=await Promise.all([sql.query(`SELECT id,created_at,name,company,email,phone,country,product_id,form_type,locale,status,assigned_to,notification_status,utm_source,duplicate_of FROM inquiries ${where} ORDER BY created_at ${sort} LIMIT $9 OFFSET $10`,[...args,size,offset]),sql.query(`SELECT count(*)::int AS total FROM inquiries ${where}`,args)]);
  return NextResponse.json({items,total:Number(count[0].total),page,size});
}
