import {Envelope, Phone, MapPin} from '@phosphor-icons/react/dist/ssr';
import {PageHero} from '@/components/PageHero';
import {InnerPage, SupplySteps} from '@/components/Interior';
import {SocialLinks} from '@/components/SocialLinks';
import {InquiryForm} from '@/components/InquiryForm';
import {publishedProducts} from '@/lib/admin/content';
import {publicContact} from '@/lib/admin/settings';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {site} from '@/lib/site';
import {ui, tr} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';
export async function generateMetadata({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  return pageMetadata(locale, '/contact', ui(locale, 'contact'), copy[locale].contactIntro);
}
export default async function Contact({params}: {params: Promise<{locale: Locale}>}) {
  const {locale} = await params;
  const [products, contact] = await Promise.all([publishedProducts(), publicContact()]);
  return (
    <InnerPage>
      <PageHero
        locale={locale}
        path="/contact"
        title={tr(locale, 'Let’s talk paper.', 'لنتحدث عن الورق.', 'Обсудим бумагу.', 'Hablemos de papel.')}
        intro={copy[locale].contactIntro}
        image="/images/materials/product-04-1.webp"
      />
      <section className="inner-content">
        <div className="container">
          <div className="contact-layout">
            <div className="contact-information">
              <h2 dir="ltr">{site.company}</h2>
              <p>{copy[locale].aboutIntro}</p>
              <div className="contact-options">
                <a href={site.phoneHref}>
                  <Phone size={27} weight="light" />
                  <span dir="ltr">{contact.phone}</span>
                </a>
                <a href={'mailto:' + site.email}>
                  <Envelope size={27} weight="light" />
                  <span>{site.email}</span>
                </a>
                {contact.address && (
                  <a
                    href={contact.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track-event="address_click"
                    data-track-placement="contact"
                  >
                    <MapPin size={27} weight="light" />
                    <span dir="ltr">{contact.address}</span>
                  </a>
                )}
              </div>
              <SocialLinks whatsapp={contact.whatsapp} />
            </div>
            <div className="form-panel">
              <h2>{ui(locale, 'requirements')}</h2>
              <InquiryForm locale={locale} productOptions={products} />
            </div>
          </div>
          <h2 style={{marginTop: 65}}>{ui(locale, 'next')}</h2>
          <SupplySteps locale={locale} />
        </div>
      </section>
    </InnerPage>
  );
}
