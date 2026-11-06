import 'server-only';
import {createSign} from 'node:crypto';
import {db} from './db';
import {isCalendarDate} from './query-validation';
import {isIndexingEnabled, site} from '@/lib/site';

type ServiceAccount = {client_email: string; private_key: string};
const tokens = new Map<string, {value: string; expires: number}>();
const readonlyScope = 'https://www.googleapis.com/auth/webmasters.readonly';
const writeScope = 'https://www.googleapis.com/auth/webmasters';
const tokenUrl = 'https://oauth2.googleapis.com/token';
const productionOrigin = 'https://tpc-paper.com';

function property() {
  const value = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  if (value !== 'sc-domain:tpc-paper.com' && value !== productionOrigin && value !== productionOrigin + '/') {
    throw new Error('Search Console property is not configured for tpc-paper.com');
  }
  return value;
}

export function isSearchConsoleConfigured() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL);
}

async function accessToken(scope = readonlyScope) {
  const previous = tokens.get(scope);
  if (previous && previous.expires > Date.now() + 60_000) return previous.value;
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) throw new Error('Google service account is not configured');

  const account = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({alg: 'RS256', typ: 'JWT'});
  const claims = encode({iss: account.client_email, scope, aud: tokenUrl, iat: now, exp: now + 3600});
  const data = header + '.' + claims;
  const signature = createSign('RSA-SHA256').update(data).sign(account.private_key).toString('base64url');
  const response = await fetch(tokenUrl, {
    method: 'POST',
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: data + '.' + signature,
    }),
  });
  if (!response.ok) throw new Error('Google OAuth ' + response.status);
  const token = await response.json() as {access_token: string; expires_in: number};
  tokens.set(scope, {value: token.access_token, expires: Date.now() + token.expires_in * 1000});
  return token.access_token;
}

const propertyEndpoint = (value: string) =>
  'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(value);

async function googleRequest(url: string, token: string, operation: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
    headers: {authorization: 'Bearer ' + token, 'content-type': 'application/json'},
  });
  if (!response.ok) throw new Error(operation + ' HTTP ' + response.status);
  return response;
}

type SitemapReceipt = {
  path: string; lastSubmitted?: string; lastDownloaded?: string; isPending?: boolean;
  errors?: string | number; warnings?: string | number;
};
type IndexStatus = {
  verdict?: string; coverageState?: string; lastCrawlTime?: string; googleCanonical?: string;
  pageFetchState?: string;
};

export async function searchConsoleReceipt() {
  const siteUrl = property();
  const token = await accessToken();
  const endpoint = propertyEndpoint(siteUrl);
  const siteResponse = await googleRequest(endpoint, token, 'Search Console property');
  const {permissionLevel} = await siteResponse.json() as {permissionLevel?: string};
  const verified = ['siteOwner', 'siteFullUser', 'siteRestrictedUser'].includes(permissionLevel || '');
  if (!verified) return {checkedAt: new Date().toISOString(), siteUrl, permissionLevel, verified, sitemap: null, urls: []};

  const sitemapUrl = productionOrigin + '/sitemap.xml';
  const receipt = googleRequest(endpoint + '/sitemaps', token, 'Search Console sitemaps')
    .then(async (response) => {
      const {sitemap = []} = await response.json() as {sitemap?: SitemapReceipt[]};
      return sitemap.find((entry) => entry.path === sitemapUrl) || null;
    });
  const inspections = ['/en', '/en/products', '/en/product/80x80-thermal-paper-roll'].map(async (path) => {
    const url = productionOrigin + path;
    try {
      const response = await googleRequest('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
        token, 'Search Console URL Inspection', {
          method: 'POST',
          body: JSON.stringify({inspectionUrl: url, siteUrl, languageCode: 'en-US'}),
        });
      const {inspectionResult} = await response.json() as {inspectionResult?: {indexStatusResult?: IndexStatus}};
      return {url, index: inspectionResult?.indexStatusResult || null};
    } catch (error) {
      return {url, index: null, error: error instanceof Error ? error.message : 'URL Inspection failed'};
    }
  });
  const [sitemap, urls] = await Promise.all([receipt, Promise.all(inspections)]);
  return {checkedAt: new Date().toISOString(), siteUrl, permissionLevel, verified, sitemap, urls};
}

export async function submitSitemap() {
  if (!isIndexingEnabled || site.origin !== productionOrigin) throw new Error('Production indexing is disabled');
  const siteUrl = property();
  const sitemapUrl = new URL('/sitemap.xml', site.origin).toString();
  const options = {cache: 'no-store', signal: AbortSignal.timeout(8_000)} as const;
  const [sitemapResponse, robotsResponse] = await Promise.all([
    fetch(sitemapUrl, options),
    fetch(new URL('/robots.txt', site.origin), options),
  ]);
  if (!sitemapResponse.ok || !robotsResponse.ok) throw new Error('Public search files are unavailable');
  const [xml, robots] = await Promise.all([sitemapResponse.text(), robotsResponse.text()]);
  const urlCount = (xml.match(/<url>/g) || []).length;
  if (!urlCount || /^Disallow:\s*\/\s*$/im.test(robots)) throw new Error('Public search files are not ready');
  const token = await accessToken(writeScope);
  await googleRequest(propertyEndpoint(siteUrl) + '/sitemaps/' + encodeURIComponent(sitemapUrl),
    token, 'Search Console sitemap submission', {method: 'PUT'});
  return {urlCount, sitemapUrl, submittedAt: new Date().toISOString()};
}

type GscRow = {keys: string[]; clicks: number; impressions: number; ctr: number; position: number};

export async function syncSearchConsoleDay(day: string) {
  if (!isCalendarDate(day)) throw new Error('Invalid GSC day');
  const siteUrl = property();
  const token = await accessToken();
  const endpoint = propertyEndpoint(siteUrl) + '/searchAnalytics/query';
  const rowLimit = 25_000;
  async function query(dimensions: string[], startRow = 0) {
    const response = await googleRequest(endpoint, token, 'Search Console analytics', {
      method: 'POST',
      body: JSON.stringify({startDate: day, endDate: day, dimensions, rowLimit, startRow, dataState: 'final'}),
    });
    return (await response.json() as {rows?: GscRow[]}).rows || [];
  }

  const detail = ['date', 'page', 'query', 'country', 'device'];
  const [[summary], firstPage] = await Promise.all([query(['date']), query(detail)]);
  const details = firstPage.length < rowLimit ? firstPage : [...firstPage, ...await query(detail, rowLimit)];
  const unique = new Map<string, GscRow>();
  for (const row of details) unique.set(JSON.stringify(row.keys), row);
  const totals = summary || {clicks: 0, impressions: 0, ctr: 0, position: 0};
  const rows = [{...totals, keys: [day, '', '', '', '']}, ...unique.values()];

  const sql = db();
  const operations = [
    sql.query('SELECT pg_advisory_xact_lock(hashtext($1))', [siteUrl + '/' + day]),
    sql.query('DELETE FROM search_console_daily WHERE day=$1 AND site_url=$2', [day, siteUrl]),
  ];
  for (let offset = 0; offset < rows.length; offset += 1000) {
    operations.push(sql.query(
      `INSERT INTO search_console_daily(day,site_url,page_url,query,country,device,clicks,impressions,ctr,position)
        SELECT $1,$2,coalesce(keys->>1,''),coalesce(keys->>2,''),coalesce(keys->>3,''),coalesce(keys->>4,''),
          clicks,impressions,ctr,position
        FROM jsonb_to_recordset($3::jsonb) AS r(keys jsonb,clicks integer,impressions integer,ctr double precision,position double precision)`,
      [day, siteUrl, JSON.stringify(rows.slice(offset, offset + 1000))],
    ));
  }
  await sql.transaction(operations);
  return unique.size;
}
