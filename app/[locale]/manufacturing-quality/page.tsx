import Image from 'next/image';
import {Stack, Circle, ClipboardText, Package} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {InnerPage, CtaStrip, CustomOptions} from '@/components/Interior';
import {publishedWebsite} from '@/lib/admin/website';
import {local} from '@/lib/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {tr} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(
    locale,
    '/manufacturing-quality',
    copy[locale].manufacturingTitle,
    copy[locale].manufacturingIntro,
  );
}
export default async function Manufacturing({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const photos = await publishedWebsite('factory');
  const icons = [Stack, Circle, ClipboardText, Package];
  const names = [
    tr(locale, 'Material selection', 'اختيار الخامة', 'Подбор материала', 'Selección de material'),
    tr(locale, 'Converting', 'التحويل', 'Переработка', 'Conversión'),
    tr(locale, 'Order checks', 'فحص الطلب', 'Проверка заказа', 'Revisión del pedido'),
    tr(locale, 'Packing', 'التغليف', 'Упаковка', 'Embalaje'),
  ];
  return (
    <InnerPage className="manufacturing-page">
      <PageHero
        locale={locale}
        path="/manufacturing-quality"
        title={tr(
          locale,
          'From paper selection to finished rolls',
          'من اختيار الورق إلى اللفائف الجاهزة',
          'От подбора бумаги до готовых рулонов',
          'De la selección del papel al rollo terminado',
        )}
        intro={copy[locale].manufacturingIntro}
        image={photos[0]?.image || '/images/materials/factory-converting.webp'}
      />
      <div className="container">
        <div className="design-icon-row">
          {names.map((name, i) => {
            const Icon = icons[i];
            return (
              <div key={name}>
                <Icon size={44} weight="light" />
                <h3>{name}</h3>
              </div>
            );
          })}
        </div>
      </div>
      <section className="inner-content">
        <div className="container">
          <div className="factory-photo-grid">
            {photos.map((p) => (
              <figure key={p.slug}>
                <Image src={p.image} alt={local(p.name, locale)} width={960} height={640} />
                <figcaption>
                  <h3>{local(p.name, locale)}</h3>
                  <p>{local(p.body, locale)}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <h2 style={{marginTop: 60}}>
            {tr(
              locale,
              'What we confirm for your order',
              'ما نؤكده لطلبك',
              'Что мы согласуем для заказа',
              'Qué confirmamos para su pedido',
            )}
          </h2>
          <p>{copy[locale].customizationBody}</p>
          <CustomOptions locale={locale} />
          <CtaStrip locale={locale} />
        </div>
      </section>
    </InnerPage>
  );
}
