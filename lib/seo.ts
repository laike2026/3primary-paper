import type {Metadata} from 'next';
import {locales, type Locale} from '@/i18n/routing';
import {site, isIndexingEnabled} from './site';

export function pageMetadata(locale: Locale, path: string, title: string, description: string, image?: string, seo?:{title?:Partial<Record<Locale,string>>;description?:Partial<Record<Locale,string>>;keywords?:string;canonical?:string;ogTitle?:Partial<Record<Locale,string>>;ogDescription?:Partial<Record<Locale,string>>;ogImage?:string;noindex?:boolean}): Metadata {
  title=seo?.title?.[locale]?.trim()||title;
  description=seo?.description?.[locale]?.trim()||description;
  const pathname = `/${locale}${path}`;
  const url = new URL(pathname, site.origin).toString();
  const socialImage = new URL(site.socialImage, site.origin).toString();
  const canonical=seo?.canonical?.trim()?new URL(seo.canonical,site.origin).toString():url;
  const ogImage=seo?.ogImage?.trim()?new URL(seo.ogImage,site.origin).toString():socialImage;
  return {
    title: `${title} | 3PRIMARY`,
    description,
    keywords:seo?.keywords||undefined,
    alternates: {
      canonical,
      languages: Object.fromEntries([...locales.map(item => [item, new URL(`/${item}${path}`, site.origin).toString()]), ['x-default', new URL(`/en${path}`, site.origin).toString()]])
    },
    openGraph: {type: 'website', siteName: '3PRIMARY', title:seo?.ogTitle?.[locale]||title, description:seo?.ogDescription?.[locale]||description, url, images: [{url: ogImage, width: 1200, height: 630, alt: '3PRIMARY paper products'}, ...(image ? [{url: new URL(image, site.origin).toString()}] : [])]},
    twitter: {card: 'summary_large_image', title, description, images: [ogImage]},
    robots: isIndexingEnabled&&!seo?.noindex ? {index: true, follow: true} : {index: false, follow: false}
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.company,
    url: site.origin,
    logo: new URL(site.organizationLogo, site.origin).toString(),
    email: site.email,
    telephone: site.phone
  };
}

export function breadcrumbJson(locale: Locale, entries: {name: string; path: string}[]) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: entries.map((entry, index) => ({'@type': 'ListItem', position: index + 1, name: entry.name, item: new URL(`/${locale}${entry.path}`, site.origin).toString()}))
  };
}
