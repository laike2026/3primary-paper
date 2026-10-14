import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowRight} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return pageMetadata(locale,'/faq',copy[locale].faqTitle,copy[locale].oemIntro);}
export default async function Faq({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;const c=copy[locale];return <><PageHero locale={locale} path="/faq" title={c.faqTitle} intro={c.oemIntro}/><section className="inner-content"><div className="container faq-list">{c.faqs.map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}<p style={{marginTop:35}}><Link href={`/${locale}/contact#inquiry`} className="button">{locale==='en'?'Ask a Question':locale==='ar'?'اطرح سؤالاً':locale==='ru'?'Задать вопрос':'Hacer una pregunta'}<ArrowRight size={16}/></Link></p></div></section></>;}
