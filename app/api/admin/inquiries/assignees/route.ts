import {NextResponse} from 'next/server';
import {db} from '@/lib/admin/db';
import {guard} from '@/lib/admin/http';
export async function GET(){const auth=await guard('inquiries:read');if(auth.response)return auth.response;const items=await db().query("SELECT id,name,email FROM admin_users WHERE active=true AND role IN ('superadmin','admin','sales') ORDER BY name LIMIT 200");return NextResponse.json({items});}
