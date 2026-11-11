import {NextRequest,NextResponse} from 'next/server';
import {audit,can} from '@/lib/admin/auth';
import {db} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';
import {websiteSchema} from '@/lib/admin/website';
import {refreshPublicData} from '@/lib/admin/public-cache';
import {businessAssetReferences} from '@/lib/admin/assets';
import {cleanBusinessMetadata} from '@/lib/business-assets.mjs';

export const runtime='nodejs';
export async function GET(){
  const auth=await guard('content:read');if(auth.response)return auth.response;
  const items=await db().query('SELECT * FROM website_content WHERE deleted_at IS NULL ORDER BY kind,sort_order,slug');
  return NextResponse.json({items:await businessAssetReferences(items)});
}
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('content:write');if(auth.response)return auth.response;
  const parsed=websiteSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return jsonError(parsed.error.issues[0]?.message||'内容字段无效');
  const data=await businessAssetReferences(parsed.data);
  data.source=cleanBusinessMetadata(data.source);data.notes=cleanBusinessMetadata(data.notes);
  if(data.status==='published'&&!can(auth.user!.role,'content:publish'))return jsonError('没有发布权限',403);
  const current=await db().query('SELECT kind FROM website_content WHERE slug=$1',[data.slug]);
  if(current.length&&current[0].kind!==data.kind)return jsonError('内容类型不能修改，请创建新记录');
  const fields=Object.keys(data);const json=new Set(['name','summary','body','product_ids']);
  const values=fields.map(k=>json.has(k)?JSON.stringify(data[k as keyof typeof data]):data[k as keyof typeof data]);
  const sql=db();
  try{
    await sql.transaction([
      sql.query('INSERT INTO website_content_versions(slug,snapshot,actor_id) SELECT slug,to_jsonb(w),$2 FROM website_content w WHERE slug=$1',[data.slug,auth.user!.id]),
      sql.query(`INSERT INTO website_content(${fields.join(',')}) VALUES(${fields.map((k,i)=>`$${i+1}${json.has(k)?'::jsonb':''}`).join(',')}) ON CONFLICT(slug) DO UPDATE SET ${fields.filter(k=>k!=='slug').map(k=>`${k}=excluded.${k}`).join(',')},updated_at=now(),deleted_at=NULL`,values)
    ]);
    refreshPublicData('website');
    await audit(auth.user!.id,'save','website_content',data.slug,{kind:data.kind,status:data.status});
    return NextResponse.json({ok:true});
  }catch(error){console.error('Website content save failed',error);return jsonError('保存失败，请稍后重试',500);}
}
