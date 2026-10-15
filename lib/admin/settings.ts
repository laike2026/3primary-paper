import 'server-only';
import {db} from './db';
import {site} from '@/lib/site';

export type PublicContact={whatsapp:string;phone:string;address:string;mapUrl:string};
export async function publicContact():Promise<PublicContact>{
  const fallback={whatsapp:site.whatsapp,phone:site.phone,address:'',mapUrl:''};
  if(!process.env.DATABASE_URL)return fallback;
  const rows=await db().query("SELECT value FROM site_settings WHERE key='public_contact' LIMIT 1");
  return {...fallback,...(rows[0]?.value as Partial<PublicContact>||{})};
}
