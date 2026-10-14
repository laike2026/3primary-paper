import Image from 'next/image';
import Link from 'next/link';
import {ArrowRight} from '@phosphor-icons/react/dist/ssr';
import {local, type Category} from '@/lib/content';
import type {Locale} from '@/i18n/routing';

export function CategoryCard({category, locale, label, compact = false}: {category: Category; locale: Locale; label: string; compact?: boolean}) {
  return <article className={compact ? 'product-card' : 'page-card'}><Link href={`/${locale}/products/${category.slug}`} className={compact ? 'product-card-image' : 'page-card-image'}><Image src={category.image} alt={`${local(category.name,locale)}${category.slug==='printed-paper'?' — illustrative image':''}`} width={600} height={600}/></Link><div className={compact ? 'product-card-copy' : 'page-card-body'}><h3>{local(category.name,locale)}</h3><p>{local(category.summary,locale)}</p><Link href={`/${locale}/products/${category.slug}`} className="text-link" aria-label={`${label}: ${local(category.name,locale)}`}>{label}<span className="sr-only">: {local(category.name,locale)}</span><ArrowRight size={14}/></Link></div></article>;
}
