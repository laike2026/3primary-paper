import Image from 'next/image';
import Link from 'next/link';
import {PageHero} from '@/components/PageHero';
import {InnerPage, CtaStrip, CustomOptions} from '@/components/Interior';
import {CategoryCard} from '@/components/CategoryCard';
import {publishedCategories} from '@/lib/admin/content';
import {site} from '@/lib/site';
import {pageMetadata} from '@/lib/seo';
import {ui, tr} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(locale, '/brands', '3PRIMARY', site.company);
}
export default async function Brands({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const categories = await publishedCategories();
  return (
    <InnerPage className="brand-page">
      <PageHero
        locale={locale}
        path="/brands"
        title={tr(
          locale,
          'Paper, with a clear identity.',
          'ورق بهوية واضحة.',
          'Бумага с собственным характером.',
          'Papel con identidad propia.',
        )}
        intro={site.company}
        image={site.logo}
        imageAlt="3PRIMARY"
      />
      <section className="inner-content">
        <div className="container">
          <Image
            className="brand-product-photo"
            src="/images/materials/product-04-1.webp"
            alt={ui(locale, 'products')}
            width={1400}
            height={700}
          />
          <div className="company-story">
            <h2>3PRIMARY</h2>
            <div>
              <p>{ui(locale, 'aboutTitle')}</p>
              <Link className="text-link" href={'/' + locale + '/about'}>
                {ui(locale, 'view')}
              </Link>
            </div>
          </div>
          <h2 style={{marginTop: 60}}>{ui(locale, 'families')}</h2>
          <div className="page-card-grid">
            {categories.slice(0, 3).map((c) => (
              <CategoryCard category={c} locale={locale} label={ui(locale, 'view')} key={c.slug} />
            ))}
          </div>
          <h2 style={{marginTop: 60}}>
            {tr(
              locale,
              'Your brand, your specification',
              'علامتك ومواصفاتك',
              'Ваш бренд и ваши требования',
              'Su marca, sus especificaciones',
            )}
          </h2>
          <CustomOptions locale={locale} />
          <CtaStrip locale={locale} href={'/' + locale + '/oem-odm'} title={ui(locale, 'customization')} />
        </div>
      </section>
    </InnerPage>
  );
}
