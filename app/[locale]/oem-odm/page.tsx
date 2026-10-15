import {publishedProducts} from '@/lib/admin/content';
import type {Metadata} from 'next';
import Image from 'next/image';
import {Ruler, PaintBrush, Cube, Package} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {InquiryForm} from '@/components/InquiryForm';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import type {Locale} from '@/i18n/routing';
const icons=[Ruler,PaintBrush,Cube,Package];
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return pageMetadata(locale,'/oem-odm',copy[locale].oemTitle,copy[locale].oemIntro,'/images/sections/oem-paper-studio.webp');}
export default async function Oem({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;const c=copy[locale];const productOptions=await publishedProducts();return <><PageHero locale={locale} path="/oem-odm" eyebrow={c.oemKicker} title={c.oemTitle} intro={c.oemIntro}/><section className="inner-content"><div className="container two-column"><div className="body-copy"><h2>{c.customizationTitle}</h2><p>{c.oemBody}</p><p>{c.customizationBody}</p></div><Image src="/images/sections/oem-paper-studio.webp" width={1536} height={1024} alt="Illustrative paper roll customization example"/></div><div className="container simple-grid" style={{marginTop:55}}>{c.oemSteps.map(([title,body],index)=>{const Icon=icons[index];return <article className="simple-tile" key={title}><Icon size={32} weight="thin"/><h3>{title}</h3><p>{body}</p></article>;})}</div></section><section className="inquiry-section"><div className="container inquiry-layout"><div><h2 className="section-heading">{locale==='en'?'Send Your Specifications':locale==='ar'?'أرسل مواصفاتك':locale==='ru'?'Отправьте параметры':'Envíe sus parámetros'}</h2><p className="section-intro">{c.oemIntro}</p></div><InquiryForm locale={locale} productOptions={productOptions}/></div></section></>;}
