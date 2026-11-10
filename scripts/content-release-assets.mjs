import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root = new URL('../', import.meta.url);
const paths = [
  ['/images/materials/product-01-2-20261110.webp','image/webp',{en:'PRIMARY PAPER ROLLS carton and thermal receipt rolls',ar:'علبة PRIMARY PAPER ROLLS ولفائف ورق حراري',ru:'Коробка PRIMARY PAPER ROLLS и терморулоны',es:'Caja PRIMARY PAPER ROLLS y rollos térmicos'}],
  ['/images/materials/catalog-cover-20261110.webp','image/webp',{en:'Thermal paper, labels, carbonless paper and jumbo roll catalog',ar:'كتالوج الورق الحراري والملصقات وورق النسخ واللفائف الكبيرة',ru:'Каталог термобумаги, этикеток, самокопирующейся бумаги и больших рулонов',es:'Catálogo de papel térmico, etiquetas, papel autocopiativo y bobinas jumbo'}],
  ['/downloads/3primary-product-catalog-2026-11-10.pdf','application/pdf',{en:'3PRIMARY product catalog revised 10 November 2026',ar:'كتالوج منتجات 3PRIMARY - نوفمبر 2026',ru:'Каталог продукции 3PRIMARY - ноябрь 2026',es:'Catálogo de productos 3PRIMARY - noviembre de 2026'}],
  ...['primary-wordmark-20261110.svg','official-logo-hd-20261110.png','organization-logo-20261110.png'].map(name=>[
    '/images/brand/'+name,name.endsWith('.svg')?'image/svg+xml':'image/png',
    {en:'Primary Three Primary Colors Paper logo',ar:'شعار شركة 3PRIMARY للورق',ru:'Логотип компании 3PRIMARY',es:'Logotipo de 3PRIMARY'}])
];
const assets=[];
for (const [localPath,mimeType,alt] of paths) {
  const bytes=await readFile(new URL('public'+localPath,root));
  const metadata=mimeType.startsWith('image/')?await sharp(bytes).metadata():{};
  assets.push({localPath,mimeType,alt,byteSize:bytes.length,width:metadata.width||null,height:metadata.height||null,
    sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile(new URL('data/content-update-20261110-assets.json',root),JSON.stringify({releaseId:'approved-content-2026-11-10',assets},null,2)+'\n');
console.log(JSON.stringify(assets.map(({localPath,byteSize})=>({localPath,byteSize}))));
