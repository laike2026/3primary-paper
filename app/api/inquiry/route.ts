import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {createHash, randomBytes} from 'node:crypto';
import {publishedProducts} from '@/lib/admin/content';
import {db} from '@/lib/admin/db';
import {PRODUCT_SELECTION_HELP} from '@/lib/inquiry';
import {site} from '@/lib/site';
import {campaignValue, referralOrigin} from '@/lib/attribution';

export const runtime = 'nodejs';

const bodyLimit = 32_768;
const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(180),
  phone: z.string().trim().max(50).optional().default(''),
  email: z.email().max(254),
  country: z.string().trim().min(2).max(100),
  productId: z.string().min(1).max(50),
  quantity: z.string().trim().max(100).optional().default(''),
  requirements: z.string().trim().min(10).max(5000),
  consent: z.literal('true'),
  locale: z.enum(['en', 'ar', 'ru', 'es']),
  sourceUrl: z.url().max(1000),
  referrer: z.string().max(1000).optional().default(''),
  website: z.string().optional().default(''),
  clientRequestId: z.uuid().optional(),
  analyticsSessionId: z.uuid().optional(),
  formId: z.enum(['product', 'general']).optional(),
});

class BodyTooLarge extends Error {}

async function readBody(request: NextRequest) {
  if (Number(request.headers.get('content-length') || 0) > bodyLimit) throw new BodyTooLarge();
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > bodyLimit) {
        await reader.cancel();
        throw new BodyTooLarge();
      }
      text += decoder.decode(chunk.value, {stream: true});
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } finally {
    reader.releaseLock();
  }
}

function acknowledgment(row: {id: string; notification_status: string}, status: 200 | 201) {
  return NextResponse.json(
    {id: row.id, notificationPending: row.notification_status !== 'sent'},
    {status, headers: {'Cache-Control': 'no-store'}},
  );
}

export async function POST(request: NextRequest) {
  const hashSecret = process.env.INQUIRY_HASH_SECRET;
  if (!process.env.DATABASE_URL || !hashSecret) {
    return NextResponse.json({error: 'Online inquiry is not configured. Please email ' + site.email + '.'}, {status: 503});
  }
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({error: 'Invalid origin'}, {status: 403});
  }

  let input: unknown;
  try {
    input = await readBody(request);
  } catch (error) {
    if (error instanceof BodyTooLarge) return NextResponse.json({error: 'Request too large'}, {status: 413});
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400});
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return NextResponse.json({error: 'Please check the required fields.'}, {status: 400});
  const value = parsed.data;
  if (value.website) return NextResponse.json({error: 'Submission rejected.'}, {status: 400});

  const sql = db();
  const lookup = async () => {
    if (!value.clientRequestId) return null;
    const rows = await sql.query('SELECT id,notification_status FROM inquiries WHERE client_request_id=$1 LIMIT 1', [
      value.clientRequestId,
    ]);
    return rows[0] as {id: string; notification_status: string} | undefined;
  };

  try {
    const existing = await lookup();
    if (existing) return acknowledgment(existing, 200);

    const needsHelp = value.productId === PRODUCT_SELECTION_HELP && value.formId !== 'product';
    const product = needsHelp ? null : (await publishedProducts()).find(item => item.id === value.productId);
    if (!needsHelp && !product) return NextResponse.json({error: 'Unknown product.'}, {status: 400});

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const ipHash = createHash('sha256').update(ip + hashSecret).digest('hex');
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const id = 'TP-' + date + '-' + randomBytes(4).toString('hex').toUpperCase();
    const submitted = new URL(value.sourceUrl);
    const page = new URL('/' + value.locale, request.nextUrl.origin);
    if (submitted.origin === page.origin && submitted.pathname.startsWith('/' + value.locale + '/')) {
      page.pathname = submitted.pathname;
    }
    const attributionAllowed = request.cookies.get('analytics_consent')?.value === 'yes';
    const campaigns = campaignKeys.map(key => attributionAllowed ? campaignValue(submitted.searchParams.get(key)) : '');
    const [utmSource, utmMedium, utmCampaign, utmContent, utmTerm] = campaigns;
    const ua = attributionAllowed ? (request.headers.get('user-agent') || '').slice(0, 300) : '';
    const device = ua ? (/Tablet|iPad/i.test(ua) ? 'tablet' : /Mobi|Android/i.test(ua) ? 'mobile' : 'desktop') : '';
    const productId = product?.id || '';
    const formType = value.formId || 'general';

    const [, inserted] = await sql.transaction([
      sql.query('SELECT pg_advisory_xact_lock(hashtext($1))', [ipHash]),
      sql.query(
        `INSERT INTO inquiries (id,name,company,email,country,product_id,product_slug,quantity,requirements,locale,source_url,referrer,
          utm_source,utm_medium,utm_campaign,utm_content,utm_term,ip_hash,notification_status,client_request_id,notification_next_at,
          form_type,phone,user_agent,device_type,consent_at,duplicate_of)
        SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'pending',$19,now(),$20,$21,$22,$23,now(),
          (SELECT id FROM inquiries WHERE lower(email)=lower($4) AND created_at>now()-interval '30 days'
            AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1)
        WHERE (SELECT count(*) FROM inquiries WHERE ip_hash=$18 AND created_at>now()-interval '10 minutes') < 3
        ON CONFLICT (client_request_id) DO NOTHING RETURNING id,notification_status`,
        [id, value.name, value.company, value.email, value.country, productId, product?.slug || '',
          value.quantity, value.requirements, value.locale, page.href, attributionAllowed ? referralOrigin(value.referrer) : '',
          utmSource, utmMedium, utmCampaign, utmContent, utmTerm, ipHash, value.clientRequestId || null,
          formType, value.phone, ua, device],
      ),
    ]);
    if (!inserted.length) {
      const replay = await lookup();
      if (replay) return acknowledgment(replay, 200);
      return NextResponse.json({error: 'Too many submissions. Please try again later.'}, {status: 429});
    }

    if (attributionAllowed && value.analyticsSessionId) {
      await sql.query(
        "INSERT INTO analytics_events(event_id,event_type,session_id,visitor_id,page_path,placement,locale,product_id,form_id,metadata) " +
          "VALUES(gen_random_uuid(),'form_submit_success',$1,$2,$3,'form',$4,$5,$6,$7::jsonb)",
        [value.analyticsSessionId, request.cookies.get('primary_visitor')?.value || '', page.pathname,
          value.locale, productId, formType, JSON.stringify({inquiryId: id})],
      ).catch(() => console.error('Inquiry analytics write failed'));
    }
    return acknowledgment({id, notification_status: 'pending'}, 201);
  } catch (error) {
    console.error('Inquiry storage failed', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({error: 'Inquiry service is unavailable. Please use email.'}, {status: 503});
  }
}
