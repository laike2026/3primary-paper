import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowRight} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {articles} from '@/lib/articles';
import {publishedArticles} from '@/lib/admin/content';
import {local} from '@/lib/content';
import {pageMetadata} from '@/lib/seo';
import {site} from '@/lib/site';
import type {Locale} from '@/i18n/routing';
export function generateStaticParams(){return articles.map(item=>({slug:item.slug}));}
export async function generateMetadata({params}:{params:Promise<{locale:Locale;slug:string}>}):Promise<Metadata>{const {locale,slug}=await params;const item=(await publishedArticles()).find(x=>x.slug===slug);if(!item)notFound();return pageMetadata(locale,`/blog/${slug}`,local(item.title,locale),local(item.intro,locale),undefined,item.seo);}
export default async function ArticlePage({params}:{params:Promise<{locale:Locale;slug:string}>}){const {locale,slug}=await params;const item=(await publishedArticles()).find(x=>x.slug===slug);if(!item)notFound();const jsonLd={'@context':'https://schema.org','@type':'Article',headline:local(item.title,locale),description:local(item.intro,locale),author:{'@type':'Organization',name:site.company},publisher:{'@type':'Organization',name:site.company,logo:new URL(site.organizationLogo,site.origin).toString()},mainEntityOfPage:new URL(`/${locale}/blog/${slug}`,site.origin).toString()};return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/><PageHero locale={locale} path={`/blog/${slug}`} parent={{label:locale==='en'?'Resources':locale==='ar'?'الموارد':locale==='ru'?'Материалы':'Recursos',href:'/blog'}} title={local(item.title,locale)} intro={local(item.intro,locale)}/><article className="inner-content"><div className="container article-layout">{item.sections.map(section=><section key={local(section.heading,locale)}><h2>{local(section.heading,locale)}</h2><p>{local(section.body,locale)}</p></section>)}<div style={{marginTop:50}}><Link href={`/${locale}/contact#inquiry`} className="button">{locale==='en'?'Discuss Your Requirements':locale==='ar'?'ناقش متطلباتك':locale==='ru'?'Обсудить запрос':'Comentar sus requisitos'}<ArrowRight size={16}/></Link></div></div></article></>;}
