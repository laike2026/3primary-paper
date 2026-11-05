import Link from 'next/link';
import {PageHero} from '@/components/PageHero';
import {InnerPage, CustomOptions, Dimensions, SourcingChecklist, SupplySteps} from '@/components/Interior';
import {InquiryForm} from '@/components/InquiryForm';
import {publishedProducts} from '@/lib/admin/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {ui, tr} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(locale, '/oem-odm', copy[locale].oemTitle, copy[locale].oemIntro);
}
export default async function Oem({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const products = await publishedProducts();
  return (
    <InnerPage>
      <PageHero
        locale={locale}
        path="/oem-odm"
        title={tr(
          locale,
          'Your specification. Our paper expertise.',
          'مواصفاتك وخبرتنا في الورق.',
          'Ваши требования. Наш опыт.',
          'Sus especificaciones. Nuestra experiencia.',
        )}
        intro={copy[locale].oemBody}
        image="/images/sections/oem-paper-studio.webp"
      >
        <Link className="button" href="#custom-inquiry">
          {ui(locale, 'onRequest')}
        </Link>
      </PageHero>
      <div className="container">
        <CustomOptions locale={locale} />
      </div>
      <section className="inner-content">
        <div className="container">
          <div className="specification-layout">
            <div>
              <h2>{copy[locale].customizationTitle}</h2>
              <p>{copy[locale].customizationBody}</p>
              <p>{copy[locale].oemIntro}</p>
            </div>
            <Dimensions locale={locale} />
          </div>
          <h2 style={{marginTop: 65}}>
            {tr(
              locale,
              'A clear customization process',
              'خطوات تخصيص واضحة',
              'Понятный процесс заказа',
              'Un proceso claro de personalización',
            )}
          </h2>
          <SupplySteps locale={locale} />
          <div id="custom-inquiry" className="design-form-layout">
            <SourcingChecklist locale={locale} />
            <div>
              <h2>{ui(locale, 'quote')}</h2>
              <InquiryForm locale={locale} productOptions={products} />
            </div>
          </div>
        </div>
      </section>
    </InnerPage>
  );
}
