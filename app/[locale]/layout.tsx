import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {isLocale, locales} from '@/i18n/routing';
import {Header} from '@/components/Header';
import {Footer} from '@/components/Footer';
import {WhatsAppFloat} from '@/components/WhatsAppFloat';
import {site} from '@/lib/site';
import {publishedCategories} from '@/lib/admin/content';
import {AnalyticsTracker} from '@/components/AnalyticsTracker';
import '../globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.origin),
  icons: {
    icon: [
      {url: '/favicon.ico', sizes: 'any', type: 'image/x-icon'},
      {url: '/images/brand/icon-64.png', sizes: '64x64', type: 'image/png'}
    ],
    apple: [{url: '/images/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png'}]
  },
  manifest: '/manifest.webmanifest'
};
export const dynamicParams = true;
// CMS edits must appear on the public site without a new deployment.
export const dynamic = 'force-dynamic';
export function generateStaticParams() {return locales.map(locale => ({locale}));}

export default async function LocaleLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const categories=await publishedCategories();
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider>
          <Header locale={locale} categories={categories}/>
          <main id="main-content">{children}</main>
          <Footer locale={locale} />
          <WhatsAppFloat />
          <AnalyticsTracker locale={locale}/>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
