import Image from 'next/image';
import {site} from '@/lib/site';
export function WhatsAppMark({size = 28}: {size?: number}) {
  return (
    <Image src="/images/social/whatsapp.svg" alt="" width={size} height={size} loading="eager" unoptimized />
  );
}
export function SocialLinks({whatsapp = site.whatsapp}: {whatsapp?: string}) {
  return (
    <div className="social-links">
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <WhatsAppMark />
      </a>
      {site.facebook ? (
        <a href={site.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <Image
            src="/images/social/facebook.svg"
            alt=""
            width={28}
            height={28}
            loading="eager"
            unoptimized
          />
        </a>
      ) : (
        <span className="social-unlinked" role="img" aria-label="Facebook">
          <Image
            src="/images/social/facebook.svg"
            alt=""
            width={28}
            height={28}
            loading="eager"
            unoptimized
          />
        </span>
      )}
    </div>
  );
}
