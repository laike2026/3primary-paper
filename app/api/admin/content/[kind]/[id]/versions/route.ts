import {NextRequest,NextResponse} from 'next/server';
import {config} from '@/lib/admin/content';
import {db} from '@/lib/admin/db';
import {guard,jsonError} from '@/lib/admin/http';
type Ctx={params:Promise<{kind:string;id:string}>};
const versionType:Record<string,string>={categories:'category',products:'product',articles:'article','news-categories':'news_category'};
export async function GET(_request:NextRequest,{params}:Ctx){const {kind,id}=await params;if(!config(kind))return jsonError('无效模块',404);const auth=await guard('content:read');if(auth.response)return auth.response;const items=await db().query('SELECT v.id,v.version,v.snapshot,v.created_at,u.name AS actor FROM content_versions v LEFT JOIN admin_users u ON u.id=v.actor_id WHERE v.entity_type=$1 AND v.entity_id=$2 ORDER BY v.version DESC LIMIT 30',[versionType[kind],id]);return NextResponse.json({items});}
