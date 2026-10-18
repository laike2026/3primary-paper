import 'server-only';
import {z} from 'zod';
import {db} from './db';
import {articles as initialArticles, type Article} from '@/lib/articles';
import {categories as initialCategories, productRecords as initialProducts, type Category, type Product} from '@/lib/content';

const localized=z.object({en:z.string().max(10000),ar:z.string().max(10000),ru:z.string().max(10000),es:z.string().max(10000)});
const slug=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);
const status=z.enum(['draft','review','published','scheduled','unlisted','archived']);
const assetUrl=z.string().max(1000).refine(value=>{if(!value)return true;if(value.startsWith('/')&&!value.startsWith('//'))return true;try{return new URL(value).protocol==='https:';}catch{return false;}},'请输入站内路径或 HTTPS 地址');
const seo=z.object({title:localized.optional(),description:localized.optional(),keywords:z.string().max(500).optional(),canonical:assetUrl.optional(),ogTitle:localized.optional(),ogDescription:localized.optional(),ogImage:assetUrl.optional(),noindex:z.boolean().optional()}).default({});
export const categoryInput=z.object({slug,name:localized,summary:localized,description:localized.optional().default({en:'',ar:'',ru:'',es:''}),image:assetUrl,icon:assetUrl.optional().default(''),source:z.string().max(1000).optional().default(''),parent_slug:z.string().nullable().optional(),status:z.enum(['draft','published','archived']),sort_order:z.number().int().optional().default(0),nav_visible:z.boolean().optional().default(true),enabled:z.boolean().optional().default(true),seo});
export const productInput=z.object({id:z.string().regex(/^[A-Za-z0-9-]+$/).max(50),slug,category_slug:z.string().min(1),name:localized,summary:localized,application:localized,details:localized.optional().default({en:'',ar:'',ru:'',es:''}),features:z.array(localized).max(30).optional().default([]),specifications:z.array(z.object({key:localized,value:localized})).max(100).optional().default([]),gallery:z.array(assetUrl).max(20).optional().default([]),documents:z.array(assetUrl).max(20).optional().default([]),video_url:assetUrl.optional().default(''),moq:z.string().max(100).optional().default(''),lead_time:z.string().max(100).optional().default(''),price_mode:z.enum(['none','fixed','range','contact','quote']).optional().default('quote'),price_min:z.coerce.number().nonnegative().nullable().optional(),price_max:z.coerce.number().nonnegative().nullable().optional(),featured:z.boolean().optional().default(false),pinned:z.boolean().optional().default(false),image:assetUrl,size:z.string().max(200).optional().default(''),source:z.string().max(1000).optional().default(''),status,scheduled_at:z.string().datetime().nullable().optional(),sort_order:z.number().int().optional().default(0),seo});
export const articleInput=z.object({slug,category_slug:z.string().optional().default('resources'),title:localized,intro:localized,sections:z.array(z.object({heading:localized,body:localized})).max(30),author:z.string().max(100).optional().default(''),featured:z.boolean().optional().default(false),pinned:z.boolean().optional().default(false),image:assetUrl.optional().default(''),status,scheduled_at:z.string().datetime().nullable().optional(),seo});
export const newsCategoryInput=z.object({slug,name:localized,status:z.enum(['draft','published','archived']),sort_order:z.number().int().optional().default(0)});
export type ContentKind='categories'|'products'|'articles'|'news-categories';
export const contentKinds:Record<ContentKind,{table:string;id:string;schema:z.ZodTypeAny;permissionName:string}>={
  categories:{table:'content_categories',id:'slug',schema:categoryInput,permissionName:'产品分类'},
  products:{table:'content_products',id:'id',schema:productInput,permissionName:'产品'},
  articles:{table:'content_articles',id:'slug',schema:articleInput,permissionName:'新闻'},
  'news-categories':{table:'news_categories',id:'slug',schema:newsCategoryInput,permissionName:'新闻分类'}
};
export function config(kind:string){return Object.prototype.hasOwnProperty.call(contentKinds,kind)?contentKinds[kind as ContentKind]:null;}
export function cleanLocalized(value:Record<string,string>){return Object.fromEntries(['en','ar','ru','es'].map(locale=>[locale,(value[locale]||'').replace(/<[^>]*>/g,'').trim()]));}
export async function publishIssue(kind:string,data:Record<string,unknown>):Promise<string|null>{
  const title=(data.name||data.title) as Record<string,string>|undefined;
  if(!title?.en?.trim())return '发布需要英文标题';
  if(kind==='products'){
    const rows=await db().query("SELECT 1 FROM content_categories WHERE slug=$1 AND status='published' AND enabled=true AND deleted_at IS NULL",[data.category_slug]);
    if(!rows.length)return '请先发布并启用产品分类';
  }
  if(kind==='articles'){
    const rows=await db().query("SELECT 1 FROM news_categories WHERE slug=$1 AND status='published' AND deleted_at IS NULL",[data.category_slug]);
    if(!rows.length)return '请先发布新闻分类';
  }
  if(kind==='categories'&&data.parent_slug){
    const rows=await db().query("SELECT 1 FROM content_categories WHERE slug=$1 AND status='published' AND enabled=true AND deleted_at IS NULL",[data.parent_slug]);
    if(!rows.length)return '请先发布并启用上级分类';
  }
  return null;
}

export async function publishedCategories():Promise<Category[]> {
  if(!process.env.DATABASE_URL)return initialCategories;
  const rows=await db().query(`SELECT slug,name,summary,description,image,source,seo,nav_visible,updated_at FROM content_categories WHERE status='published' AND enabled=true AND deleted_at IS NULL ORDER BY sort_order,slug`);
  return rows as Category[];
}
export async function publishedProducts():Promise<Product[]> {
  if(!process.env.DATABASE_URL)return initialProducts.filter(p=>p.status==='published');
  const rows=await db().query(`SELECT id,slug,category_slug AS category,name,summary,application,details,features,specifications,gallery,documents,video_url,moq,lead_time,price_mode,price_min,price_max,featured,pinned,image,size,source,status,seo,updated_at FROM content_products
    WHERE status='published' AND deleted_at IS NULL ORDER BY pinned DESC,sort_order,id`);
  return rows as Product[];
}
export async function publishedArticles():Promise<Article[]> {
  if(!process.env.DATABASE_URL)return initialArticles;
  const rows=await db().query(`SELECT slug,title,intro,sections,author,featured,pinned,seo,updated_at FROM content_articles WHERE status='published' AND deleted_at IS NULL ORDER BY pinned DESC,published_at DESC NULLS LAST,slug`);
  return rows as Article[];
}
