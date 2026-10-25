import 'server-only';
import {db} from './db';
import {site} from '@/lib/site';

export type PublicContact={whatsapp:string;phone:string;address:string;mapUrl:string};
export async function publicContact():Promise<PublicContact>{
  const fallback={whatsapp:site.whatsapp,phone:site.phone,address:site.address,mapUrl:site.mapUrl};
  if(!process.env.DATABASE_URL)return fallback;
  const rows=await db().query("SELECT value FROM site_settings WHERE key='public_contact' LIMIT 1");
  const saved=(rows[0]?.value as Partial<PublicContact>||{});
  const hasSavedLocation=Boolean(saved.address&&saved.mapUrl);
  return {
    whatsapp:saved.whatsapp||fallback.whatsapp,
    phone:saved.phone||fallback.phone,
    address:hasSavedLocation?saved.address!:fallback.address,
    mapUrl:hasSavedLocation?saved.mapUrl!:fallback.mapUrl
  };
}
