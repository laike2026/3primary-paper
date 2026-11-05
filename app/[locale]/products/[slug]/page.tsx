import {productVisual} from '@/lib/product-visual';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHero} from '@/components/PageHero';
import {ProductCard} from '@/components/ProductCard';
import {InnerPage, CategoryNav, CtaStrip, CustomOptions, Dimensions} from '@/components/Interior';
import {publishedCategories, publishedProducts} from '@/lib/admin/content';
import {categories, local} from '@/lib/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {ui, tr} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export function generateStaticParams() {
  return categories.map((c) => ({slug: c.slug}));
}
export async function generateMetadata({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  const c = (await publishedCategories()).find((c) => c.slug === slug);
  if (!c) notFound();
  return pageMetadata(
    locale,
    '/products/' + slug,
    local(c.name, locale),
    local(c.summary, locale),
    c.image,
    c.seo,
  );
}
export default async function Category({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  const [categories, products] = await Promise.all([publishedCategories(), publishedProducts()]);
  const c = categories.find((c) => c.slug === slug);
  if (!c) notFound();
  const items = products.filter((p) => p.category === slug);
  return (
    <InnerPage>
      <PageHero
        locale={locale}
        path={'/products/' + slug}
        parent={{label: ui(locale, 'products'), href: '/products'}}
        title={local(c.name, locale)}
        intro={local(c.summary, locale)}
        image={productVisual(c.image)}
        imageAlt={local(c.name, locale)}
      />
      <div className="container">
        <CategoryNav categories={categories} locale={locale} />
      </div>
      <section className="inner-content">
        <div className="container">
          <h2>
            {tr(
              locale,
              'Choose your paper format',
              'اختر صيغة الورق',
              'Выберите формат бумаги',
              'Elija su formato de papel',
            )}
          </h2>
          {c.description && local(c.description, locale) && (
            <p className="section-intro">{local(c.description, locale)}</p>
          )}
          <div className="page-card-grid">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} label={ui(locale, 'view')} />
            ))}
          </div>
          {items.length > 0 && (
            <section className="category-comparison">
              <h2>
                {tr(
                  locale,
                  'Selection at a glance',
                  'نظرة على الخيارات',
                  'Сравнение вариантов',
                  'Opciones de un vistazo',
                )}
              </h2>
              <div className="comparison-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{ui(locale, 'products')}</th>
                      <th>{ui(locale, 'dimensions')}</th>
                      <th>{ui(locale, 'application')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id}>
                        <th scope="row">
                          <Link href={'/' + locale + '/product/' + p.slug}>{local(p.name, locale)}</Link>
                        </th>
                        <td>{p.size || ui(locale, 'onRequest')}</td>
                        <td>{local(p.application, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          <h2 style={{marginTop: 60}}>{copy[locale].customizationTitle}</h2>
          <p className="section-intro">{copy[locale].customizationBody}</p>
          <CustomOptions locale={locale} />
          {slug.includes('thermal') && (
            <div className="specification-layout">
              <div>
                <h2>{ui(locale, 'dimensions')}</h2>
                <p>{copy[locale].oemIntro}</p>
              </div>
              <Dimensions locale={locale} />
            </div>
          )}
          <CtaStrip locale={locale} />
        </div>
      </section>
    </InnerPage>
  );
}
