import Image from 'next/image';
import Link from 'next/link';
import {FileText, Question, ArrowRight} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {InnerPage, CtaStrip, ArticleCards} from '@/components/Interior';
import {DownloadCards, FaqList} from '@/components/WebsiteBlocks';
import {publishedWebsite} from '@/lib/admin/website';
import {publishedArticles} from '@/lib/admin/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {ui, tr} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(locale, '/resources', copy[locale].resourcesTitle, copy[locale].resourcesIntro);
}
export default async function Resources({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const [downloads, faqs, articles] = await Promise.all([
    publishedWebsite('download'),
    publishedWebsite('faq'),
    publishedArticles(),
  ]);
  return (
    <InnerPage>
      <PageHero
        locale={locale}
        path="/resources"
        title={tr(
          locale,
          'Resources for better paper sourcing',
          'موارد لاختيار وتوريد الورق',
          'Материалы для закупки бумаги',
          'Recursos para comprar mejor papel',
        )}
        intro={copy[locale].resourcesIntro}
        image="/images/editorial/rfq-checklist.webp"
      />
      <section className="inner-content">
        <div className="container">
          <div className="featured-guide">
            <Image
              src="/images/editorial/rfq-checklist.webp"
              alt={ui(locale, 'rfq')}
              width={1000}
              height={700}
            />
            <div>
              <span className="eyebrow">{ui(locale, 'resources')}</span>
              <h2>{ui(locale, 'rfq')}</h2>
              <p>{copy[locale].oemIntro}</p>
              <Link className="button" href={'/' + locale + '/resources/rfq-checklist'}>
                {ui(locale, 'view')}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <DownloadCards items={downloads} locale={locale} />
          <div className="resource-links">
            <Link href={'/' + locale + '/blog'}>
              <FileText size={32} weight="light" />
              <span>{ui(locale, 'guides')}</span>
              <ArrowRight size={20} />
            </Link>
            <Link href={'/' + locale + '/faq'}>
              <Question size={32} weight="light" />
              <span>{copy[locale].faqTitle}</span>
              <ArrowRight size={20} />
            </Link>
          </div>
          {articles.length > 0 && (
            <>
              <h2>{ui(locale, 'guides')}</h2>
              <ArticleCards articles={articles.slice(0, 3)} locale={locale} />
            </>
          )}
          {faqs.length > 0 && (
            <section style={{paddingTop: 60}}>
              <h2>{copy[locale].faqTitle}</h2>
              <FaqList items={faqs.slice(0, 4)} locale={locale} />
            </section>
          )}
          <CtaStrip locale={locale} />
        </div>
      </section>
    </InnerPage>
  );
}
