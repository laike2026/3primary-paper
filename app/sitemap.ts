import type {MetadataRoute} from 'next';
import {applications} from '@/lib/content';
import {publishedCategories,publishedProducts,publishedArticles} from '@/lib/admin/content';
import {locales} from '@/i18n/routing';
import {site, isIndexingEnabled} from '@/lib/site';

export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  if(!isIndexingEnabled)return [];
  const [categories,products,articles]=await Promise.all([publishedCategories(),publishedProducts(),publishedArticles()]);
  const paths=['','/products','/applications','/brands','/oem-odm','/manufacturing-quality','/about','/resources','/blog','/faq','/contact','/privacy-policy','/terms','/resources/rfq-checklist',...categories.map(x=>`/products/${x.slug}`),...products.map(x=>`/product/${x.slug}`),...applications.map(x=>`/applications/${x.slug}`),...articles.map(x=>`/blog/${x.slug}`)];
  return paths.flatMap(path=>locales.map(locale=>({url:new URL(`/${locale}${path}`,site.origin).toString(),lastModified:new Date(),alternates:{languages:Object.fromEntries([...locales.map(item=>[item,new URL(`/${item}${path}`,site.origin).toString()]),['x-default',new URL(`/en${path}`,site.origin).toString()]])}})));
}
