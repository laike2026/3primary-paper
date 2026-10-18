import {NextRequest,NextResponse} from 'next/server';
import {audit,can} from '@/lib/admin/auth';
import {config,cleanLocalized,publishIssue} from '@/lib/admin/content';
import {db} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';

export const runtime='nodejs';
type Ctx={params:Promise<{kind:string;id:string}>};
const jsonFields=new Set(['name','summary','application','title','intro','description','details','features','specifications','gallery','documents','sections','seo']);
function versionType(kind:string){return ({categories:'category',products:'product',articles:'article','news-categories':'news_category'} as Record<string,string>)[kind];}
export async function GET(_request:NextRequest,{params}:Ctx){
  const {kind,id}=await params;const c=config(kind);if(!c)return jsonError('无效模块',404);
  const auth=await guard('content:read');if(auth.response)return auth.response;
  const rows=await db().query(`SELECT * FROM ${c.table} WHERE ${c.id}=$1 LIMIT 1`,[id]);
  if(!rows.length)return jsonError('未找到内容',404);
  return NextResponse.json({item:rows[0]});
}
export async function PATCH(request:NextRequest,{params}:Ctx){
  const {kind,id}=await params;const c=config(kind);if(!c)return jsonError('无效模块',404);
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('content:write');if(auth.response)return auth.response;
  const parsed=c.schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('内容字段无效');
  const data=parsed.data as Record<string,unknown>;
  if(String(data[c.id])!==id)return jsonError('内容编号不能修改。请创建新记录并设置重定向。');
  if(data.status==='published'&&!can(auth.user!.role,'content:publish'))return jsonError('没有发布权限',403);
  for(const field of ['name','summary','application','title','intro','description','details'])if(data[field])data[field]=cleanLocalized(data[field] as Record<string,string>);
  if(data.status==='published'){const issue=await publishIssue(kind,data);if(issue)return jsonError(issue);}
  if(kind==='categories'&&data.parent_slug===id)return jsonError('分类不能指向自己');
  const sql=db();const old=await sql.query(`SELECT * FROM ${c.table} WHERE ${c.id}=$1 AND deleted_at IS NULL LIMIT 1`,[id]);
  if(!old.length)return jsonError('未找到内容',404);
  if(kind==='categories'&&data.parent_slug){
    let cursor=String(data.parent_slug);const seen=new Set([id]);
    for(let depth=0;depth<4;depth++){
      if(seen.has(cursor))return jsonError('分类层级存在循环');seen.add(cursor);
      const parent=await sql.query('SELECT parent_slug FROM content_categories WHERE slug=$1 AND deleted_at IS NULL',[cursor]);
      if(!parent.length)return jsonError('上级分类不存在');
      if(!parent[0].parent_slug)break;
      cursor=String(parent[0].parent_slug);
      if(depth===3)return jsonError('分类最多四级');
    }
  }
  const versionRows=await sql.query('SELECT coalesce(max(version),0)::int+1 AS next FROM content_versions WHERE entity_type=$1 AND entity_id=$2',[versionType(kind),id]);
  const version=Number(versionRows[0].next);
  const keys=Object.keys(data).filter(key=>key!==c.id);
  const sets=keys.map((key,i)=>`${key}=$${i+1}${jsonFields.has(key)?'::jsonb':''}`);
  const values=keys.map(key=>jsonFields.has(key)?JSON.stringify(data[key]):data[key]);
  sets.push('updated_at=now()');
  if(kind==='products'||kind==='articles')sets.push('version=version+1');
  if(data.status==='published'&&old[0].status!=='published'&&(kind==='products'||kind==='articles'))sets.push('published_at=now()');
  try{
    await sql.query('INSERT INTO content_versions(entity_type,entity_id,version,snapshot,actor_id) VALUES($1,$2,$3,$4::jsonb,$5)',[versionType(kind),id,version,JSON.stringify(old[0]),auth.user!.id]);
    await sql.query(`UPDATE ${c.table} SET ${sets.join(',')} WHERE ${c.id}=$${values.length+1}`,[...values,id]);
    if(kind==='products'&&old[0].slug!==data.slug){
      for(const locale of ['en','ar','ru','es'])await sql.query('INSERT INTO url_redirects(source_path,destination_path) VALUES($1,$2) ON CONFLICT(source_path) DO UPDATE SET destination_path=excluded.destination_path',[`/${locale}/product/${old[0].slug}`,`/${locale}/product/${data.slug}`]);
    }
    await audit(auth.user!.id,'update',kind,id,{status:data.status,version});
    return NextResponse.json({ok:true,version});
  }catch(error){console.error('Content update failed',error);return jsonError('保存失败，请检查分类和别名',409);}
}
export async function DELETE(request:NextRequest,{params}:Ctx){
  const {kind,id}=await params;const c=config(kind);if(!c)return jsonError('无效模块',404);
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('content:write');if(auth.response)return auth.response;
  if(kind==='categories'){
    const dependents=await db().query('SELECT (SELECT count(*) FROM content_products WHERE category_slug=$1 AND deleted_at IS NULL)+(SELECT count(*) FROM content_categories WHERE parent_slug=$1 AND deleted_at IS NULL) AS n',[id]);
    if(Number(dependents[0].n)>0)return jsonError('分类下仍有产品或子分类，请先迁移或删除关联内容',409);
  }
  if(kind==='news-categories'){
    const dependents=await db().query('SELECT count(*)::int AS n FROM content_articles WHERE category_slug=$1 AND deleted_at IS NULL',[id]);
    if(Number(dependents[0].n)>0)return jsonError('新闻分类下仍有文章，请先迁移或删除关联内容',409);
  }
  await db().query(`UPDATE ${c.table} SET deleted_at=now(),updated_at=now() WHERE ${c.id}=$1 AND deleted_at IS NULL`,[id]);
  await audit(auth.user!.id,'delete',kind,id);
  return NextResponse.json({ok:true});
}
export async function POST(request:NextRequest,{params}:Ctx){
  const {kind,id}=await params;const c=config(kind);if(!c)return jsonError('无效模块',404);
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('content:write');if(auth.response)return auth.response;
  const body=await request.json().catch(()=>null);if(body?.action!=='restore')return jsonError('无效操作');
  const restoredStatus=kind==='articles'?",status='draft'":'';
  const rows=await db().query(`UPDATE ${c.table} SET deleted_at=NULL${restoredStatus},updated_at=now() WHERE ${c.id}=$1 AND deleted_at IS NOT NULL RETURNING ${c.id}`,[id]);
  if(!rows.length)return jsonError('内容不在回收站',404);
  await audit(auth.user!.id,'restore',kind,id);
  return NextResponse.json({ok:true});
}
