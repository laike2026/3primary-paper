import {PageHero} from '@/components/PageHero';
import {InnerPage, CtaStrip} from '@/components/Interior';
import {FaqBrowser} from '@/components/FaqBrowser';
import {publishedWebsite} from '@/lib/admin/website';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {tr, ui} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
const topics: Record<string, [string, string, string, string]> = {
  products: [
    'Products & specifications',
    'المنتجات والمواصفات',
    'Товары и характеристики',
    'Productos y especificaciones',
  ],
  customization: ['Customization', 'التخصيص', 'Индивидуальный заказ', 'Personalización'],
  samples: ['Samples', 'العينات', 'Образцы', 'Muestras'],
  ordering: ['Orders & quotations', 'الطلبات والأسعار', 'Заказы и цены', 'Pedidos y cotizaciones'],
  shipping: ['Packing & shipping', 'التغليف والشحن', 'Упаковка и доставка', 'Embalaje y envío'],
  support: ['Support', 'الدعم', 'Поддержка', 'Asistencia'],
};
export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(locale, '/faq', copy[locale].faqTitle, tr(locale,
    'Answers to common questions about roll sizes, samples, custom printing, packaging and shipping for wholesale paper orders.',
    'إجابات عن مقاسات اللفائف والعينات والطباعة المخصصة والتعبئة والشحن لطلبات الورق بالجملة.',
    'Ответы на вопросы о размерах рулонов, образцах, печати, упаковке и доставке при оптовых закупках бумаги.',
    'Respuestas sobre tamaños de rollo, muestras, impresión personalizada, embalaje y envío para pedidos de papel al por mayor.',
  ));
}
export default async function Faq({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const items = await publishedWebsite('faq');
  const groups = [...new Set(items.map((x) => x.topic))].map((id) => ({
    id,
    label: topics[id]?.[['en', 'ar', 'ru', 'es'].indexOf(locale)] || id,
  }));
  return (
    <InnerPage>
      <PageHero
        locale={locale}
        path="/faq"
        title={tr(
          locale,
          'Questions before you order?',
          'أسئلة قبل طلبك؟',
          'Вопросы перед заказом?',
          '¿Preguntas antes de comprar?',
        )}
        intro={copy[locale].oemIntro}
        image="/images/materials/product-04-1.webp"
      />
      <section className="inner-content">
        <div className="container">
          <FaqBrowser items={items} locale={locale} topics={groups} />
          <CtaStrip locale={locale} title={ui(locale, 'question')} label={ui(locale, 'contact')} />
        </div>
      </section>
    </InnerPage>
  );
}
