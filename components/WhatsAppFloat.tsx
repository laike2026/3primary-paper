import {publicContact} from '@/lib/admin/settings';
import {WhatsAppMark} from '@/components/SocialLinks';
import {WhatsAppPosition} from '@/components/WhatsAppPosition';
import {ui} from '@/lib/interior-copy';
import type {Locale} from '@/i18n/routing';

export async function WhatsAppFloat({locale}: {locale: Locale}) {
  const contact = await publicContact();
  return (
    <WhatsAppPosition href={contact.whatsapp} label={ui(locale, 'askWhatsApp')}>
      <WhatsAppMark size={54} />
    </WhatsAppPosition>
  );
}
