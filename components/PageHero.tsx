import Link from 'next/link';
import Image from 'next/image';
import type {ReactNode} from 'react';
import type {Locale} from '@/i18n/routing';
import {breadcrumbJson} from '@/lib/seo';
type Props = {
  locale: Locale;
  path: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  parent?: {label: string; href: string};
  image?: string;
  imageAlt?: string;
  icon?: ReactNode;
  children?: ReactNode;
};
export function Breadcrumbs({
  locale,
  path,
  title,
  parent,
}: Pick<Props, 'locale' | 'path' | 'title' | 'parent'>) {
  const home = {en: 'Home', ar: 'الرئيسية', ru: 'Главная', es: 'Inicio'}[locale];
  const entries = [
    {name: home, path: ''},
    ...(parent ? [{name: parent.label, path: parent.href}] : []),
    {name: title, path},
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJson(locale, entries)).replace(/</g, '\\u003c'),
        }}
      />
      <nav className="breadcrumbs" aria-label={home}>
        <Link href={'/' + locale}>{home}</Link>
        <span aria-hidden="true">›</span>
        {parent && (
          <>
            <Link href={'/' + locale + parent.href}>{parent.label}</Link>
            <span aria-hidden="true">›</span>
          </>
        )}
        <span aria-current="page">{title}</span>
      </nav>
    </>
  );
}
export function PageHero({
  locale,
  path,
  eyebrow,
  title,
  intro,
  parent,
  image,
  imageAlt,
  icon,
  children,
}: Props) {
  return (
    <section className={'inner-hero design-hero' + (image ? ' has-image' : '') + (icon ? ' has-icon' : '')}>
      <div className="container">
        <Breadcrumbs locale={locale} path={path} title={title} parent={parent} />
        <div className="design-hero-grid">
          {icon && (
            <div className="design-hero-icon" aria-hidden="true">
              {icon}
            </div>
          )}
          <div className="design-hero-copy">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            {intro && <p>{intro}</p>}
            {children && <div className="detail-actions">{children}</div>}
          </div>
          {image && (
            <div className="design-hero-image">
              <Image
                src={image}
                alt={imageAlt || ''}
                width={1200}
                height={850}
                priority
                sizes="(max-width:700px) 100vw, 52vw"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
