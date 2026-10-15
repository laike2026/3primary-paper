import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {PageHero} from '@/components/PageHero';
import {CategoryCard} from '@/components/CategoryCard';
import {ProductCatalog} from '@/components/ProductCatalog';
import {publishedCategories,publishedProducts} from '@/lib/admin/content';
import {copy} from '@/lib/copy';
import {pageMetadata} from '@/lib/seo';
import type {Locale} from '@/i18n/routing';

export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return pageMetadata(locale,'/products',copy[locale].productsTitle,copy[locale].productsIntro);}
export default async function ProductsPage({params,searchParams}:{params:Promise<{locale:Locale}>;searchParams:Promise<{search?:string}>}){const {locale}=await params;const {search=''}=await searchParams;setRequestLocale(locale);const t=await getTranslations('common');const [categories,products]=await Promise.all([publishedCategories(),publishedProducts()]);return <><PageHero locale={locale} path="/products" eyebrow="3PRIMARY" title={copy[locale].productsTitle} intro={copy[locale].productsIntro}/><section className="inner-content"><div className="container"><h2 className="section-heading">{locale==='en'?'Product Families':locale==='ar'?'فئات المنتجات':locale==='ru'?'Категории продукции':'Familias de productos'}</h2><div className="page-card-grid" style={{margin:'28px 0 65px'}}>{categories.map(item=><CategoryCard key={item.slug} category={item} locale={locale} label={t('learn')}/>)}</div><h2 className="section-heading">{t('all')}</h2><ProductCatalog locale={locale} initialSearch={search} label={t('learn')} all={t('all')} empty={t('noResults')} categories={categories} products={products}/></div></section></>;}
