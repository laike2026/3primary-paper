import type {Metadata} from 'next';
import {Envelope, WhatsappLogo} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {InquiryForm} from '@/components/InquiryForm';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {site} from '@/lib/site';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return pageMetadata(locale,'/contact',locale==='en'?'Contact Us':locale==='ar'?'اتصل بنا':locale==='ru'?'Контакты':'Contacto',copy[locale].contactIntro);}
export default async function Contact({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;return <><PageHero locale={locale} path="/contact" title={locale==='en'?'Let’s Talk Paper':locale==='ar'?'لنتحدث عن الورق':locale==='ru'?'Обсудим бумагу':'Hablemos de papel'} intro={copy[locale].contactIntro}/><section className="inner-content"><div className="container inquiry-layout"><div><h2 className="section-heading">{locale==='en'?'Contact Our Team':locale==='ar'?'تواصل مع فريقنا':locale==='ru'?'Связаться с нами':'Contacte a nuestro equipo'}</h2><p className="section-intro">{copy[locale].contactIntro}</p><div className="contact-options"><a href={`mailto:${site.email}`}><Envelope size={23}/><span>{site.email}</span></a><a href={site.whatsapp} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={23}/><span>{site.phone}</span></a></div><p className="muted" style={{fontSize:13}}>{locale==='en'?'Anji County, Huzhou City, Zhejiang Province, China':locale==='ar'?'مقاطعة آنجي، مدينة هوتشو، تشجيانغ، الصين':locale==='ru'?'Уезд Аньцзи, город Хучжоу, провинция Чжэцзян, Китай':'Condado de Anji, Huzhou, Zhejiang, China'}</p></div><InquiryForm locale={locale}/></div></section></>;}
