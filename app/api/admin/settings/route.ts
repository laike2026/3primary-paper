import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/admin/db';
import {guard, jsonError, sameOrigin} from '@/lib/admin/http';
import {publicContact} from '@/lib/admin/settings';
import {refreshPublicData} from '@/lib/admin/public-cache';
import {telephoneHref} from '@/lib/contact';
import {isMailConfigured} from '@/lib/admin/mail';
import {isSearchConsoleConfigured} from '@/lib/admin/search-console';
import {isIndexingEnabled} from '@/lib/site';

export const runtime = 'nodejs';
const schema = z.object({
  whatsapp: z.url().max(300).regex(/^https:\/\/wa\.me\/[1-9]\d{6,14}\/?(?:\?text=[^#]*)?$/),
  phone: z.string().trim().max(40).refine(value => !value || Boolean(telephoneHref(value))),
  address: z.string().trim().max(400),
  mapUrl: z.union([z.url().startsWith('https://'), z.literal('')]),
});

export async function GET() {
  const auth = await guard('settings:read');
  if (auth.response) return auth.response;
  return NextResponse.json({
    contact: await publicContact(),
    indexingEnabled: isIndexingEnabled,
    emailConfigured: isMailConfigured(),
    gscConfigured: isSearchConsoleConfigured(),
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return jsonError('请求来源无效', 403);
  const auth = await guard('settings:write');
  if (auth.response) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('联系信息或地图地址格式无效');
  const value = parsed.data;
  if (Boolean(value.address) !== Boolean(value.mapUrl)) return jsonError('详细地址和地图链接必须同时填写');
  const sql = db();
  await sql.transaction([
    sql.query(`INSERT INTO site_settings(key,value,updated_by) VALUES('public_contact',$1::jsonb,$2)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=now()`,
    [JSON.stringify(value), auth.user!.id]),
    sql.query(`INSERT INTO admin_audit_log(actor_id,action,entity_type,entity_id)
      VALUES($1,'update','site_settings','public_contact')`,[auth.user!.id]),
  ]);
  refreshPublicData('contact');
  return NextResponse.json({ok: true});
}
