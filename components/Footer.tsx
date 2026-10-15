import Image from 'next/image';
import Link from 'next/link';
import {getTranslations} from 'next-intl/server';
import {Envelope, WhatsappLogo, ArrowUpRight} from '@phosphor-icons/react/dist/ssr';
import {local} from '@/lib/content';
import {publishedCategories} from '@/lib/admin/content';
import {publicContact} from '@/lib/admin/settings';
import {site} from '@/lib/site';
import type {Locale} from '@/i18n/routing';

export async function Footer({locale}: {locale: Locale}) {
  const nav = await getTranslations('nav');
  const common = await getTranslations('common');
  const categories=await publishedCategories();
  const contact=await publicContact();
  return <footer className="site-footer">
    <div className="container footer-main">
      <div className="footer-brand"><Link href={`/${locale}`}><Image src={site.logo} alt="3PRIMARY" width={166} height={50}/></Link><strong>{site.company}</strong><p>{locale === 'en' ? 'Paper solutions for business procurement.' : locale === 'ar' ? 'حلول ورقية لمشتريات الأعمال.' : locale === 'ru' ? 'Бумажные решения для корпоративных закупок.' : 'Soluciones de papel para compras empresariales.'}</p></div>
      <div><h3>{locale === 'en' ? 'Quick Links' : locale === 'ar' ? 'روابط سريعة' : locale === 'ru' ? 'Ссылки' : 'Enlaces'}</h3><Link href={`/${locale}`}>{nav('home')}</Link><Link href={`/${locale}/products`}>{nav('products')}</Link><Link href={`/${locale}/applications`}>{nav('applications')}</Link><Link href={`/${locale}/oem-odm`}>{nav('oem')}</Link><Link href={`/${locale}/about`}>{nav('about')}</Link><Link href={`/${locale}/contact`}>{nav('contact')}</Link></div>
      <div><h3>{nav('products')}</h3>{categories.slice(0,5).map(item => <Link key={item.slug} href={`/${locale}/products/${item.slug}`}>{local(item.name, locale)}</Link>)}</div>
      <div className="footer-contact"><h3>{nav('contact')}</h3><a href={contact.whatsapp} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={19}/><span>{contact.phone}</span></a><a href={`mailto:${site.email}`}><Envelope size={19}/><span>{site.email}</span></a>{contact.address&&contact.mapUrl&&<a href={contact.mapUrl} data-track-event="address_click" data-track-placement="footer" target="_blank" rel="noopener noreferrer">{contact.address}</a>}<Link href={`/${locale}/contact`}>{common('request')} <ArrowUpRight size={15}/></Link></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} {site.company}</span><div><Link href={`/${locale}/privacy-policy`}>{common('privacy')}</Link><Link href={`/${locale}/terms`}>{common('terms')}</Link><Link href="/sitemap.xml">{locale === 'en' ? 'Sitemap' : locale === 'ar' ? 'خريطة الموقع' : locale === 'ru' ? 'Карта сайта' : 'Mapa del sitio'}</Link></div><span className="footer-signoff">{locale === 'en' ? 'A Greener Tomorrow' : locale === 'ar' ? 'لغدٍ أكثر خضرة' : locale === 'ru' ? 'К более зелёному завтра' : 'Por un mañana más verde'} <span aria-hidden="true">✦</span></span></div>
  </footer>;
}
