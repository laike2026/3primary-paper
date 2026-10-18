import 'server-only';
import {createSign} from 'node:crypto';
import {db} from './db';
import {site} from '@/lib/site';

type ServiceAccount={client_email:string;private_key:string;token_uri?:string};
const cached=new Map<string,{token:string;expires:number}>();
function base64url(input:string|Buffer){return Buffer.from(input).toString('base64url');}
async function accessToken(scope='https://www.googleapis.com/auth/webmasters.readonly'){
  const previous=cached.get(scope);
  if(previous&&previous.expires>Date.now()+60000)return previous.token;
  if(!process.env.GOOGLE_SERVICE_ACCOUNT_JSON)throw new Error('Google service account is not configured');
  const account=JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
  const now=Math.floor(Date.now()/1000),uri=account.token_uri||'https://oauth2.googleapis.com/token';
  const head=base64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const body=base64url(JSON.stringify({iss:account.client_email,scope,aud:uri,iat:now,exp:now+3600}));
  const data=`${head}.${body}`;const signer=createSign('RSA-SHA256');signer.update(data);signer.end();
  const assertion=`${data}.${signer.sign(account.private_key).toString('base64url')}`;
  const response=await fetch(uri,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
  if(!response.ok)throw new Error(`Google OAuth ${response.status}`);
  const token=await response.json() as {access_token:string;expires_in:number};
  cached.set(scope,{token:token.access_token,expires:Date.now()+token.expires_in*1000});return token.access_token;
}
export async function submitSitemap(){
  const property=process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  if(!property)throw new Error('Search Console property is not configured');
  if(site.origin!=='https://tpc-paper.com')throw new Error('Production site URL is not configured');
  const sitemapUrl=new URL('/sitemap.xml',site.origin).toString();
  const [sitemapResponse,robotsResponse]=await Promise.all([
    fetch(sitemapUrl,{cache:'no-store'}),
    fetch(new URL('/robots.txt',site.origin),{cache:'no-store'})
  ]);
  if(!sitemapResponse.ok||!robotsResponse.ok)throw new Error('Public search files are unavailable');
  const [xml,robots]=await Promise.all([sitemapResponse.text(),robotsResponse.text()]);
  const urlCount=(xml.match(/<url>/g)||[]).length;
  if(!urlCount||/^Disallow:\s*\/\s*$/im.test(robots))throw new Error('Public search files are not ready');
  const token=await accessToken('https://www.googleapis.com/auth/webmasters');
  const endpoint=`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const response=await fetch(endpoint,{method:'PUT',headers:{authorization:`Bearer ${token}`}});
  if(!response.ok)throw new Error(`Search Console sitemap submission ${response.status}`);
  return {urlCount,sitemapUrl,submittedAt:new Date().toISOString()};
}
type GscRow={keys:string[];clicks:number;impressions:number;ctr:number;position:number};
export async function syncSearchConsoleDay(day:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Invalid GSC day');
  const site=process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;if(!site)throw new Error('Search Console property is not configured');
  const token=await accessToken();const sql=db();let startRow=0,total=0;
  for(let page=0;page<20;page++){
    const response=await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({startDate:day,endDate:day,dimensions:['date','page','query','country','device'],rowLimit:25000,startRow,dataState:'final'})});
    if(!response.ok)throw new Error(`Search Console query ${response.status}: ${(await response.text()).slice(0,200)}`);
    const body=await response.json() as {rows?:GscRow[]};const rows=body.rows||[];
    for(const row of rows){
      const [,pageUrl,query,country,device]=row.keys;
      await sql.query(`INSERT INTO search_console_daily(day,site_url,page_url,query,country,device,clicks,impressions,ctr,position,synced_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now()) ON CONFLICT(day,site_url,page_url,query,country,device)
        DO UPDATE SET clicks=excluded.clicks,impressions=excluded.impressions,ctr=excluded.ctr,position=excluded.position,synced_at=now()`,
        [day,site,pageUrl||'',query||'',country||'',device||'',row.clicks,row.impressions,row.ctr,row.position]);
    }
    total+=rows.length;if(rows.length<25000)break;startRow+=rows.length;
  }
  return total;
}
