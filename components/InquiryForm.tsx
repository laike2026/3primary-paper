import type {Locale} from '@/i18n/routing';
import {local, type Product} from '@/lib/content';
import {publicContact} from '@/lib/admin/settings';
import {InquiryFormClient} from './InquiryFormClient';

export async function InquiryForm({locale, initialProduct, productOptions}: {
  locale: Locale; initialProduct?: string; productOptions: Product[];
}) {
  const {whatsapp} = await publicContact();
  return <InquiryFormClient locale={locale} initialProduct={initialProduct}
    productOptions={productOptions.map(({id, name}) => ({id, label:local(name, locale)}))} whatsapp={whatsapp}/>;
}
