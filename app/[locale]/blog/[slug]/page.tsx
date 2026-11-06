import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHero} from '@/components/PageHero';
import {InnerPage, CtaStrip, ArticleCards} from '@/components/Interior';
import {publishedArticles} from '@/lib/admin/content';
import {local} from '@/lib/content';
import {pageMetadata} from '@/lib/seo';
import {site} from '@/lib/site';
import {ui, tr} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  const a = (await publishedArticles()).find((a) => a.slug === slug);
  if (!a) notFound();
  return pageMetadata(
    locale,
    '/blog/' + slug,
    local(a.title, locale),
    local(a.intro, locale),
    a.image,
    a.seo,
  );
}
export default async function Article({params}: {params: Promise<{locale: Locale; slug: string}>}) {
  const {locale, slug} = await params;
  const articles = await publishedArticles();
  const a = articles.find((a) => a.slug === slug);
  if (!a) notFound();
  const author = a.author?.trim() || site.company;
  const authorIsOrganization = /3primary|three primary|team|company|团队|编辑部/i.test(author);
  const published = a.published_at && new Date(a.published_at).toISOString();
  const modified = a.updated_at && new Date(a.updated_at).toISOString();
  const displayDate = new Intl.DateTimeFormat(locale, {dateStyle: 'long', timeZone: 'UTC'});
  const image = a.image || '/images/materials/product-04-1.webp';
  const relatedPath = slug === 'paper-rfq-checklist' ? '/resources/rfq-checklist' : '/products/thermal-paper-rolls';
  const relatedLabel = slug === 'paper-rfq-checklist' ? ui(locale, 'rfq') : tr(locale,
    'Compare thermal paper rolls', 'قارن لفائف الورق الحراري', 'Сравнить терморулоны', 'Comparar rollos de papel térmico');
  const sourcingGuide = ['choose-pos-paper', 'measure-thermal-roll', 'paper-rfq-checklist'].includes(slug);
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: local(a.title, locale),
    description: local(a.intro, locale),
    inLanguage: locale,
    image: new URL(image, site.origin).href,
    datePublished: published,
    dateModified: modified,
    author: {'@type': authorIsOrganization ? 'Organization' : 'Person', name: author},
    publisher: {'@type': 'Organization', name: site.company, url: site.origin},
    mainEntityOfPage: new URL('/' + locale + '/blog/' + slug, site.origin).toString(),
  };
  return (
    <InnerPage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(json).replace(/</g, '\\u003c')}}
      />
      <PageHero
        locale={locale}
        path={'/blog/' + slug}
        parent={{label: ui(locale, 'guides'), href: '/blog'}}
        eyebrow={ui(locale, 'guides')}
        title={local(a.title, locale)}
        intro={local(a.intro, locale)}
      />
      <article className="inner-content">
        <div className="container">
          <div className="article-byline">
            <bdi>{author}</bdi>
            {published && <span>{tr(locale, 'Published', 'نُشر', 'Опубликовано', 'Publicado')} <time dateTime={published}>{displayDate.format(new Date(published))}</time></span>}
            {modified && modified.slice(0, 10) !== published?.slice(0, 10) &&
              <span>{tr(locale, 'Updated', 'حُدّث', 'Обновлено', 'Actualizado')} <time dateTime={modified}>{displayDate.format(new Date(modified))}</time></span>}
          </div>
          <Image
            className="article-cover"
            src={image}
            alt=""
            width={1400}
            height={700}
          />
          <div className="document-layout">
            <nav className="document-toc">
              <h2>{ui(locale, 'contents')}</h2>
              {a.sections.map((s, i) => (
                <a key={i} href={'#section-' + i}>
                  {local(s.heading, locale)}
                </a>
              ))}
            </nav>
            <div className="reading-copy">
              {a.sections.map((s, i) => (
                <section key={i} id={'section-' + i}>
                  <h2>{local(s.heading, locale)}</h2>
                  <p>{local(s.body, locale)}</p>
                </section>
              ))}
              {sourcingGuide && <aside className="article-sourcing">
                <h2>{tr(locale, 'For your next order', 'لطلبك التالي', 'Для следующего заказа', 'Para su próximo pedido')}</h2>
                <ul>
                  <li><Link href={'/' + locale + relatedPath}>{relatedLabel}</Link></li>
                  <li><Link href={'/' + locale + '/contact#inquiry'}>{ui(locale, 'quote')}</Link></li>
                </ul>
              </aside>}
              <CtaStrip locale={locale} />
            </div>
          </div>
          {articles.length > 1 && (
            <section style={{paddingTop: 50}}>
              <h2>{ui(locale, 'guides')}</h2>
              <ArticleCards articles={articles.filter((x) => x.slug !== slug).slice(0, 3)} locale={locale} />
            </section>
          )}
        </div>
      </article>
    </InnerPage>
  );
}
