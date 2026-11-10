import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const image = async path => 'data:image/png;base64,' + (await sharp(await readFile(new URL('public' + path, root))).resize(460,460,{fit:'contain',background:'#fff'}).png().toBuffer()).toString('base64');
const products = JSON.parse(await readFile(new URL('data/material-products.json', root), 'utf8'));
const byId = id => products.find(product => product.id === id);
const tiles = [
  ['Thermal paper', byId('TP-8080').image],
  ['Self-adhesive labels', byId('LB-THERMAL').image],
  ['Carbonless NCR paper', '/images/products/carbonless-1.webp'],
  ['Jumbo rolls', byId('TP-JUMBO').image]
];
const logo = 'data:image/svg+xml;base64,' + (await readFile(new URL('public/images/brand/primary-wordmark-20261110.svg', root))).toString('base64');
const panels = await Promise.all(tiles.map(async ([title,path],i) => {
  const x = 52 + i * 280;
  return `<rect x="${x}" y="278" width="256" height="344" rx="7" fill="white"/><image href="${await image(path)}" x="${x+8}" y="292" width="240" height="268"/><text x="${x+12}" y="598" fill="#203d30" font-family="Arial,sans-serif" font-size="19" font-weight="bold">${title}</text>`;
}));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="780" viewBox="0 0 1200 780"><rect width="1200" height="780" fill="#f8f6ef"/><image href="${logo}" x="56" y="40" width="210" height="64"/><text x="1146" y="78" text-anchor="end" fill="#647268" font-family="Arial,sans-serif" font-size="18">NOVEMBER 2026</text><path d="M56 128H1146" stroke="#b79b5c"/><text x="56" y="204" font-family="Georgia,serif" font-size="49" fill="#203d30">Paper &amp; Label Product Collection</text><text x="58" y="242" font-family="Arial,sans-serif" font-size="20" fill="#647268">Product formats, customization and purchasing information</text>${panels.join('')}<path d="M56 672H1146" stroke="#b79b5c"/><text x="58" y="722" font-family="Arial,sans-serif" font-size="19" fill="#203d30">alex.chen@3primary.com</text><text x="1146" y="722" text-anchor="end" font-family="Arial,sans-serif" font-size="19" fill="#203d30">tpc-paper.com</text></svg>`;
await sharp(Buffer.from(svg)).webp({quality:90,effort:6}).toFile(fileURLToPath(new URL('public/images/materials/catalog-cover-20261110.webp', root)));
await writeFile(new URL('output/content-update-release-2026-11-10/download-cover.svg', root), svg);
console.log('Built four-product catalog download cover.');
