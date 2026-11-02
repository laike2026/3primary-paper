import type {Metadata} from 'next';
import Link from 'next/link';
import {PageHero} from '@/components/PageHero';
import {wording,FaqList} from '@/components/WebsiteBlocks';
import {publishedWebsite} from '@/lib/admin/website';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import type {Locale} from '@/i18n/routing';
const topics:Record<string,[string,string,string,string]>={products:['Products & specifications','المنتجات والمواصفات','Товары и характеристики','Productos y especificaciones'],customization:['Customization','التخصيص','Индивидуальный заказ','Personalización'],samples:['Samples','العينات','Образцы','Muestras'],ordering:['Orders & quotations','الطلبات والأسعار','Заказы и цены','Pedidos y cotizaciones'],shipping:['Packing & shipping','التغليف والشحن','Упаковка и доставка','Embalaje y envío'],support:['Support','الدعم','Поддержка','Asistencia']};
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return pageMetadata(locale,'/faq',copy[locale].faqTitle,copy[locale].oemIntro);}
export default async function Faq({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;const items=await publishedWebsite('faq');const groups=[...new Set(items.map(i=>i.topic))];const label=(topic:string)=>topics[topic]?.[['en','ar','ru','es'].indexOf(locale)]||topic;return <><PageHero locale={locale} path="/faq" title={copy[locale].faqTitle} intro={copy[locale].oemIntro}/><section className="inner-content"><div className="container"><nav className="material-topic-nav" aria-label={copy[locale].faqTitle}>{groups.map(topic=><a key={topic} href={`#${topic}`}>{label(topic)}</a>)}</nav>{groups.map(topic=><section className="material-faq-group" id={topic} key={topic}><h2 className="section-heading">{label(topic)}</h2><FaqList items={items.filter(i=>i.topic===topic)} locale={locale}/></section>)}<Link className="button" href={`/${locale}/contact#inquiry`}>{wording(locale,'Ask a question →','اطرح سؤالاً ←','Задать вопрос →','Hacer una pregunta →')}</Link></div></section></>;}
