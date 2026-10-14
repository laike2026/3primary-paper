import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowRight} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {articles} from '@/lib/articles';
import {local} from '@/lib/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return pageMetadata(locale,'/blog',copy[locale].resourcesTitle,copy[locale].blogIntro);}
export default async function Blog({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;return <><PageHero locale={locale} path="/blog" title={copy[locale].resourcesTitle} intro={copy[locale].blogIntro}/><section className="inner-content"><div className="container resource-grid">{articles.map(item=><article className="resource-card" key={item.slug}><small>{locale==='en'?'Buying guide':locale==='ar'?'دليل شراء':locale==='ru'?'Руководство':'Guía de compra'}</small><h2 style={{fontFamily:'var(--serif)',fontSize:28,fontWeight:400,marginTop:18}}>{local(item.title,locale)}</h2><p>{local(item.intro,locale)}</p><Link className="text-link" href={`/${locale}/blog/${item.slug}`}>{locale==='en'?'Read Guide':locale==='ar'?'اقرأ الدليل':locale==='ru'?'Читать':'Leer guía'}<ArrowRight size={15}/></Link></article>)}</div></section></>;}
