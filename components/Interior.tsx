import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowsHorizontal,
  Circle,
  Package,
  Printer,
  Ruler,
  Cylinder,
  Tag,
  Files,
  Palette,
  Stack,
  ChatCircle,
  ClipboardText,
  CheckCircle,
  Truck,
} from '@phosphor-icons/react/dist/ssr';
import type {ReactNode} from 'react';
import type {Locale} from '@/i18n/routing';
import {local, type Category} from '@/lib/content';
import type {Article} from '@/lib/articles';
import {tr, ui} from '@/lib/interior-copy';
export function InnerPage({children, className = ''}: {children: ReactNode; className?: string}) {
  return <div className={'interior-page ' + className}>{children}</div>;
}
export function CategoryIcon({slug, size = 36}: {slug: string; size?: number}) {
  const Icon = slug.includes('label')
    ? Tag
    : slug.includes('carbonless')
      ? Files
      : slug.includes('color')
        ? Palette
        : slug.includes('printed')
          ? Printer
          : Cylinder;
  return <Icon size={size} weight="light" aria-hidden="true" />;
}
export function CategoryNav({categories, locale}: {categories: Category[]; locale: Locale}) {
  return (
    <nav className="category-ribbon" aria-label={ui(locale, 'families')}>
      {categories.map((c) => (
        <Link key={c.slug} href={'/' + locale + '/products/' + c.slug}>
          <CategoryIcon slug={c.slug} />
          <span>{local(c.name, locale)}</span>
        </Link>
      ))}
    </nav>
  );
}
export function CtaStrip({
  locale,
  title,
  body,
  href,
  label,
}: {
  locale: Locale;
  title?: string;
  body?: string;
  href?: string;
  label?: string;
}) {
  return (
    <aside className="design-cta">
      <div>
        <h2>{title || ui(locale, 'choose')}</h2>
        <p>{body || ui(locale, 'chooseBody')}</p>
      </div>
      <Link href={href || '/' + locale + '/contact#inquiry'} className="button">
        {label || ui(locale, 'quote')}
        <ArrowRight size={18} />
      </Link>
    </aside>
  );
}
export function Dimensions({locale}: {locale: Locale}) {
  return (
    <figure className="roll-dimensions">
      <Image
        src="/images/editorial/roll-dimensions.webp"
        alt={ui(locale, 'dimensions')}
        width={1500}
        height={650}
        sizes="(max-width:700px) 100vw, 55vw"
      />
      <figcaption>
        {[ui(locale, 'width'), ui(locale, 'diameter'), ui(locale, 'core')].map((x, i) => (
          <span key={x}>
            {i === 0 ? <ArrowsHorizontal size={22} /> : <Circle size={22} />}
            <strong>{x}</strong>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
export function CustomOptions({locale}: {locale: Locale}) {
  const icons = [Ruler, Printer, Circle, Package];
  return (
    <div className="design-icon-row">
      {(['rollSize', 'printing', 'core', 'packaging'] as const).map((key, i) => {
        const Icon = icons[i];
        return (
          <div key={key}>
            <Icon size={42} weight="light" />
            <h3>{ui(locale, key)}</h3>
            <p>{ui(locale, 'onRequest')}</p>
          </div>
        );
      })}
    </div>
  );
}
export function SupplySteps({locale}: {locale: Locale}) {
  const body = [
    tr(
      locale,
      'Tell us your application and target specification.',
      'أخبرنا بالاستخدام والمواصفات المطلوبة.',
      'Расскажите о задаче и нужных характеристиках.',
      'Indique el uso y las especificaciones.',
    ),
    tr(
      locale,
      'Review format, material, artwork and packing.',
      'راجع الصيغة والخامة والتصميم والتغليف.',
      'Уточните формат, материал, макет и упаковку.',
      'Revise formato, material, diseño y embalaje.',
    ),
    tr(
      locale,
      'Discuss samples and commercial terms for your project.',
      'ناقش العينات والشروط التجارية لمشروعك.',
      'Обсудите образцы и условия поставки.',
      'Comente muestras y condiciones comerciales.',
    ),
    tr(
      locale,
      'Confirm the order details and delivery plan.',
      'أكد تفاصيل الطلب وخطة التسليم.',
      'Подтвердите заказ и план доставки.',
      'Confirme el pedido y la entrega.',
    ),
  ];
  return (
    <ol className="design-steps">
      {(['requirements', 'review', 'sample', 'supply'] as const).map((key, i) => (
        <li key={key}>
          <span>{String(i + 1).padStart(2, '0')}</span>
          <h3>{ui(locale, key)}</h3>
          <p>{body[i]}</p>
        </li>
      ))}
    </ol>
  );
}
export function SourcingChecklist({locale}: {locale: Locale}) {
  const labels = [
    tr(
      locale,
      'Product and intended application',
      'المنتج والاستخدام المقصود',
      'Товар и его применение',
      'Producto y uso previsto',
    ),
    tr(
      locale,
      'Dimensions and printer model',
      'الأبعاد وطراز الطابعة',
      'Размеры и модель принтера',
      'Medidas y modelo de impresora',
    ),
    tr(
      locale,
      'Material, printing and packaging',
      'الخامة والطباعة والتغليف',
      'Материал, печать и упаковка',
      'Material, impresión y embalaje',
    ),
    tr(
      locale,
      'Estimated quantity and destination',
      'الكمية التقديرية والوجهة',
      'Объём и пункт назначения',
      'Cantidad estimada y destino',
    ),
  ];
  return (
    <div className="sourcing-list">
      <h2>{ui(locale, 'checklist')}</h2>
      <p>{ui(locale, 'chooseBody')}</p>
      <ul>
        {labels.map((x) => (
          <li key={x}>
            <CheckCircle size={22} weight="light" />
            {x}
          </li>
        ))}
      </ul>
      <a href={'/downloads/paper-rfq-checklist-' + locale + '.txt'} className="text-link" download>
        <ClipboardText size={18} />
        {ui(locale, 'download')}
      </a>
    </div>
  );
}
export function ArticleCards({articles, locale}: {articles: Article[]; locale: Locale}) {
  return (
    <div className="editorial-grid">
      {articles.map((a, i) => (
        <article key={a.slug}>
          <Link href={'/' + locale + '/blog/' + a.slug} className="editorial-image">
            <Image
              src={
                a.image ||
                [
                  '/images/editorial/retail-pos.webp',
                  '/images/materials/product-04-1.webp',
                  '/images/materials/product-08-1.webp',
                ][i % 3]
              }
              alt=""
              width={720}
              height={480}
            />
          </Link>
          <small>{ui(locale, 'guides')}</small>
          <h2>
            <Link href={'/' + locale + '/blog/' + a.slug}>{local(a.title, locale)}</Link>
          </h2>
          <p>{local(a.intro, locale)}</p>
          <Link href={'/' + locale + '/blog/' + a.slug} className="text-link">
            {ui(locale, 'read')}
            <ArrowRight size={18} />
          </Link>
        </article>
      ))}
    </div>
  );
}
export function ServicePrinciples({locale}: {locale: Locale}) {
  return (
    <div className="design-icon-row principles">
      {[Stack, Truck, ChatCircle].map((Icon, i) => (
        <div key={i}>
          <Icon size={44} weight="light" />
          <h3>{ui(locale, (['selection', 'coordination', 'communication'] as const)[i])}</h3>
          <p>
            {
              [
                tr(
                  locale,
                  'Paper formats for your application.',
                  'صيغ ورقية لاستخدامك.',
                  'Форматы бумаги для вашей задачи.',
                  'Formatos de papel para su aplicación.',
                ),
                tr(
                  locale,
                  'Specifications, printing and order details.',
                  'المواصفات والطباعة وتفاصيل الطلب.',
                  'Характеристики, печать и детали заказа.',
                  'Especificaciones, impresión y pedido.',
                ),
                tr(
                  locale,
                  'A clear conversation about your requirements.',
                  'حوار واضح حول متطلباتك.',
                  'Предметное обсуждение требований.',
                  'Comunicación clara sobre sus requisitos.',
                ),
              ][i]
            }
          </p>
        </div>
      ))}
    </div>
  );
}
