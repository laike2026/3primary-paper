import {ShieldCheck, FileText} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {InnerPage} from '@/components/Interior';
import {ui} from '@/lib/interior-copy';
import {site} from '@/lib/site';
import type {Locale} from '@/i18n/routing';
export function LegalDocument({
  locale,
  path,
  title,
  intro,
  sections,
}: {
  locale: Locale;
  path: string;
  title: string;
  intro: string;
  sections: readonly (readonly [string, string])[];
}) {
  return (
    <InnerPage>
      <PageHero
        locale={locale}
        path={path}
        title={title}
        intro={intro}
        icon={
          path.includes('privacy') ? (
            <ShieldCheck size={78} weight="light" />
          ) : (
            <FileText size={78} weight="light" />
          )
        }
      />
      <section className="inner-content">
        <div className="container document-layout">
          <nav className="document-toc">
            <h2>{ui(locale, 'contents')}</h2>
            {sections.map(([heading], i) => (
              <a key={heading} href={'#policy-' + i}>
                {heading}
              </a>
            ))}
          </nav>
          <div className="reading-copy">
            {sections.map(([heading, body], i) => (
              <section id={'policy-' + i} key={heading}>
                <h2>{heading}</h2>
                <p>{body}</p>
              </section>
            ))}
            <a className="text-link" href={'mailto:' + site.email}>
              {site.email}
            </a>
          </div>
        </div>
      </section>
    </InnerPage>
  );
}
