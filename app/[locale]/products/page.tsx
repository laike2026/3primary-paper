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
  searchParams,
}: {
  params: Promise<{locale: Locale}>;
  searchParams: Promise<{search?: string}>;
}) {
  const {locale} = await params;
  const {search = ''} = await searchParams;
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
        <CategoryNav categories={categories} locale={locale} />
        <ProductCatalog
          locale={locale}
          initialSearch={search}
          label={ui(locale, 'view')}
          all={ui(locale, 'all')}
          empty={ui(locale, 'noResults')}
          categories={categories}
          products={products}
        />
        <CtaStrip locale={locale} />
      </div>
    </InnerPage>
  );
}
