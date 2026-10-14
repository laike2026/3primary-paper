'use client';

import {useMemo, useState} from 'react';
import {categories, products, local} from '@/lib/content';
import type {Locale} from '@/i18n/routing';
import {ProductCard} from './ProductCard';

export function ProductCatalog({locale, initialSearch = '', label, empty, all}: {locale: Locale; initialSearch?: string; label: string; empty: string; all: string}) {
  const [query,setQuery]=useState(initialSearch);const [category,setCategory]=useState('all');const [sort,setSort]=useState('name');const [page,setPage]=useState(1);
  const filtered=useMemo(() => products.filter(product => {
    const c=categories.find(item=>item.slug===product.category);
    const text=[product.id,product.slug,product.size,local(product.name,locale),local(product.summary,locale),local(product.application,locale),c && local(c.name,locale)].join(' ').toLowerCase();
    return (category==='all'||product.category===category)&&text.includes(query.trim().toLowerCase());
  }).sort((a,b)=>sort==='category' ? a.category.localeCompare(b.category)||local(a.name,locale).localeCompare(local(b.name,locale)) : local(a.name,locale).localeCompare(local(b.name,locale))),[query,category,sort,locale]);
  const pageSize=9;const shown=filtered.slice((page-1)*pageSize,page*pageSize);
  return <><div className="catalog-toolbar"><input type="search" aria-label={locale==='en'?'Search products':locale==='ar'?'ابحث عن المنتجات':locale==='ru'?'Поиск продукции':'Buscar productos'} placeholder={locale==='en'?'Search product, SKU or use…':locale==='ar'?'ابحث عن منتج أو رمز أو استخدام…':locale==='ru'?'Поиск по товару, коду или применению…':'Buscar producto, código o uso…'} value={query} onChange={event=>{setQuery(event.target.value);setPage(1);}}/><select aria-label={locale==='en'?'Category':locale==='ar'?'الفئة':locale==='ru'?'Категория':'Categoría'} value={category} onChange={event=>{setCategory(event.target.value);setPage(1);}}><option value="all">{all}</option>{categories.map(item=><option key={item.slug} value={item.slug}>{local(item.name,locale)}</option>)}</select><select aria-label={locale==='en'?'Sort products':locale==='ar'?'ترتيب المنتجات':locale==='ru'?'Сортировка товаров':'Ordenar productos'} value={sort} onChange={event=>setSort(event.target.value)}><option value="name">{locale==='en'?'Name':locale==='ar'?'الاسم':locale==='ru'?'Название':'Nombre'}</option><option value="category">{locale==='en'?'Category':locale==='ar'?'الفئة':locale==='ru'?'Категория':'Categoría'}</option></select><span className="catalog-count">{filtered.length} {locale==='en'?'products':locale==='ar'?'منتجات':locale==='ru'?'товаров':'productos'}</span></div>{shown.length?<div className="page-card-grid">{shown.map(item=><ProductCard product={item} locale={locale} label={label} key={item.id}/>)}</div>:<p className="muted">{empty}</p>}{filtered.length>pageSize&&<div className="catalog-toolbar" style={{justifyContent:'center',marginTop:30}}>{Array.from({length:Math.ceil(filtered.length/pageSize)},(_,index)=><button key={index} type="button" className={page===index+1?'button':'button button-outline'} onClick={()=>{setPage(index+1);window.scrollTo({top:350,behavior:'smooth'});}}>{index+1}</button>)}</div>}</>;
}
