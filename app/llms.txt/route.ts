import {locales} from '@/i18n/routing';
import {isIndexingEnabled,site} from '@/lib/site';

const links = [
  ['Company', '/about'],
  ['Product families and specifications', '/products'],
  ['Applications', '/applications'],
  ['Manufacturing and quality', '/manufacturing-quality'],
  ['Sourcing guides', '/blog'],
  ['Paper RFQ checklist', '/resources/rfq-checklist'],
  ['Procurement FAQ', '/faq'],
  ['Contact and quote requests', '/contact'],
];

export function GET() {
  const type = {'Content-Type': 'text/plain; charset=utf-8'};
  if (!isIndexingEnabled) return new Response('Not found\n', {status: 404, headers: type});
  const text = [
    '# 3PRIMARY',
    '',
    '> Zhejiang Three Primary Colors Paper Co., Ltd. supplies thermal paper rolls, labels and carbonless NCR paper for business purchasing.',
    '',
    'For ordering, confirm the SKU, dimensions, material, quantity, packing and delivery destination with 3PRIMARY.',
    '',
    '## Public resources',
    ...links.map(([label, path]) => '- [' + label + '](' + new URL('/en' + path,site.origin).href + ')'),
    '',
    '## Languages',
    ...locales.map(locale => '- [' + locale + '](' + new URL('/' + locale,site.origin).href + ')'),
    '',
  ].join('\n');
  return new Response(text, {headers: {...type, 'Cache-Control': 'public, max-age=3600'}});
}
