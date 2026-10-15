import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';
import {publicContact} from '@/lib/admin/settings';

export const runtime='nodejs';
const schema=z.object({whatsapp:z.url().startsWith('https://wa.me/'),phone:z.string().max(40),address:z.string().max(400),mapUrl:z.union([z.url().startsWith('https://'),z.literal('')])});
export async function GET(){const auth=await guard('settings:read');if(auth.response)return auth.response;return NextResponse.json({contact:await publicContact(),indexingEnabled:process.env.INDEXING_ENABLED==='true',emailConfigured:Boolean(process.env.RESEND_API_KEY&&process.env.INQUIRY_FROM_EMAIL),gscConfigured:Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),blobConfigured:Boolean(process.env.BLOB_READ_WRITE_TOKEN)});}
export async function PATCH(request:NextRequest){if(!sameOrigin(request))return jsonError('请求来源无效',403);const auth=await guard('settings:write');if(auth.response)return auth.response;const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('联系信息或地图地址格式无效');const value=parsed.data;if(Boolean(value.address)!==Boolean(value.mapUrl))return jsonError('详细地址和地图链接必须同时填写');await db().query("INSERT INTO site_settings(key,value,updated_by) VALUES('public_contact',$1::jsonb,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=now()",[JSON.stringify(value),auth.user!.id]);await audit(auth.user!.id,'update','site_settings','public_contact');return NextResponse.json({ok:true});}
