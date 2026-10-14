import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowRight, Receipt, Bank, Truck, Storefront, Files} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {applications, local} from '@/lib/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import type {Locale} from '@/i18n/routing';
const icons=[Receipt,Bank,Truck,Storefront,Files];
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return pageMetadata(locale,'/applications',copy[locale].applicationsTitle,copy[locale].applicationIntro);}
export default async function Applications({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;return <><PageHero locale={locale} path="/applications" title={copy[locale].applicationsTitle} intro={copy[locale].applicationIntro}/><section className="inner-content"><div className="container simple-grid">{applications.map((item,index)=>{const Icon=icons[index];return <article key={item.slug} className="simple-tile"><Icon size={36} weight="thin"/><h3>{local(item.name,locale)}</h3><p>{local(item.summary,locale)}</p><Link className="text-link" href={`/${locale}/applications/${item.slug}`}>{locale==='en'?'Explore':locale==='ar'?'استكشف':locale==='ru'?'Подробнее':'Explorar'}<ArrowRight size={15}/></Link></article>;})}</div></section></>;}
