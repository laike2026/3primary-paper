import Image from 'next/image';
import Link from 'next/link';
import {Receipt, Bank, Truck, Storefront, Files, ArrowRight} from '@phosphor-icons/react/dist/ssr';
import {InnerPage, CtaStrip} from '@/components/Interior';
import {PageHero} from '@/components/PageHero';
import {applications, local} from '@/lib/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {ui, tr} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
const icons = [Receipt, Bank, Truck, Storefront, Files],
  images = [
    '/images/editorial/retail-pos.webp',
    '/images/editorial/banking-atm.webp',
    '/images/editorial/logistics.webp',
    '/images/editorial/retail-pos.webp',
    '/images/products/carbonless-2.webp',
  ];
export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(locale, '/applications', copy[locale].applicationsTitle, copy[locale].applicationIntro);
}
export default async function Applications({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return (
    <InnerPage>
      <PageHero
        locale={locale}
        path="/applications"
        title={tr(
          locale,
          'Paper for everyday business',
          'ورق لأعمالك اليومية',
          'Бумага для ежедневных задач бизнеса',
          'Papel para el trabajo diario',
        )}
        intro={copy[locale].applicationIntro}
      />
      <section className="inner-content">
        <div className="container">
          {applications.map((a, i) => {
            const Icon = icons[i];
            return (
              <article className="story-row" key={a.slug}>
                <Link className="story-photo" href={'/' + locale + '/applications/' + a.slug}>
                  <Image src={images[i]} alt={local(a.name, locale)} width={1000} height={650} />
                </Link>
                <div className="story-copy">
                  <Icon size={44} weight="light" />
                  <h2>{local(a.name, locale)}</h2>
                  <p>{local(a.summary, locale)}</p>
                  <Link className="text-link" href={'/' + locale + '/applications/' + a.slug}>
                    {ui(locale, 'view')}
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </article>
            );
          })}
          <CtaStrip locale={locale} />
        </div>
      </section>
    </InnerPage>
  );
}
