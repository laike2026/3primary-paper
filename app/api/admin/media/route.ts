import {NextRequest,NextResponse} from 'next/server';
import {put,del} from '@vercel/blob';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {audit,newId} from '@/lib/admin/auth';
import {db,pagination} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';

export const runtime='nodejs';
const MAX_BYTES=4*1024*1024;
const allowed:Record<string,string[]>={'image/jpeg':['jpg','jpeg'],'image/png':['png'],'image/webp':['webp'],'image/svg+xml':['svg'],'application/pdf':['pdf'],'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['docx'],'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['xlsx'],'application/vnd.openxmlformats-officedocument.presentationml.presentation':['pptx']};

export async function GET(request:NextRequest){
  const auth=await guard('media:read');if(auth.response)return auth.response;
  const {page,size,offset}=pagination(request.nextUrl.searchParams);
  const q=(request.nextUrl.searchParams.get('q')||'').slice(0,100),category=(request.nextUrl.searchParams.get('category')||'').slice(0,40);
  const sql=db();
  const [items,total]=await Promise.all([
    sql.query(`SELECT m.id,m.url,m.filename,m.mime_type,m.byte_size,m.width,m.height,m.alt,m.caption,m.category,m.thumbnail_url,m.created_at,
      (SELECT count(*)::int FROM content_products p WHERE p.deleted_at IS NULL AND (p.image=m.url OR p.gallery ? m.url))+(SELECT count(*)::int FROM content_articles a WHERE a.deleted_at IS NULL AND a.image=m.url) AS usage_count
      FROM media_assets m WHERE m.deleted_at IS NULL AND ($1='' OR m.filename ILIKE '%'||$1||'%' OR m.alt->>'en' ILIKE '%'||$1||'%') AND ($2='' OR m.category=$2) ORDER BY m.created_at DESC LIMIT $3 OFFSET $4`,[q,category,size,offset]),
    sql.query("SELECT count(*)::int AS total FROM media_assets WHERE deleted_at IS NULL AND ($1='' OR filename ILIKE '%'||$1||'%' OR alt->>'en' ILIKE '%'||$1||'%') AND ($2='' OR category=$2)",[q,category])
  ]);
  return NextResponse.json({items,total:Number(total[0].total),page,size});
}

export async function POST(request:NextRequest){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('media:write');if(auth.response)return auth.response;
  if(!process.env.BLOB_READ_WRITE_TOKEN)return jsonError('媒体存储未配置',503);
  if(Number(request.headers.get('content-length')||0)>MAX_BYTES+100000)return jsonError('文件超过 4 MB',413);
  const form=await request.formData().catch(()=>null);
  const file=form?.get('file');
  if(!(file instanceof File)||file.size<1||file.size>MAX_BYTES)return jsonError('请选择不超过 4 MB 的文件');
  const ext=file.name.split('.').pop()?.toLowerCase()||'';
  if(!allowed[file.type]?.includes(ext))return jsonError('文件扩展名与 MIME 类型不匹配');
  const id=newId();
  let thumbnailUrl='';
  try{
    const source=Buffer.from(await file.arrayBuffer());
    const hash=createHash('sha256').update(source).digest('hex');
    const duplicate=await db().query('SELECT id,url,filename FROM media_assets WHERE sha256=$1 AND deleted_at IS NULL LIMIT 1',[hash]);
    if(duplicate.length)return NextResponse.json({ok:true,duplicate:true,item:duplicate[0]});
    const count=await db().query("SELECT count(*)::int AS n FROM media_assets WHERE uploaded_by=$1 AND created_at>now()-interval '1 minute'",[auth.user!.id]);
    if(Number(count[0].n)>=10)return jsonError('上传过于频繁，请稍后再试',429);
    const isImage=file.type.startsWith('image/');
    let body=source,mime=file.type,width:number|null=null,height:number|null=null;
    if(isImage){
      if(file.type==='image/svg+xml'&&(!source.toString('utf8').includes('<svg')||/<\s*(script|foreignObject|image|use)|\bon\w+\s*=|(?:xlink:)?href\s*=|<!DOCTYPE|<!ENTITY/i.test(source.toString('utf8'))))return jsonError('SVG 包含不安全内容');
      const metadata=await sharp(source).metadata();
      if(!['jpeg','png','webp','svg'].includes(metadata.format||'')||!metadata.width||!metadata.height||metadata.width>8000||metadata.height>8000)return jsonError('图片格式或尺寸无效');
      const image=await sharp(source).rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer({resolveWithObject:true});
      body=image.data;mime='image/webp';width=image.info.width;height=image.info.height;
      const thumbnail=await sharp(body).resize({width:320,height:320,fit:'inside'}).webp({quality:70}).toBuffer();
      thumbnailUrl=(await put(`media/thumb-${id}.webp`,thumbnail,{access:'public',addRandomSuffix:false,contentType:'image/webp'})).url;
    }else{
      const valid=file.type==='application/pdf'?source.subarray(0,5).equals(Buffer.from('%PDF-')):source.subarray(0,4).equals(Buffer.from([0x50,0x4b,0x03,0x04]));
      if(!valid)return jsonError('文件内容与扩展名不符');
    }
    const pathname=`media/${id}.${isImage?'webp':ext}`;
    const blob=await put(pathname,body,{access:'public',addRandomSuffix:false,contentType:mime});
    const name=file.name.replace(/[\x00-\x1f<>\\/]/g,'').slice(0,180)||'file';
    const alt={en:String(form?.get('altEn')||'').slice(0,300),ar:'',ru:'',es:''};
    const category=String(form?.get('category')||'general').slice(0,40);
    try{await db().query('INSERT INTO media_assets(id,storage_key,url,filename,mime_type,byte_size,width,height,alt,uploaded_by,sha256,category,thumbnail_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13)',[id,pathname,blob.url,name,mime,body.length,width,height,JSON.stringify(alt),auth.user!.id,hash,category,thumbnailUrl]);}
    catch(error){await del([blob.url,...(thumbnailUrl?[thumbnailUrl]:[])]).catch(()=>{});throw error;}
    await audit(auth.user!.id,'upload','media',id,{filename:name,bytes:body.length});
    return NextResponse.json({ok:true,item:{id,url:blob.url,filename:name,width,height,alt,category,thumbnail_url:thumbnailUrl}},{status:201});
  }catch(error){if(thumbnailUrl)await del(thumbnailUrl).catch(()=>{});console.error('Media upload failed',error);return jsonError('上传失败，请稍后重试',500);}
}
