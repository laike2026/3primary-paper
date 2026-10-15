import createMiddleware from 'next-intl/middleware';
import {NextRequest,NextResponse} from 'next/server';
import {neon} from '@neondatabase/serverless';
import {routing} from './i18n/routing';

const localeMiddleware=createMiddleware(routing);
export default async function proxy(request:NextRequest){
  const path=request.nextUrl.pathname;
  if(process.env.DATABASE_URL&&/^\/(en|ar|ru|es)\/(product|products|blog)\//.test(path)){
    try{
      const rows=await neon(process.env.DATABASE_URL).query('SELECT destination_path,status_code FROM url_redirects WHERE source_path=$1 LIMIT 1',[path]);
      if(rows.length&&rows[0].destination_path!==path)return NextResponse.redirect(new URL(String(rows[0].destination_path),request.url),Number(rows[0].status_code));
    }catch(error){console.error('Redirect lookup failed',error);}
  }
  return localeMiddleware(request);
}
export const config = {matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)']};
