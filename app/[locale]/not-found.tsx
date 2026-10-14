'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {isLocale, type Locale} from '@/i18n/routing';

const message: Record<Locale, {title:string;intro:string;home:string}> = {
  en: {title:'Page not found',intro:'The requested page is unavailable.',home:'Return home'},
  ar: {title:'الصفحة غير موجودة',intro:'الصفحة المطلوبة غير متاحة.',home:'العودة إلى الرئيسية'},
  ru: {title:'Страница не найдена',intro:'Запрошенная страница недоступна.',home:'На главную'},
  es: {title:'Página no encontrada',intro:'La página solicitada no está disponible.',home:'Volver al inicio'}
};

export default function NotFound(){
  const candidate = usePathname().split('/')[1];
  const locale = isLocale(candidate) ? candidate : 'en';
  const current = message[locale];
  return <section className="inner-content"><div className="container" style={{minHeight:350}}><h1 className="section-heading">{current.title}</h1><p className="section-intro">{current.intro}</p><Link className="button" href={`/${locale}`}>{current.home}</Link></div></section>;
}
