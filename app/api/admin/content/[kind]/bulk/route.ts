import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {audit,can} from '@/lib/admin/auth';
import {config,publishIssue} from '@/lib/admin/content';
import {db} from '@/lib/admin/db';
import {guard,jsonError,sameOrigin} from '@/lib/admin/http';
export const runtime='nodejs';
type Ctx={params:Promise<{kind:string}>};
const schema=z.object({ids:z.array(z.string().min(1).max(120)).min(1).max(50),action:z.enum(['publish','archive','draft','unlist','delete','restore'])});
export async function POST(request:NextRequest,{params}:Ctx){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const {kind}=await params;const c=config(kind);if(!c)return jsonError('无效模块',404);
  const auth=await guard('content:write');if(auth.response)return auth.response;
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('批量操作无效，最多 50 条');
  const {action,ids}=parsed.data;
  if(kind==='articles'&&action==='publish')return jsonError('新闻请在编辑器中逐篇发布',403);
  if(action==='publish'&&!can(auth.user!.role,'content:publish'))return jsonError('没有发布权限',403);
  if(action==='unlist'&&!['products','articles'].includes(kind))return jsonError('此模块不支持下架');
  const results:{id:string;ok:boolean;error?:string}[]=[];
  for(const id of new Set(ids)){
    try{
      const sql=db();
      if(action==='publish'){
        const current=await sql.query(`SELECT * FROM ${c.table} WHERE ${c.id}=$1 AND deleted_at IS NULL`,[id]);
        if(!current.length)throw Error('内容不存在');
        const issue=await publishIssue(kind,current[0]);if(issue)throw Error(issue);
      }
      if(action==='delete'&&kind==='categories'){const n=await sql.query('SELECT (SELECT count(*) FROM content_products WHERE category_slug=$1 AND deleted_at IS NULL)+(SELECT count(*) FROM content_categories WHERE parent_slug=$1 AND deleted_at IS NULL) AS n',[id]);if(Number(n[0].n)>0)throw Error('仍有产品或子分类');}
      if(action==='delete'&&kind==='news-categories'){const n=await sql.query('SELECT count(*)::int AS n FROM content_articles WHERE category_slug=$1 AND deleted_at IS NULL',[id]);if(Number(n[0].n)>0)throw Error('仍有文章');}
      const update=action==='delete'?'deleted_at=now()':action==='restore'?kind==='articles'?"deleted_at=NULL,status='draft'":'deleted_at=NULL':`status='${action==='publish'?'published':action==='archive'?'archived':action==='unlist'?'unlisted':'draft'}'`;
      const publishedAt=action==='publish'&&['products','articles'].includes(kind)?',published_at=coalesce(published_at,now())':'';
      const rows=await sql.query(`UPDATE ${c.table} SET ${update}${publishedAt},updated_at=now() WHERE ${c.id}=$1 ${action==='restore'?'AND deleted_at IS NOT NULL':'AND deleted_at IS NULL'} RETURNING ${c.id}`,[id]);
      if(!rows.length)throw Error('内容不存在或状态未变化');
      results.push({id,ok:true});
    }catch(error){results.push({id,ok:false,error:error instanceof Error?error.message:'操作失败'});}
  }
  await audit(auth.user!.id,'bulk_'+action,kind,'',{success:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length});
  return NextResponse.json({results});
}
