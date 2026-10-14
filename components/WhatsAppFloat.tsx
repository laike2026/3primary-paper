import {WhatsappLogo} from '@phosphor-icons/react/dist/ssr';
import {site} from '@/lib/site';
export function WhatsAppFloat() {return <a className="whatsapp-float" href={site.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Contact 3PRIMARY on WhatsApp"><WhatsappLogo size={27} weight="fill"/></a>;}
