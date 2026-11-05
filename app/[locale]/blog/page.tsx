import Image from 'next/image';
import Link from 'next/link';
import {PageHero} from '@/components/PageHero';
import {InnerPage, CtaStrip, ArticleCards} from '@/components/Interior';
import {publishedArticles} from '@/lib/admin/content';
import {local} from '@/lib/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {tr, ui} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(locale, '/blog', ui(locale, 'guides'), copy[locale].blogIntro);
}
export default async function Blog({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const articles = await publishedArticles();
  const [first, ...rest] = articles;
  return (
    <InnerPage>
      <PageHero
        locale={locale}
        path="/blog"
        title={tr(
          locale,
          'Paper knowledge. Practical decisions.',
          'معرفة بالورق وقرارات عملية.',
          'Знания о бумаге. Практичные решения.',
          'Conocimiento del papel. Decisiones prácticas.',
        )}
        intro={copy[locale].blogIntro}
        image="/images/sections/oem-paper-studio.webp"
      />
      <section className="inner-content">
        <div className="container">
          {first && (
            <article className="featured-guide">
              <Image
                src={first.image || '/images/editorial/retail-pos.webp'}
                alt=""
                width={1000}
                height={700}
              />
              <div>
                <span className="eyebrow">{ui(locale, 'guides')}</span>
                <h2>{local(first.title, locale)}</h2>
                <p>{local(first.intro, locale)}</p>
                <Link className="text-link" href={'/' + locale + '/blog/' + first.slug}>
                  {ui(locale, 'read')}
                </Link>
              </div>
            </article>
          )}
          {rest.length > 0 && <ArticleCards articles={rest} locale={locale} />}
          <CtaStrip
            locale={locale}
            title={ui(locale, 'rfq')}
            body={copy[locale].oemIntro}
            href={'/' + locale + '/resources/rfq-checklist'}
            label={ui(locale, 'view')}
          />
          <CtaStrip locale={locale} />
        </div>
      </section>
    </InnerPage>
  );
}
