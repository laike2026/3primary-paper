import 'server-only';
import {publicCache} from './public-cache';
import {z} from 'zod';
import {db} from './db';
import {isContentPreview} from './content-preview';
import seed from '@/data/website-content.json';
import type {WebsiteContent,WebsiteKind} from '@/lib/website-types';

const localized=z.object({en:z.string().max(50000),ar:z.string().max(50000),ru:z.string().max(50000),es:z.string().max(50000)});
const asset=z.string().max(1000).refine(v=>!v||(/^\/(?!\/)/.test(v)&&!/[\\\x00-\x20]/.test(v))||(/^https:\/\//.test(v)&&!/[\x00-\x20]/.test(v)),'请输入站内路径或 HTTPS 地址');
export const websiteSchema=z.object({slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),kind:z.enum(['about','factory','faq','download','review']),name:localized,summary:localized,body:localized,image:asset,file_url:asset,topic:z.string().max(100),product_ids:z.array(z.string().max(50)).max(100),source:z.string().max(2000),notes:z.string().max(10000),status:z.enum(['draft','published','archived']),sort_order:z.number().int().min(-10000).max(10000)}).superRefine((v,ctx)=>{
  if(v.status==='published'){
    if(v.kind==='review')ctx.addIssue({code:'custom',message:'待核资料只能保留草稿或归档'});
    for(const lang of ['en','ar','ru','es'] as const){
      if(!v.name[lang].trim())ctx.addIssue({code:'custom',message:'发布需要填写四种语言的标题'});
      if(['about','faq'].includes(v.kind)&&!v.body[lang].trim())ctx.addIssue({code:'custom',message:'发布需要填写四种语言的正文'});
    }
    if(v.kind==='factory'&&!v.image)ctx.addIssue({code:'custom',message:'请添加公司展示图片'});
    if(v.kind==='download'&&(!v.file_url||!v.image))ctx.addIssue({code:'custom',message:'请添加下载文件和封面'});
  }
});
export const publishedWebsite=publicCache('website','list',async(kind?:WebsiteKind):Promise<WebsiteContent[]>=>{
  if(!process.env.DATABASE_URL||isContentPreview)return (seed as WebsiteContent[]).filter(r=>!kind||r.kind===kind);
  return await db().query(`SELECT slug,kind,name,summary,body,image,file_url,topic,product_ids,status,sort_order,updated_at FROM website_content WHERE status='published' AND deleted_at IS NULL AND ($1='' OR kind=$1) ORDER BY sort_order,slug`,[kind||'']) as WebsiteContent[];
});
