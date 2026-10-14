import Image from 'next/image';
import Link from 'next/link';
import {ArrowRight} from '@phosphor-icons/react/dist/ssr';
import {local, type Product} from '@/lib/content';
import type {Locale} from '@/i18n/routing';

export function ProductCard({product, locale, label}: {product: Product; locale: Locale; label: string}) {
  return <article className="page-card"><Link href={`/${locale}/product/${product.slug}`} className="page-card-image"><Image src={product.image} alt={local(product.name,locale)} width={600} height={600}/></Link><div className="page-card-body"><h2>{local(product.name,locale)}</h2><p>{local(product.summary,locale)}</p><Link className="text-link" href={`/${locale}/product/${product.slug}`} aria-label={`${label}: ${local(product.name,locale)}`}>{label}<span className="sr-only">: {local(product.name,locale)}</span><ArrowRight size={14}/></Link></div></article>;
}
