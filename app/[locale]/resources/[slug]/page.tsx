import {notFound} from 'next/navigation';
import {Receipt, Printer, Ruler, Palette, Package, Truck} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {InnerPage, CtaStrip, Dimensions} from '@/components/Interior';
import {InquiryForm} from '@/components/InquiryForm';
import {publishedProducts} from '@/lib/admin/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {ui, tr} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export function generateStaticParams() {
  return [{slug: 'rfq-checklist'}];
}
export async function generateMetadata({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  if (slug !== 'rfq-checklist') notFound();
  return pageMetadata(locale, '/resources/rfq-checklist', ui(locale, 'rfq'), tr(locale,
    'Prepare a comparable paper RFQ with a checklist for dimensions, stock, print artwork, quantity, packing and shipping destination.',
    'جهّز طلب عرض سعر للورق يتضمن المقاسات والخامة والتصميم والكمية والتعبئة ووجهة الشحن.',
    'Подготовьте запрос цены на бумагу по списку: размеры, материал, макет печати, объём, упаковка и место доставки.',
    'Prepare una solicitud de cotización de papel con medidas, material, arte de impresión, cantidad, embalaje y destino.',
  ));
}
export default async function Checklist({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  if (slug !== 'rfq-checklist') notFound();
  const products = await publishedProducts();
  const labels = [
    tr(
      locale,
      'Product family and application',
      'فئة المنتج والاستخدام',
      'Вид товара и применение',
      'Familia de producto y uso',
    ),
    tr(
      locale,
      'Printer or device model',
      'طراز الطابعة أو الجهاز',
      'Модель принтера или устройства',
      'Modelo de impresora o equipo',
    ),
    tr(
      locale,
      'Width, outer diameter and core',
      'العرض والقطر الخارجي والقلب',
      'Ширина, наружный диаметр и втулка',
      'Ancho, diámetro exterior y núcleo',
    ),
    tr(
      locale,
      'Material, color, GSM or adhesive',
      'الخامة واللون والوزن أو اللاصق',
      'Материал, цвет, плотность или клей',
      'Material, color, gramaje o adhesivo',
    ),
    tr(
      locale,
      'Printing artwork and packaging',
      'تصميم الطباعة والتغليف',
      'Макет печати и упаковка',
      'Diseño impreso y embalaje',
    ),
    tr(
      locale,
      'Estimated quantity and destination',
      'الكمية التقديرية والوجهة',
      'Объём и пункт назначения',
      'Cantidad estimada y destino',
    ),
  ];
  const icons = [Receipt, Printer, Ruler, Palette, Package, Truck];
  return (
    <InnerPage>
      <PageHero
        locale={locale}
        path="/resources/rfq-checklist"
        parent={{label: ui(locale, 'resources'), href: '/resources'}}
        title={ui(locale, 'rfq')}
        intro={copy[locale].oemIntro}
        image="/images/editorial/rfq-checklist.webp"
      >
        <a className="button" href={'/downloads/paper-rfq-checklist-' + locale + '.txt'} download>
          {ui(locale, 'download')}
        </a>
      </PageHero>
      <section className="inner-content">
        <div className="container document-layout">
          <nav className="document-toc">
            <h2>{ui(locale, 'contents')}</h2>
            {labels.map((x, i) => (
              <a key={x} href={'#item-' + i}>
                {x}
              </a>
            ))}
          </nav>
          <div>
            {labels.map((x, i) => {
              const Icon = icons[i];
              return (
                <section id={'item-' + i} className="checklist-item" key={x}>
                  <div>
                    <span className="step-number">{String(i + 1).padStart(2, '0')}</span>
                    <Icon size={34} weight="light" />
                  </div>
                  <div>
                    <h2>{x}</h2>
                    <p>{ui(locale, 'requirements')}</p>
                    {i === 2 && <Dimensions locale={locale} />}
                  </div>
                </section>
              );
            })}
            <CtaStrip locale={locale} href="#rfq-inquiry" title={ui(locale, 'quote')} />
          </div>
        </div>
      </section>
      <section id="rfq-inquiry" className="section-shell">
        <div className="container design-form-layout">
          <div>
            <h2>{ui(locale, 'quote')}</h2>
            <p>{copy[locale].customizationBody}</p>
          </div>
          <InquiryForm locale={locale} productOptions={products} />
        </div>
      </section>
    </InnerPage>
  );
}
