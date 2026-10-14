import type {MetadataRoute} from 'next';
import {categories, products, applications} from '@/lib/content';
import {articles} from '@/lib/articles';
import {locales} from '@/i18n/routing';
import {site, isProduction} from '@/lib/site';

export default function sitemap():MetadataRoute.Sitemap {
  if(!isProduction)return [];
  const paths=['','/products','/applications','/brands','/oem-odm','/manufacturing-quality','/about','/resources','/blog','/faq','/contact','/privacy-policy','/terms','/resources/rfq-checklist',...categories.map(x=>`/products/${x.slug}`),...products.map(x=>`/product/${x.slug}`),...applications.map(x=>`/applications/${x.slug}`),...articles.map(x=>`/blog/${x.slug}`)];
  return paths.flatMap(path=>locales.map(locale=>({url:new URL(`/${locale}${path}`,site.origin).toString(),lastModified:new Date(),alternates:{languages:Object.fromEntries([...locales.map(item=>[item,new URL(`/${item}${path}`,site.origin).toString()]),['x-default',new URL(`/en${path}`,site.origin).toString()]])}})));
}
