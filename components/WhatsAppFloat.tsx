import {publicContact} from '@/lib/admin/settings';
import {WhatsAppMark} from '@/components/SocialLinks';
export async function WhatsAppFloat() {
  const contact = await publicContact();
  return (
    <a
      className="whatsapp-float"
      href={contact.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact 3PRIMARY on WhatsApp"
    >
      <WhatsAppMark size={54} />
    </a>
  );
}
