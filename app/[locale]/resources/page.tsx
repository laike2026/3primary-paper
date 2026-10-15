import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowRight, Article, ClipboardText} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {publishedArticles} from '@/lib/admin/content';
import {local} from '@/lib/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return pageMetadata(locale,'/resources',copy[locale].resourcesTitle,copy[locale].resourcesIntro);}
export default async function Resources({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;const liveArticles=await publishedArticles();return <><PageHero locale={locale} path="/resources" title={copy[locale].resourcesTitle} intro={copy[locale].resourcesIntro}/><section className="inner-content"><div className="container simple-grid"><article className="simple-tile"><ClipboardText size={36} weight="thin"/><h3>{locale==='en'?'Paper RFQ Checklist':locale==='ar'?'قائمة طلب عرض سعر الورق':locale==='ru'?'Список для запроса цены':'Lista para cotizar papel'}</h3><p>{copy[locale].oemIntro}</p><Link className="text-link" href={`/${locale}/resources/rfq-checklist`}>{locale==='en'?'Open Checklist':locale==='ar'?'افتح القائمة':locale==='ru'?'Открыть список':'Abrir lista'}<ArrowRight size={15}/></Link></article>{liveArticles.map(item=><article className="simple-tile" key={item.slug}><Article size={36} weight="thin"/><h3>{local(item.title,locale)}</h3><p>{local(item.intro,locale)}</p><Link className="text-link" href={`/${locale}/blog/${item.slug}`}>{locale==='en'?'Read Guide':locale==='ar'?'اقرأ الدليل':locale==='ru'?'Читать':'Leer guía'}<ArrowRight size={15}/></Link></article>)}</div></section></>;}
