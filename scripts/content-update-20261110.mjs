export const releaseId = 'approved-content-2026-11-10';
export const locales = ['en', 'ar', 'ru', 'es'];
export const grammage = '35 / 40 / 45 / 48 / 55 / 60 / 65 / 70 / 75 / 80 gsm';
export const jumboWidths = '405 / 565 / 636 / 790 / 795 mm';
export const thermalIds = ['TP-8080', 'TP-5740', 'PP-ATM', 'TP-PRINTED', 'TP-JUMBO'];
export const catalogPath = '/downloads/3primary-product-catalog-2026-11-10.pdf';
export const packagingPath = '/images/materials/product-01-2-20261110.webp';
export const coverPath = '/images/materials/catalog-cover-20261110.webp';
export const customSizeCopy = {
  en: 'Custom sizes available', ar: 'مقاسات مخصصة متاحة',
  ru: 'Доступны размеры на заказ', es: 'Medidas personalizadas disponibles'
};
export const standardSizes = {
  'TP-8080': '80 × 80 mm / 80 × 70 mm',
  'TP-5740': '57 × 50 mm / 57 × 40 mm / 57 × 30 mm'
};

export function replacement(value, assets = {}) {
  if (typeof value !== 'string') return value;
  let pathname;
  try { pathname = new URL(value, 'https://tpc-paper.com').pathname; } catch { return value; }
  if (pathname.endsWith('/product-01-2.webp')) return assets[packagingPath] || packagingPath;
  if (pathname.endsWith('/3primary-product-catalog-2026-11.pdf')) return catalogPath;
  return value;
}

export function replaceReferences(value, assets = {}) {
  if (typeof value === 'string') return replacement(value, assets);
  if (Array.isArray(value)) return value.map(item => replaceReferences(item, assets));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceReferences(item, assets)]));
  return value;
}

export function reviseProduct(original, assets = {}) {
  const row = replaceReferences(original, assets);
  const specs = row.specifications || [];
  if (thermalIds.includes(row.id)) {
    const found = specs.find(spec => spec.key?.en === 'Paper grammage');
    const value = Object.fromEntries(locales.map(locale => [locale, grammage]));
    if (found) found.value = value;
    else specs.push({key: {en:'Paper grammage', ar:'وزن الورق', ru:'Плотность бумаги', es:'Gramaje'}, value});
  }
  const base = standardSizes[row.id] || (row.id === 'TP-JUMBO' ? jumboWidths : null);
  if (base) {
    row.size = standardSizes[row.id] ? base + ' / ' + customSizeCopy.en : base;
    const value = Object.fromEntries(locales.map(locale => [locale, standardSizes[row.id] ? base + ' / ' + customSizeCopy[locale] : base]));
    const found = specs.find(spec => spec.key?.en === 'Common sizes / width');
    if (found) found.value = value;
    else specs.unshift({key:{en:'Common sizes / width',ar:'المقاسات الشائعة / العرض',ru:'Размеры / ширина',es:'Medidas habituales / ancho'},value});
  }
  if (specs.length) row.specifications = specs;
  return row;
}

export function reviseWebsite(original, assets = {}) {
  const row = replaceReferences(original, assets);
  if (row.kind === 'download' && (row.topic === 'catalog' || row.file_url === catalogPath)) {
    row.image = assets[coverPath] || coverPath;
    row.file_url = catalogPath;
  }
  return row;
}
