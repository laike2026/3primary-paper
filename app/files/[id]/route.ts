import {NextRequest,NextResponse} from 'next/server';
import {db} from '@/lib/admin/db';
import {isStorageUrl} from '@/lib/business-assets.mjs';

export const runtime='nodejs';
const MAX_BYTES=4*1024*1024;
type Context={params:Promise<{id:string}>};
export async function GET(request:NextRequest,{params}:Context){
  const {id}=await params;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||!process.env.DATABASE_URL)return new NextResponse(null,{status:404});
  const rows=await db().query('SELECT url,storage_url,thumbnail_url,thumbnail_storage_url,mime_type,filename FROM media_assets WHERE id=$1 AND deleted_at IS NULL LIMIT 1',[id]);
  if(!rows.length)return new NextResponse(null,{status:404});
  const row=rows[0],thumbnail=request.nextUrl.searchParams.get('variant')==='thumbnail';
  const source=thumbnail?(row.thumbnail_storage_url||row.thumbnail_url):(row.storage_url||row.url);
  if(!isStorageUrl(source))return new NextResponse(null,{status:404});
  try{
    const response=await fetch(source,{redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});
    if(!response.ok||Number(response.headers.get('content-length')||0)>MAX_BYTES||!response.body)return new NextResponse(null,{status:404});
    const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();return new NextResponse(null,{status:413});}chunks.push(value);}
    const bytes=Buffer.concat(chunks),mime=thumbnail?'image/webp':String(row.mime_type);
    const inline=/^(?:image\/(?:webp|png|jpeg|svg\+xml)|application\/pdf)$/.test(mime);
    const filename=String(row.filename).replace(/[\r\n"\\]/g,'_');
    return new NextResponse(bytes,{headers:{'Content-Type':mime,'Content-Length':String(size),
      'Content-Disposition':(inline?'inline':'attachment')+"; filename*=UTF-8''"+encodeURIComponent(filename),
      'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff',
      ...(mime==='image/svg+xml'?{'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; sandbox"}:{})}});
  }catch{return new NextResponse(null,{status:502});}
}
export const HEAD=GET;
