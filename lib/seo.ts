import type {Metadata} from 'next';
import {locales, type Locale} from '@/i18n/routing';
import {site, isIndexingEnabled} from './site';

export function pageMetadata(locale: Locale, path: string, title: string, description: string, image?: string): Metadata {
  const pathname = `/${locale}${path}`;
  const url = new URL(pathname, site.origin).toString();
  const socialImage = new URL(site.socialImage, site.origin).toString();
  return {
    title: `${title} | 3PRIMARY`,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries([...locales.map(item => [item, new URL(`/${item}${path}`, site.origin).toString()]), ['x-default', new URL(`/en${path}`, site.origin).toString()]])
    },
    openGraph: {type: 'website', siteName: '3PRIMARY', title, description, url, images: [{url: socialImage, width: 1200, height: 630, alt: '3PRIMARY paper products'}, ...(image ? [{url: new URL(image, site.origin).toString()}] : [])]},
    twitter: {card: 'summary_large_image', title, description, images: [socialImage]},
    robots: isIndexingEnabled ? {index: true, follow: true} : {index: false, follow: false}
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
