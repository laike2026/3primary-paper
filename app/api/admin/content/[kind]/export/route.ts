import {NextRequest,NextResponse} from 'next/server';
import {config} from '@/lib/admin/content';
import {db} from '@/lib/admin/db';
import {contentCsv} from '@/lib/admin/bulk';
import {guard,jsonError} from '@/lib/admin/http';
export const runtime='nodejs';
type Ctx={params:Promise<{kind:string}>};
export async function GET(request:NextRequest,{params}:Ctx){const {kind}=await params;const c=config(kind);if(!c)return jsonError('无效模块',404);const auth=await guard('content:read');if(auth.response)return auth.response;const format=request.nextUrl.searchParams.get('format')==='csv'?'csv':'json';const template=request.nextUrl.searchParams.get('template')==='1';const items=template?[]:await db().query(`SELECT * FROM ${c.table} WHERE deleted_at IS NULL ORDER BY ${c.id} LIMIT 5000`);const body=format==='csv'?contentCsv(kind as 'categories'|'products'|'articles'|'news-categories',items):JSON.stringify({kind,exportedAt:new Date().toISOString(),items},null,2);return new NextResponse(body,{headers:{'content-type':format==='csv'?'text/csv; charset=utf-8':'application/json; charset=utf-8','content-disposition':`attachment; filename="3primary-${kind}-${new Date().toISOString().slice(0,10)}.${format}"`,'cache-control':'private, no-store'}});}
