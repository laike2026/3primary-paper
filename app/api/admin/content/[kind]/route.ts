import {NextRequest,NextResponse} from 'next/server';
import {audit,can} from '@/lib/admin/auth';
import {config,cleanLocalized,publishIssue} from '@/lib/admin/content';
import {db,pagination} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';

export const runtime='nodejs';
type Ctx={params:Promise<{kind:string}>};
export async function GET(request:NextRequest,{params}:Ctx){
  const {kind}=await params;const c=config(kind);if(!c)return jsonError('无效模块',404);
  const auth=await guard('content:read');if(auth.response)return auth.response;
  const {page,size,offset}=pagination(request.nextUrl.searchParams);
  const q=(request.nextUrl.searchParams.get('q')||'').trim().slice(0,100);
  const state=request.nextUrl.searchParams.get('status')||'';
  const trash=request.nextUrl.searchParams.get('trash')==='1';
  const filter=`WHERE deleted_at IS ${trash?'NOT ':''}NULL AND ($1='' OR ${c.id} ILIKE '%'||$1||'%' OR ${kind==='articles'?'title': 'name'}->>'en' ILIKE '%'||$1||'%') AND ($2='' OR status=$2)`;
  const sql=db();
  const [items,total]=await Promise.all([
    sql.query(`SELECT * FROM ${c.table} ${filter} ORDER BY updated_at DESC LIMIT $3 OFFSET $4`,[q,state,size,offset]),
    sql.query(`SELECT count(*)::int AS total FROM ${c.table} ${filter}`,[q,state])
  ]);
  return NextResponse.json({items,total:Number(total[0].total),page,size});
}
export async function POST(request:NextRequest,{params}:Ctx){
  const {kind}=await params;const c=config(kind);if(!c)return jsonError('无效模块',404);
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const auth=await guard('content:write');if(auth.response)return auth.response;
  const parsed=c.schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('内容字段无效');
  const data=parsed.data as Record<string,unknown>;
  if(kind==='articles'&&data.status!=='draft')return jsonError('新建新闻须先保存为草稿');
  if(data.status==='published'&&!can(auth.user!.role,'content:publish'))return jsonError('没有发布权限',403);
  for(const field of ['name','summary','application','title','intro','description','details'])if(data[field])data[field]=cleanLocalized(data[field] as Record<string,string>);
  if(data.status==='published'){const issue=await publishIssue(kind,data);if(issue)return jsonError(issue);}
  if(kind==='categories'&&data.parent_slug===data.slug)return jsonError('分类不能指向自己');
  if(kind==='categories'&&data.parent_slug){
    let cursor=String(data.parent_slug);const seen=new Set([String(data.slug)]);
    for(let depth=0;depth<4;depth++){
      if(seen.has(cursor))return jsonError('分类层级存在循环');seen.add(cursor);
      const parent=await db().query('SELECT parent_slug FROM content_categories WHERE slug=$1 AND deleted_at IS NULL',[cursor]);
      if(!parent.length)return jsonError('上级分类不存在');
      if(!parent[0].parent_slug)break;
      cursor=String(parent[0].parent_slug);
      if(depth===3)return jsonError('分类最多四级');
    }
  }
  const fields=Object.keys(data).filter(key=>key!=='scheduled_at'||data[key]);
  const values=fields.map(key=>['name','summary','application','title','intro','description','details','features','specifications','gallery','documents','sections','seo'].includes(key)?JSON.stringify(data[key]):data[key]);
  const paramsSql=fields.map((key,i)=>`$${i+1}${['name','summary','application','title','intro','description','details','features','specifications','gallery','documents','sections','seo'].includes(key)?'::jsonb':''}`).join(',');
  const sql=db();
  try {
    const hasPublishedAt=kind==='products'||kind==='articles';
    await sql.query(`INSERT INTO ${c.table}(${fields.join(',')}${hasPublishedAt?',published_at':''}) VALUES(${paramsSql}${hasPublishedAt?`,${data.status==='published'?'now()':'NULL'}`:''})`,values);
    await audit(auth.user!.id,'create',kind,String(data[c.id]));
    return NextResponse.json({ok:true,id:data[c.id]},{status:201});
  }catch(error){console.error('Content create failed',error);return jsonError('保存失败，编号或别名可能已存在',409);}
}
