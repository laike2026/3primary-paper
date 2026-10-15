import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import sharp from 'sharp';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const brand = resolve(root, 'public/images/brand');
const logo = await readFile(resolve(brand, 'official-logo.jpg'));

// The source supplied by the company's legacy site is 166 x 50 px. This crop
// contains only its original blue globe/paper glyph, without the adjacent r.
const mark = await sharp(logo)
  .extract({left: 0, top: 3, width: 37, height: 40})
  .png()
  .toBuffer();

async function squareIcon(size) {
  const inset = Math.max(1, Math.round(size * 0.065));
  const inner = size - inset * 2;
  const glyph = await sharp(mark)
    .resize(inner, inner, {fit: 'contain', background: '#ffffff', kernel: 'lanczos3'})
    .png()
    .toBuffer();
  return sharp({create: {width: size, height: size, channels: 4, background: '#ffffff'}})
    .composite([{input: glyph, left: inset, top: inset}])
    .png({compressionLevel: 9})
    .toBuffer();
}

const iconSizes = [16, 32, 48, 64, 180, 192, 512];
const icons = new Map();
for (const size of iconSizes) {
  const data = await squareIcon(size);
  icons.set(size, data);
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  await writeFile(resolve(brand, name), data);
}

// ICO frames can contain PNG payloads. Each frame keeps the same official mark.
const frames = [16, 32, 48].map(size => ({size, data: icons.get(size)}));
const header = Buffer.alloc(6 + frames.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach(({size, data}, index) => {
  const at = 6 + index * 16;
  header.writeUInt8(size, at);
  header.writeUInt8(size, at + 1);
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(data.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += data.length;
});
await writeFile(resolve(root, 'public/favicon.ico'), Buffer.concat([header, ...frames.map(frame => frame.data)]));

const fullLogo = await sharp(logo).resize(500, 151, {kernel: 'lanczos3'}).png().toBuffer();
await sharp({create: {width: 600, height: 200, channels: 4, background: '#ffffff'}})
  .composite([{input: fullLogo, left: 50, top: 24}])
  .png({compressionLevel: 9})
  .toFile(resolve(brand, 'organization-logo.png'));

const overlay = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="wash"><stop offset="0" stop-color="#f8f5f0" stop-opacity=".98"/><stop offset=".43" stop-color="#f8f5f0" stop-opacity=".94"/><stop offset=".67" stop-color="#f8f5f0" stop-opacity="0"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#wash)"/>
  <rect x="58" y="42" width="192" height="66" rx="3" fill="#ffffff" fill-opacity=".94"/>
  <text x="68" y="181" fill="#49564e" font-family="Arial,sans-serif" font-size="16" letter-spacing="3">PAPER CONNECTS A BRIGHTER TOMORROW</text>
  <text x="66" y="277" fill="#1f2521" font-family="Georgia,serif" font-size="66">Reliable Paper</text>
  <text x="66" y="353" fill="#1f2521" font-family="Georgia,serif" font-size="66">for a Smarter World</text>
  <path d="M68 383h74" stroke="#bca06d" stroke-width="3"/>
  <text x="68" y="441" fill="#4e5650" font-family="Arial,sans-serif" font-size="22">Thermal paper · labels · carbonless paper</text>
  <text x="68" y="570" fill="#2b4533" font-family="Arial,sans-serif" font-size="20" font-weight="700">tpc-paper.com</text>
</svg>`);
const hero = resolve(root, 'public/images/sections/hero-paper-studio.webp');
await sharp(hero)
  .resize(1200, 630, {fit: 'cover', position: 'centre'})
  .composite([{input: overlay, left: 0, top: 0}, {input: logo, left: 70, top: 50}])
  .jpeg({quality: 88, mozjpeg: true})
  .toFile(resolve(brand, 'social-preview.jpg'));

console.log('Generated official-mark icons, favicon, organization logo and social preview.');
