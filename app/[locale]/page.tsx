import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {ArrowRight, Leaf, ShieldCheck, UsersThree, GlobeHemisphereEast, Package, Tag, Truck, Receipt, FileText, Printer, Ruler, PaintBrush, Cube, Handshake} from '@phosphor-icons/react/dist/ssr';
import {copy} from '@/lib/copy';
import {applications, local} from '@/lib/content';
import {publishedArticles,publishedCategories,publishedProducts} from '@/lib/admin/content';
import {ProductCard} from '@/components/ProductCard';
import {InquiryForm} from '@/components/InquiryForm';
import {organizationJsonLd, pageMetadata} from '@/lib/seo';
import {site} from '@/lib/site';
import {publishedWebsite} from '@/lib/admin/website';
import {FaqList,DownloadCards} from '@/components/WebsiteBlocks';
import {isLocale, type Locale} from '@/i18n/routing';

const benefitIcons = [Leaf, ShieldCheck, UsersThree, GlobeHemisphereEast];
const applicationIcons = [Receipt, FileText, Truck, Tag, Printer];
const oemIcons = [Ruler, PaintBrush, Cube, Package, Handshake];

export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}): Promise<Metadata> {
  const {locale} = await params;if(!isLocale(locale))notFound();return pageMetadata(locale,'',copy[locale].heroTitle,copy[locale].heroBody);
}

export default async function Home({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;if(!isLocale(locale))notFound();setRequestLocale(locale);
  const c = copy[locale];const t = await getTranslations('common');
  const [,products,articles,photos,faqs,downloads]=await Promise.all([publishedCategories(),publishedProducts(),publishedArticles(),publishedWebsite('factory'),publishedWebsite('faq'),publishedWebsite('download')]);
  const featured = ['TP-8080','LB-THERMAL','LB-CUSTOM','TP-JUMBO'].map(id=>products.find(p=>p.id===id)).filter((item):item is NonNullable<typeof item>=>Boolean(item));
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(organizationJsonLd()).replace(/</g, '\\u003c')}}/>
    <section className="hero material-hero"><div className="material-hero-product"><Image src="/images/materials/product-01-2.webp" alt="" fill priority sizes="(max-width:700px) 100vw, 50vw"/></div><div className="container hero-content"><p className="eyebrow">{c.heroKicker}</p><h1>{locale==='en'?<>Paper solutions,<br/>made for your business.</>:c.heroTitle}</h1><span className="accent-line"/><p>{c.heroBody}</p><div className="hero-actions"><Link href={`/${locale}/products`} className="button">{t('explore')} <ArrowRight size={16}/></Link><Link href={`/${locale}/contact#inquiry`} className="button button-outline">{t('request')}</Link></div><div className="hero-scribble" aria-hidden="true">{c.scribble.split('\n').map(line => <div key={line}>{line}</div>)}</div></div><div className="hero-side-note" aria-hidden="true">Quality<br/>Efficiency<br/>Partnership</div></section>
    <section className="benefits"><div className="container benefits-grid">{c.benefits.map(([title,sub],index) => {const Icon=benefitIcons[index];return <div className="benefit" key={title}><div className="benefit-icon"><Icon size={37} weight="thin"/></div><div><strong>{title}</strong><small>{sub}</small></div></div>;})}</div></section>
    <section className="products-home section-shell"><div className="container"><div className="section-topline"><div><h2 className="section-heading">{c.productsTitle}</h2><span className="accent-line"/></div><p>{c.productsBody} &nbsp; <Link href={`/${locale}/products`} className="text-link">{t('viewAll')} <ArrowRight size={14}/></Link></p></div><div className="material-featured-grid">{featured.map(item => <ProductCard key={item.id} product={item} locale={locale} label={t('learn')}/>)}</div></div></section>
    <section className="oem-band"><div className="oem-inner"><div className="oem-copy"><span className="eyebrow">{c.oemKicker}</span><h2>{c.oemTitle}</h2><p>{c.oemBody}</p><Link href={`/${locale}/oem-odm`} className="button">{t('request')} <ArrowRight size={16}/></Link></div><div className="oem-image"><Image src="/images/materials/product-04-1.webp" alt={c.oemTitle} fill sizes="(max-width: 700px) 100vw, 50vw"/></div><ul className="oem-list">{c.oemPoints.map((point,index) => {const Icon=oemIcons[index];return <li key={point}><Icon size={24} weight="thin"/>{point}</li>;})}</ul></div></section>
    <section className="manufacturing"><div className="manufacturing-media"><Image src={photos[0]?.image||"/images/materials/factory-converting.webp"} alt={photos[0]?local(photos[0].name,locale):"Paper converting"} fill sizes="(max-width: 700px) 100vw, 47vw"/><span className="manufacturing-media-caption">{locale==='en'?<>Paper converting<br/>Order coordination<br/>Quality communication</>:locale==='ar'?<>تحويل الورق<br/>تنسيق الطلبات<br/>التواصل بشأن الجودة</>:locale==='ru'?<>Переработка бумаги<br/>Согласование заказов<br/>Контроль качества</>:<>Conversión de papel<br/>Coordinación de pedidos<br/>Comunicación de calidad</>}</span></div><div className="manufacturing-copy"><h2>{c.manufacturingTitle}</h2><p>{c.manufacturingBody}</p><div className="manufacturing-points">{c.manufacturingPoints.map(([head,sub]) => <div key={head}><strong>{head}</strong><span>{sub}</span></div>)}</div><Link href={`/${locale}/manufacturing-quality`} className="button button-outline" aria-label={`${t('learn')}: ${c.manufacturingTitle}`}>{t('learn')}<span className="sr-only">: {c.manufacturingTitle}</span> <ArrowRight size={16}/></Link></div></section>
    <section className="sustainability"><div className="container sustainability-inner"><h2>{c.sustainabilityTitle}</h2><div><p>{c.sustainabilityBody}</p><Link href={`/${locale}/about`} className="text-link" aria-label={`${t('learn')}: ${c.sustainabilityTitle}`}>{t('learn')}<span className="sr-only">: {c.sustainabilityTitle}</span> <ArrowRight size={14}/></Link></div></div></section>
    <section className="applications-section section-shell"><div className="container"><div className="section-topline"><div><h2 className="section-heading">{c.applicationsTitle}</h2><span className="accent-line"/></div><p>{c.applicationsBody}</p></div><div className="application-grid">{applications.map((item,index) => {const Icon=applicationIcons[index];return <article key={item.slug} className="application-card"><Icon size={29} weight="thin"/><h3>{local(item.name,locale)}</h3><p>{local(item.summary,locale)}</p><Link className="text-link" href={`/${locale}/applications/${item.slug}`} aria-label={`${t('learn')}: ${local(item.name,locale)}`}>{t('learn')}<span className="sr-only">: {local(item.name,locale)}</span><ArrowRight size={14}/></Link></article>;})}</div></div></section>
    {articles.length>0&&<section className="section-shell"><div className="container"><div className="section-topline"><div><h2 className="section-heading">{c.resourcesTitle}</h2><span className="accent-line"/></div><p>{c.resourcesBody}</p></div><div className="resource-grid">{articles.slice(0,3).map(item=><article className="resource-card" key={item.slug}><small>{locale==='en'?'Paper sourcing guide':locale==='ar'?'دليل شراء الورق':locale==='ru'?'Руководство по закупке':'Guía de compra de papel'}</small><h3>{local(item.title,locale)}</h3><p>{local(item.intro,locale)}</p><Link className="text-link" href={`/${locale}/blog/${item.slug}`}>{t('read')}<ArrowRight size={14}/></Link></article>)}</div></div></section>}
    <section className="section-shell" style={{background:'#fbfaf8'}}><div className="container"><h2 className="section-heading" style={{textAlign:'center',marginBottom:35}}>{c.faqTitle}</h2><FaqList items={faqs.slice(0,5)} locale={locale}/><p style={{textAlign:'center'}}><Link className="text-link" href={`/${locale}/faq`}>{c.faqTitle} →</Link></p></div></section>
    <section className="section-shell"><div className="container"><DownloadCards items={downloads} locale={locale}/></div></section>
    <section className="inquiry-section"><div className="container inquiry-layout"><div><span className="eyebrow">{c.oemKicker}</span><h2 className="section-heading">{(await getTranslations('form'))('title')}</h2><p className="section-intro">{(await getTranslations('form'))('intro')}</p><p className="muted" style={{fontSize:13}}><a href={`mailto:${site.email}`}>{site.email}</a></p></div><InquiryForm locale={locale} productOptions={products}/></div></section>
    <section className="cta-band"><div className="container cta-inner"><div><h2>{c.ctaTitle}</h2><p>{c.ctaBody}</p></div><Link href={`/${locale}/contact#inquiry`} className="button">{t('contact')}<ArrowRight size={16}/></Link></div></section>
  </>;
}
