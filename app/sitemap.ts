import type {MetadataRoute} from 'next';
import {applications} from '@/lib/content';
import {publishedCategories,publishedProducts,publishedArticles} from '@/lib/admin/content';
import {locales} from '@/i18n/routing';
import {site, isIndexingEnabled} from '@/lib/site';

export const dynamic='force-dynamic';

export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  if(!isIndexingEnabled)return [];
  const [categories,products,articles]=await Promise.all([publishedCategories(),publishedProducts(),publishedArticles()]);
  const paths:{path:string;modified?:string|Date}[]=[
    ...['','/products','/applications','/brands','/oem-odm','/manufacturing-quality','/about','/resources','/blog','/faq','/contact','/privacy-policy','/terms','/resources/rfq-checklist'].map(path=>({path})),
    ...categories.filter(x=>!x.seo?.noindex).map(x=>({path:`/products/${x.slug}`,modified:x.updated_at})),
    ...products.filter(x=>!x.seo?.noindex).map(x=>({path:`/product/${x.slug}`,modified:x.updated_at})),
    ...applications.map(x=>({path:`/applications/${x.slug}`})),
    ...articles.filter(x=>!x.seo?.noindex).map(x=>({path:`/blog/${x.slug}`,modified:x.updated_at}))
  ];
  return paths.flatMap(({path,modified})=>locales.map(locale=>({
    url:new URL(`/${locale}${path}`,site.origin).toString(),
    ...(modified?{lastModified:new Date(modified)}:{}),
    alternates:{languages:Object.fromEntries([...locales.map(item=>[item,new URL(`/${item}${path}`,site.origin).toString()]),['x-default',new URL(`/en${path}`,site.origin).toString()]])}
  })));
}
