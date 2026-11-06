import 'server-only';
import {publicCache} from './public-cache';
import {db} from './db';
import {site} from '@/lib/site';
import {telephoneHref} from '@/lib/contact';

export type PublicContact={whatsapp:string;phone:string;phoneHref:string;address:string;mapUrl:string};
export const publicContact=publicCache('contact','details',async ():Promise<PublicContact>=>{
  const fallback={whatsapp:site.whatsapp,phone:site.phone,phoneHref:telephoneHref(site.phone),address:site.address,mapUrl:site.mapUrl};
  if(!process.env.DATABASE_URL)return fallback;
  const rows=await db().query("SELECT value FROM site_settings WHERE key='public_contact' LIMIT 1");
  const saved=(rows[0]?.value as Partial<PublicContact>||{});
  // Replace the former county-only CMS entry with the company-confirmed street address.
  const hasSavedLocation=Boolean(saved.address&&saved.mapUrl&&saved.address!=='Anji County, Huzhou City, Zhejiang Province, China');
  const phoneHref=telephoneHref(saved.phone||'');
  return {
    whatsapp:saved.whatsapp||fallback.whatsapp,
    phone:phoneHref?saved.phone!.trim():fallback.phone,
    phoneHref:phoneHref||fallback.phoneHref,
    address:hasSavedLocation?saved.address!:fallback.address,
    mapUrl:hasSavedLocation?saved.mapUrl!:fallback.mapUrl
  };
});
