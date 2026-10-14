import type {Metadata} from 'next';
import {locales, type Locale} from '@/i18n/routing';
import {site, isProduction} from './site';

export function pageMetadata(locale: Locale, path: string, title: string, description: string, image = '/images/sections/hero-paper-studio.webp'): Metadata {
  const pathname = `/${locale}${path}`;
  const url = new URL(pathname, site.origin).toString();
  return {
    title: `${title} | 3PRIMARY`,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries([...locales.map(item => [item, new URL(`/${item}${path}`, site.origin).toString()]), ['x-default', new URL(`/en${path}`, site.origin).toString()]])
    },
    openGraph: {type: 'website', title, description, url, images: [{url: new URL(image, site.origin).toString()}]},
    robots: isProduction ? {index: true, follow: true} : {index: false, follow: false}
  };
}

export function breadcrumbJson(locale: Locale, entries: {name: string; path: string}[]) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: entries.map((entry, index) => ({'@type': 'ListItem', position: index + 1, name: entry.name, item: new URL(`/${locale}${entry.path}`, site.origin).toString()}))
  };
}
