import {NextRequest,NextResponse} from 'next/server';
import {stringify} from 'csv-stringify/sync';
import {db,pagination} from '@/lib/admin/db';
import {guard} from '@/lib/admin/http';
export const runtime='nodejs';
export async function GET(request:NextRequest){
  const auth=await guard('audit:read');if(auth.response)return auth.response;
  const {page,size,offset}=pagination(request.nextUrl.searchParams),params=request.nextUrl.searchParams;
  const q=(params.get('q')||'').trim().slice(0,100),action=(params.get('action')||'').trim().slice(0,60),entity=(params.get('entity')||'').trim().slice(0,60);
  const where="WHERE ($1='' OR u.name ILIKE '%'||$1||'%' OR u.email ILIKE '%'||$1||'%' OR a.entity_id ILIKE '%'||$1||'%') AND ($2='' OR a.action=$2) AND ($3='' OR a.entity_type=$3)";
  const columns='a.id,a.action,a.entity_type,a.entity_id,a.details,a.created_at,u.name AS actor,u.email AS actor_email';
  const sql=db(),args=[q,action,entity];
  if(params.get('format')==='csv'){
    const rows=await sql.query(`SELECT ${columns} FROM admin_audit_log a LEFT JOIN admin_users u ON u.id=a.actor_id ${where} ORDER BY a.created_at DESC LIMIT 10000`,args);
    return new NextResponse('\ufeff'+stringify(rows.map(row=>({...row,details:JSON.stringify(row.details)})),{header:true,columns:['id','created_at','actor','actor_email','action','entity_type','entity_id','details']}),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="admin-audit.csv"'}});
  }
  const [items,count]=await Promise.all([sql.query(`SELECT ${columns} FROM admin_audit_log a LEFT JOIN admin_users u ON u.id=a.actor_id ${where} ORDER BY a.created_at DESC LIMIT $4 OFFSET $5`,[...args,size,offset]),sql.query(`SELECT count(*)::int AS total FROM admin_audit_log a LEFT JOIN admin_users u ON u.id=a.actor_id ${where}`,args)]);
  return NextResponse.json({items,total:Number(count[0].total),page,size});
}
