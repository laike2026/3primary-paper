import {WhatsappLogo} from '@phosphor-icons/react/dist/ssr';
import {publicContact} from '@/lib/admin/settings';
export async function WhatsAppFloat() {const contact=await publicContact();return <a className="whatsapp-float" href={contact.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Contact 3PRIMARY on WhatsApp"><WhatsappLogo size={27} weight="fill"/></a>;}
