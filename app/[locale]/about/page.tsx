import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {PageHero} from '@/components/PageHero';
import {wording} from '@/components/WebsiteBlocks';
import {publishedWebsite} from '@/lib/admin/website';
import {local} from '@/lib/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import type {Locale} from '@/i18n/routing';
import {organizationJsonLd} from '@/lib/seo';
import {site} from '@/lib/site';
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return pageMetadata(locale,'/about',copy[locale].aboutTitle,copy[locale].aboutIntro);}
export default async function About({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;const items=await publishedWebsite('about');return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organizationJsonLd()).replace(/</g,'\\u003c')}}/><PageHero locale={locale} path="/about" title={copy[locale].aboutTitle} intro={copy[locale].aboutIntro}/>{items.map(item=><section className="inner-content" key={item.slug}><div className="container two-column"><div className="body-copy"><span className="eyebrow">{site.company}</span><h2>{local(item.name,locale)}</h2><p className="preserve-lines">{local(item.body,locale)}</p><div className="detail-actions"><Link href={`/${locale}/manufacturing-quality`} className="button button-outline">{wording(locale,'Explore manufacturing →','استكشف التصنيع ←','Подробнее о производстве →','Conozca la producción →')}</Link><Link href={`/${locale}/contact#inquiry`} className="button">{wording(locale,'Talk to our team →','تحدث مع فريقنا ←','Связаться с командой →','Hable con nuestro equipo →')}</Link></div></div>{item.image&&<Image src={item.image} width={900} height={675} alt={local(item.name,locale)} sizes="(max-width:700px) 100vw, 50vw"/>}</div></section>)}</>;}
