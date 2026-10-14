import Link from 'next/link';
import type {Locale} from '@/i18n/routing';
import {breadcrumbJson} from '@/lib/seo';

export function PageHero({locale, path, eyebrow, title, intro, parent}: {locale: Locale; path: string; eyebrow?: string; title: string; intro?: string; parent?: {label: string; href: string}}) {
  const home = locale === 'en' ? 'Home' : locale === 'ar' ? 'الرئيسية' : locale === 'ru' ? 'Главная' : 'Inicio';
  const entries = [{name:home,path:''}, ...(parent ? [{name:parent.label,path:parent.href}] : []), {name:title,path}];
  return <section className="inner-hero"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbJson(locale,entries)).replace(/</g,'\\u003c')}}/><div className="container"><div className="breadcrumbs"><Link href={`/${locale}`}>{home}</Link>{parent && <> / <Link href={`/${locale}${parent.href}`}>{parent.label}</Link></>}</div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{intro && <p>{intro}</p>}</div></section>;
}
