import {productVisual} from '@/lib/product-visual';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Ruler, Printer, Package, ArrowRight, FileText} from '@phosphor-icons/react/dist/ssr';
import {Breadcrumbs} from '@/components/PageHero';
import {ProductGallery} from '@/components/ProductGallery';
import {ProductCard} from '@/components/ProductCard';
import {InquiryForm} from '@/components/InquiryForm';
import {ProductQuestions} from '@/components/WebsiteBlocks';
import {InnerPage, CustomOptions, Dimensions, SourcingChecklist} from '@/components/Interior';
import {publishedCategories, publishedProducts} from '@/lib/admin/content';
import {publicContact} from '@/lib/admin/settings';
import {products, local} from '@/lib/content';
import {copy} from '@/lib/copy';
import {site} from '@/lib/site';
import {pageMetadata} from '@/lib/seo';
import {ui, tr} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export function generateStaticParams() {
  return products.map((p) => ({slug: p.slug}));
}
export async function generateMetadata({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  const p = (await publishedProducts()).find((p) => p.slug === slug);
  if (!p) notFound();
  return pageMetadata(
    locale,
    '/product/' + slug,
    local(p.name, locale),
    local(p.summary, locale),
    productVisual(p.image),
    p.seo,
  );
}
export default async function Product({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  const [items, categories, contact] = await Promise.all([
    publishedProducts(),
    publishedCategories(),
    publicContact(),
  ]);
  const p = items.find((p) => p.slug === slug);
  if (!p) notFound();
  const c = categories.find((c) => c.slug === p.category);
  if (!c) notFound();
  const related = items.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 3);
  const thermal = p.category.includes('thermal');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: local(p.name, locale),
    description: local(p.summary, locale),
    image: new URL(productVisual(p.image), site.origin).toString(),
    sku: p.id,
    brand: {'@type': 'Organization', name: site.company},
  };
  return (
    <InnerPage className="product-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')}}
      />
      <section className="product-intro">
        <div className="container">
          <Breadcrumbs
            locale={locale}
            path={'/product/' + slug}
            title={local(p.name, locale)}
            parent={{label: local(c.name, locale), href: '/products/' + c.slug}}
          />
          <div className="detail-grid">
            <ProductGallery
              key={p.id}
              images={[...new Set([productVisual(p.image), ...(p.gallery || [])])]}
              name={local(p.name, locale)}
            />
            <div className="detail-copy">
              <span className="eyebrow">
                {local(c.name, locale)} / {p.id}
              </span>
              <h1 className="product-heading">{local(p.name, locale)}</h1>
              <p>{local(p.summary, locale)}</p>
              <div className="product-quick-icons">
                <span>
                  <Ruler size={32} weight="light" />
                  {ui(locale, 'rollSize')}
                </span>
                <span>
                  <Printer size={32} weight="light" />
                  {ui(locale, 'printing')}
                </span>
                <span>
                  <Package size={32} weight="light" />
                  {ui(locale, 'packaging')}
                </span>
              </div>
              <table className="spec-table">
                <tbody>
                  <tr>
                    <th>{ui(locale, 'families')}</th>
                    <td>{local(c.name, locale)}</td>
                  </tr>
                  <tr>
                    <th>{ui(locale, 'application')}</th>
                    <td>{local(p.application, locale)}</td>
                  </tr>
                  {p.size && (
                    <tr>
                      <th>{ui(locale, 'size')}</th>
                      <td dir="ltr">{p.size}</td>
                    </tr>
                  )}
                  <tr>
                    <th>SKU</th>
                    <td dir="ltr">{p.id}</td>
                  </tr>
                </tbody>
              </table>
              <div className="detail-actions">
                <a className="button" href="#product-inquiry">
                  {ui(locale, 'quote')}
                  <ArrowRight size={18} />
                </a>
                <a className="text-link" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">
                  {ui(locale, 'askWhatsApp')}
                </a>
              </div>
            </div>
          </div>
          <nav className="product-anchors">
            {(['overview', 'specifications', 'applications', 'customization', 'inquiry'] as const).map(
              (k) => (
                <a key={k} href={'#' + (k === 'inquiry' ? 'product-inquiry' : k)}>
                  {ui(locale, k)}
                </a>
              ),
            )}
          </nav>
        </div>
      </section>
      <section id="overview" className="inner-content">
        <div className="container">
          <h2>{ui(locale, 'overview')}</h2>
          <p className="section-intro">
            {(p.details && local(p.details, locale)) || local(p.summary, locale)}
          </p>
          {Boolean(p.features?.length) && (
            <ul className="detail-feature-list">
              {p.features?.map((f, i) => (
                <li key={i}>{local(f, locale)}</li>
              ))}
            </ul>
          )}
          <div id="specifications" className="specification-layout">
            <div>
              <h2>{ui(locale, 'specifications')}</h2>
              <table className="spec-table">
                <tbody>
                  {p.specifications?.map((s, i) => (
                    <tr key={i}>
                      <th>{local(s.key, locale)}</th>
                      <td>{local(s.value, locale)}</td>
                    </tr>
                  ))}
                  {p.size && (
                    <tr>
                      <th>{ui(locale, 'size')}</th>
                      <td>{p.size}</td>
                    </tr>
                  )}
                  {p.moq && (
                    <tr>
                      <th>MOQ</th>
                      <td>{p.moq}</td>
                    </tr>
                  )}
                  {p.lead_time && (
                    <tr>
                      <th>{tr(locale, 'Lead time', 'مهلة التسليم', 'Срок поставки', 'Plazo de entrega')}</th>
                      <td>{p.lead_time}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p>{copy[locale].detailIntro}</p>
            </div>
            {thermal ? (
              <Dimensions locale={locale} />
            ) : (
              <Image
                src={p.gallery?.[1] || productVisual(p.image)}
                alt={local(p.name, locale)}
                width={720}
                height={540}
              />
            )}
          </div>
          {Boolean(p.documents?.length) && (
            <div className="resource-links">
              {p.documents?.map((url, i) => (
                <a href={url} key={url} target="_blank" rel="noopener noreferrer">
                  <FileText size={26} />
                  <span>
                    {ui(locale, 'documents')} {i + 1}
                  </span>
                  <ArrowRight size={18} />
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
      <section id="applications" className="section-shell">
        <div className="container product-use">
          <Image
            src={thermal ? '/images/editorial/retail-pos.webp' : productVisual(p.image)}
            alt={local(p.application, locale)}
            width={1000}
            height={700}
          />
          <div>
            <h2>{ui(locale, 'applications')}</h2>
            <p>{local(p.application, locale)}</p>
            <p>{copy[locale].applicationIntro}</p>
            <Link className="text-link" href={'/' + locale + '/applications'}>
              {ui(locale, 'applications')}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section id="customization" className="section-shell">
        <div className="container">
          <h2>{copy[locale].customizationTitle}</h2>
          <p>{copy[locale].customizationBody}</p>
          <CustomOptions locale={locale} />
        </div>
      </section>
      <section id="product-inquiry" data-product-id={p.id} className="section-shell">
        <div className="container design-form-layout">
          <SourcingChecklist locale={locale} />
          <div>
            <h2>{ui(locale, 'quote')}</h2>
            <InquiryForm locale={locale} initialProduct={p.id} productOptions={items} />
          </div>
        </div>
      </section>
      <ProductQuestions locale={locale} productId={p.id} />
      {related.length > 0 && (
        <section className="section-shell">
          <div className="container">
            <h2>{ui(locale, 'related')}</h2>
            <div className="page-card-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} label={ui(locale, 'view')} />
              ))}
            </div>
          </div>
        </section>
      )}
    </InnerPage>
  );
}
