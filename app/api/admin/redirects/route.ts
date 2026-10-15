import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';
export const runtime='nodejs';
const path=z.string().startsWith('/').max(500).refine(x=>!x.startsWith('//')&&!x.includes('://')&&!x.includes('\\'));
const schema=z.object({sourcePath:path,destinationPath:path,statusCode:z.union([z.literal(301),z.literal(308)])});
export async function GET(){const auth=await guard('seo:read');if(auth.response)return auth.response;const items=await db().query('SELECT * FROM url_redirects ORDER BY created_at DESC LIMIT 500');return NextResponse.json({items});}
export async function POST(request:NextRequest){if(!sameOrigin(request))return jsonError('请求来源无效',403);const auth=await guard('seo:write');if(auth.response)return auth.response;const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('重定向路径无效');const v=parsed.data;if(v.sourcePath===v.destinationPath)return jsonError('来源和目标不能相同');await db().query('INSERT INTO url_redirects(source_path,destination_path,status_code) VALUES($1,$2,$3) ON CONFLICT(source_path) DO UPDATE SET destination_path=excluded.destination_path,status_code=excluded.status_code',[v.sourcePath,v.destinationPath,v.statusCode]);await audit(auth.user!.id,'upsert','url_redirect',v.sourcePath,{to:v.destinationPath});return NextResponse.json({ok:true});}
export async function DELETE(request:NextRequest){if(!sameOrigin(request))return jsonError('请求来源无效',403);const auth=await guard('seo:write');if(auth.response)return auth.response;const source=request.nextUrl.searchParams.get('source')||'';if(!path.safeParse(source).success)return jsonError('路径无效');await db().query('DELETE FROM url_redirects WHERE source_path=$1',[source]);await audit(auth.user!.id,'delete','url_redirect',source);return NextResponse.json({ok:true});}
