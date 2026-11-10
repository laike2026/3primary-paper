import {local, type Product} from '@/lib/content';
import type {Locale} from '@/i18n/routing';

export function productSize(product: Product, locale: Locale) {
  const specification = product.specifications?.find(spec => spec.key.en === 'Common sizes / width');
  return (specification && local(specification.value, locale)) || product.size || '';
}
