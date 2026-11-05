import Image from 'next/image';
import {notFound} from 'next/navigation';
import {PageHero} from '@/components/PageHero';
import {InnerPage, CtaStrip, ArticleCards} from '@/components/Interior';
import {publishedArticles} from '@/lib/admin/content';
import {local} from '@/lib/content';
import {pageMetadata} from '@/lib/seo';
import {site} from '@/lib/site';
import {ui} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
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
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: local(a.title, locale),
    description: local(a.intro, locale),
    author: {'@type': 'Organization', name: site.company},
    publisher: {'@type': 'Organization', name: site.company},
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
          <Image
            className="article-cover"
            src={a.image || '/images/materials/product-04-1.webp'}
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
