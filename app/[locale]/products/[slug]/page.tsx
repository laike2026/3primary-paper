import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {categories, local} from '@/lib/content';
import {publishedCategories,publishedProducts} from '@/lib/admin/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import {PageHero} from '@/components/PageHero';
import {ProductCard} from '@/components/ProductCard';
import type {Locale} from '@/i18n/routing';
import Link from 'next/link';
import {ArrowRight} from '@phosphor-icons/react/dist/ssr';

export function generateStaticParams(){return categories.map(item=>({slug:item.slug}));}
export async function generateMetadata({params}:{params:Promise<{locale:Locale;slug:string}>}):Promise<Metadata>{const {locale,slug}=await params;const c=(await publishedCategories()).find(item=>item.slug===slug);if(!c)notFound();return pageMetadata(locale,`/products/${slug}`,local(c.name,locale),local(c.summary,locale),c.image,c.seo);}
export default async function CategoryPage({params}:{params:Promise<{locale:Locale;slug:string}>}){const {locale,slug}=await params;setRequestLocale(locale);const [allCategories,products]=await Promise.all([publishedCategories(),publishedProducts()]);const c=allCategories.find(item=>item.slug===slug);if(!c)notFound();const t=await getTranslations('common');const items=products.filter(item=>item.category===slug);return <><PageHero locale={locale} path={`/products/${slug}`} parent={{label:copy[locale].productsTitle,href:'/products'}} title={local(c.name,locale)} intro={`${local(c.summary,locale)} ${copy[locale].categoryIntro}`}/><section className="inner-content"><div className="container"><div className="page-card-grid">{items.map(item=><ProductCard key={item.id} product={item} locale={locale} label={t('learn')}/>)}</div><div style={{marginTop:55}}><h2 className="section-heading">{copy[locale].customizationTitle}</h2><p className="section-intro">{copy[locale].customizationBody}</p><Link href={`/${locale}/contact#inquiry`} className="button">{t('request')}<ArrowRight size={16}/></Link></div></div></section></>;}
