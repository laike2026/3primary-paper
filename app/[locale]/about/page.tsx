import Image from 'next/image';
import {PageHero} from '@/components/PageHero';
import {InnerPage, CtaStrip, ServicePrinciples} from '@/components/Interior';
import {publishedWebsite} from '@/lib/admin/website';
import {local} from '@/lib/content';
import {copy} from '@/lib/copy';
import {pageMetadata, organizationJsonLd} from '@/lib/seo';
import {ui, tr} from '@/lib/interior-copy';
import {site} from '@/lib/site';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(locale, '/about', copy[locale].aboutTitle, copy[locale].aboutIntro);
}
export default async function About({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const [items, photos] = await Promise.all([publishedWebsite('about'), publishedWebsite('factory')]);
  return (
    <InnerPage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(organizationJsonLd()).replace(/</g, '\\u003c')}}
      />
      <PageHero
        locale={locale}
        path="/about"
        title={ui(locale, 'aboutTitle')}
        intro={copy[locale].aboutIntro}
        image={items[0]?.image || '/images/materials/factory-samples.webp'}
        imageAlt={site.company}
      />
      <section className="inner-content">
        <div className="container">
          <h2>{site.company}</h2>
          {items.map((item) => (
            <div className="company-story" key={item.slug}>
              <h3>{local(item.name, locale)}</h3>
              <div>
                <p className="preserve-lines">{local(item.body, locale)}</p>
              </div>
            </div>
          ))}
          <h2 style={{marginTop: 55}}>
            {tr(
              locale,
              'From specification to supply',
              'من المواصفات إلى التوريد',
              'От требований до поставки',
              'De la especificación al suministro',
            )}
          </h2>
          <ServicePrinciples locale={locale} />
          <div className="factory-photo-grid">
            {photos.slice(0, 4).map((p) => (
              <figure key={p.slug}>
                <Image src={p.image} alt={local(p.name, locale)} width={900} height={600} />
                <figcaption>
                  <h3>{local(p.name, locale)}</h3>
                  <p>{local(p.body, locale)}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <CtaStrip locale={locale} />
        </div>
      </section>
    </InnerPage>
  );
}
