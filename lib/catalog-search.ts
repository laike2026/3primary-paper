export function normalizeCatalogQuery(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) % 16))
    .replace(/(\d)\s*(?:mm\s*)?[×xх*]\s*(?=\d)/g, '$1x')
    .replace(/(\d)\s*(?:mm|мм|مم)(?![\p{L}\p{N}])/gu, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
