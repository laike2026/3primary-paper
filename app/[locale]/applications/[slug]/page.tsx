import Image from 'next/image';
import {Receipt, Desktop, Package} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHero} from '@/components/PageHero';
import {ProductCard} from '@/components/ProductCard';
import {InnerPage, CtaStrip, Dimensions, SupplySteps, SourcingChecklist} from '@/components/Interior';
import {InquiryForm} from '@/components/InquiryForm';
import {publishedCategories, publishedProducts} from '@/lib/admin/content';
import {applications, local} from '@/lib/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {ui, tr} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export function generateStaticParams() {
  return applications.map((a) => ({slug: a.slug}));
}
export async function generateMetadata({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  const a = applications.find((a) => a.slug === slug);
  if (!a) notFound();
  return pageMetadata(locale, '/applications/' + slug, local(a.name, locale), local(a.summary, locale));
}
export default async function Application({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  const a = applications.find((a) => a.slug === slug);
  if (!a) notFound();
  const [categories, products] = await Promise.all([publishedCategories(), publishedProducts()]);
  const c = categories.find((c) => c.slug === a.category);
  const recommended = products.filter((p) => p.category === a.category).slice(0, 3);
  const thermal = a.category.includes('thermal');
  const image =
    slug === 'banking-atm'
      ? '/images/editorial/banking-atm.webp'
      : slug === 'logistics-warehousing'
        ? '/images/editorial/logistics.webp'
        : thermal
          ? '/images/editorial/retail-pos.webp'
          : c?.image || '/images/products/carbonless-2.webp';
  return (
    <InnerPage>
      <PageHero
        locale={locale}
        path={'/applications/' + slug}
        parent={{label: ui(locale, 'applications'), href: '/applications'}}
        title={local(a.name, locale)}
        intro={local(a.summary, locale)}
        image={image}
        imageAlt={local(a.name, locale)}
      >
        <a href="#suitable-products" className="button">
          {ui(locale, 'products')}
        </a>
      </PageHero>
      <div className="container">
        <div className="design-icon-row application-principles">
          {[Receipt, Desktop, Package].map((Icon, i) => (
            <div key={i}>
              <Icon size={40} weight="light" />
              <h3>
                {
                  [
                    tr(locale, 'Print clarity', 'وضوح الطباعة', 'Чёткость печати', 'Claridad de impresión'),
                    tr(locale, 'Device fit', 'توافق الجهاز', 'Совместимость с устройством', 'Compatibilidad'),
                    ui(locale, 'packaging'),
                  ][i]
                }
              </h3>
              <p>{ui(locale, 'onRequest')}</p>
            </div>
          ))}
        </div>
      </div>
      <section className="inner-content">
        <div className="container">
          <div className="specification-layout">
            <div>
              <h2>
                {tr(
                  locale,
                  'What to check before ordering',
                  'ما يجب مراجعته قبل الطلب',
                  'Что уточнить до заказа',
                  'Qué revisar antes del pedido',
                )}
              </h2>
              <p>{copy[locale].oemIntro}</p>
              <SourcingChecklist locale={locale} />
            </div>
            {thermal ? (
              <Dimensions locale={locale} />
            ) : (
              <Image src={c?.image || image} alt={local(a.name, locale)} width={700} height={600} />
            )}
          </div>
          <section id="suitable-products" style={{paddingTop: 70}}>
            <h2>{ui(locale, 'products')}</h2>
            <div className="page-card-grid">
              {recommended.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} label={ui(locale, 'view')} />
              ))}
            </div>
            {c && (
              <Link className="text-link" href={'/' + locale + '/products/' + c.slug}>
                {local(c.name, locale)}
              </Link>
            )}
          </section>
          <SupplySteps locale={locale} />
          <div className="design-form-layout">
            <CtaStrip locale={locale} />
            <InquiryForm locale={locale} productOptions={products} />
          </div>
        </div>
      </section>
    </InnerPage>
  );
}
