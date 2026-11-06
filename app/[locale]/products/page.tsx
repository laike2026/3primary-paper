import {PageHero} from '@/components/PageHero';
import {InnerPage, CategoryNav, CtaStrip} from '@/components/Interior';
import {ProductCatalog} from '@/components/ProductCatalog';
import {publishedCategories, publishedProducts} from '@/lib/admin/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {ui} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(locale, '/products', ui(locale, 'products'), copy[locale].productsIntro);
}
export default async function Products({
  params,
}: {
  params: Promise<{locale: Locale}>;
}) {
  const {locale} = await params;
  const [categories, products] = await Promise.all([publishedCategories(), publishedProducts()]);
  return (
    <InnerPage className="catalog-page">
      <PageHero
        locale={locale}
        path="/products"
        title={ui(locale, 'products')}
        intro={copy[locale].productsIntro}
      />
      <div className="container">
        <ProductCatalog
          locale={locale}
          label={ui(locale, 'view')}
          all={ui(locale, 'all')}
          empty={ui(locale, 'noResults')}
          categories={categories}
          products={products}
        />
        <CategoryNav categories={categories} locale={locale} />
        <CtaStrip locale={locale} />
      </div>
    </InnerPage>
  );
}
