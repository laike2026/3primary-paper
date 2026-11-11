import createMiddleware from 'next-intl/middleware';
import {NextRequest,NextResponse} from 'next/server';
import {neon} from '@neondatabase/serverless';
import {routing} from './i18n/routing';

const localeMiddleware=createMiddleware(routing);
type Redirect = {destination_path: string; status_code: number};
let snapshot = new Map<string, Redirect>();
let refreshAt = 0;
let refresh: Promise<void> | undefined;

function businessHeaders(response:NextResponse){
  for(const key of [...response.headers.keys()])if(/^x-vercel-/i.test(key)||/^(server|x-powered-by)$/i.test(key))response.headers.delete(key);
  return response;
}

async function redirects(connection: string) {
  if (Date.now() >= refreshAt && !refresh) {
    refresh = neon(connection, {fetchOptions: {signal: AbortSignal.timeout(1800)}})
      .query('SELECT source_path,destination_path,status_code FROM url_redirects')
      .then((rows) => {
        snapshot = new Map(rows.map((row) => [String(row.source_path), {
          destination_path: String(row.destination_path), status_code: Number(row.status_code),
        }]));
        refreshAt = Date.now() + 15_000;
      })
      .catch(() => {
        refreshAt = Date.now() + 5_000;
        console.error('Redirect lookup failed');
      })
      .finally(() => {refresh = undefined;});
  }
  await refresh;
  return snapshot;
}

export default async function proxy(request:NextRequest){
  const path=request.nextUrl.pathname;
  if(!/^\/(?:en|ar|ru|es)(?:\/|$)/.test(path)&&path!=='/')return businessHeaders(NextResponse.next());
  const connection = process.env.DATABASE_URL;
  if (connection && /^\/(?:en|ar|ru|es)(?:\/|$)/.test(path)) {
    const rules = await redirects(connection);
    const first = rules.get(path);
    if (first) {
      const seen = new Set([path]);
      let destination = first.destination_path;
      while (rules.has(destination) && !seen.has(destination)) {
        seen.add(destination);
        destination = rules.get(destination)!.destination_path;
      }
      if (!seen.has(destination) && destination.startsWith('/') && !destination.startsWith('//') && !/[\s\\]/.test(destination)) {
        const target = new URL(destination, request.url);
        if (target.origin === request.nextUrl.origin && target.pathname !== path) {
          return businessHeaders(NextResponse.redirect(target, first.status_code === 308 ? 308 : 301));
        }
      }
    }
  }
  return businessHeaders(localeMiddleware(request));
}
export const config = {matcher: ['/:path*']};
