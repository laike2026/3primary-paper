'use client';

import Image from 'next/image';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {List, MagnifyingGlass, X, CaretDown, ArrowUpRight} from '@phosphor-icons/react';
import {useEffect, useRef, useState} from 'react';
import {local, type Category} from '@/lib/content';
import {site} from '@/lib/site';
import type {Locale} from '@/i18n/routing';

const nav = [
  ['home', ''], ['products', '/products'], ['applications', '/applications'],
  ['oem', '/oem-odm'], ['manufacturing', '/manufacturing-quality'],
  ['about', '/about'], ['resources', '/resources'], ['blog', '/blog'], ['contact', '/contact']
] as const;

export function Header({locale,categories}: {locale: Locale;categories:Category[]}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const menuButton=useRef<HTMLButtonElement>(null);
  const mobileNav=useRef<HTMLElement>(null);
  const productsLink=useRef<HTMLAnchorElement>(null);
  const switchPath = (nextLocale: Locale) => pathname.replace(/^\/(en|ar|ru|es)(?=\/|$)/, `/${nextLocale}`);
  useEffect(()=>{
    if(!mobileOpen)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){
        setMobileOpen(false);
        menuButton.current?.focus();
      }
      if(event.key!=='Tab')return;
      const links=Array.from(mobileNav.current?.querySelectorAll('a')||[]);
      const controls=[menuButton.current,...links].filter((item):item is HTMLButtonElement|HTMLAnchorElement=>item!==null);
      if(!controls.length)return;
      const current=controls.findIndex(item=>item===document.activeElement);
      if(event.shiftKey&&current<=0){event.preventDefault();controls.at(-1)?.focus();}
      else if(!event.shiftKey&&current===controls.length-1){event.preventDefault();controls[0]?.focus();}
    };
    const onResize=()=>{if(window.innerWidth>1020)setMobileOpen(false);};
    document.addEventListener('keydown',onKeyDown);
    window.addEventListener('resize',onResize);
    return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',onKeyDown);window.removeEventListener('resize',onResize);};
  },[mobileOpen]);
  return <header className="site-header">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="header-inner container">
      <Link href={`/${locale}`} aria-label="3PRIMARY Home" className="brand-logo"><Image src={site.logo} alt="3PRIMARY — Zhejiang Three Primary Colors Paper" width={166} height={50} priority /></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {nav.map(([key, href]) => key === 'products' ?
          <div key={key} className="nav-dropdown" onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setProductsOpen(false);}} onKeyDown={event=>{if(event.key==='Escape'){productsLink.current?.focus();setProductsOpen(false);}}}>
            <Link ref={productsLink} href={`/${locale}${href}`} className="nav-link" onFocus={() => setProductsOpen(true)} aria-expanded={productsOpen} aria-haspopup="true">{t(key)} <CaretDown size={12} /></Link>
            {productsOpen && <div className="mega-menu">
              <div className="mega-menu-heading">{t('products')} <Link href={`/${locale}/products`}>View all <ArrowUpRight size={15}/></Link></div>
              <div className="mega-grid">{categories.filter(item=>item.nav_visible!==false).map(item => <Link key={item.slug} href={`/${locale}/products/${item.slug}`} onClick={() => setProductsOpen(false)}><strong>{local(item.name, locale)}</strong><small>{local(item.summary, locale)}</small></Link>)}</div>
            </div>}
          </div> : <Link key={key} href={`/${locale}${href}`} className={`nav-link ${pathname === `/${locale}${href}` ? 'active' : ''}`}>{t(key)}</Link>)}
      </nav>
      <div className="header-actions">
        <Link href={`/${locale}/products?search=`} aria-label={t('search')} className="icon-link"><MagnifyingGlass size={20}/></Link>
        <label className="language-select"><span className="sr-only">{locale==='en'?'Language':locale==='ar'?'اللغة':locale==='ru'?'Язык':'Idioma'}</span><select value={locale} onChange={event => {window.location.assign(switchPath(event.target.value as Locale));}} aria-label={locale==='en'?'Language':locale==='ar'?'اللغة':locale==='ru'?'Язык':'Idioma'}><option value="en">EN</option><option value="ar">AR</option><option value="ru">RU</option><option value="es">ES</option></select></label>
        <Link href={`/${locale}/contact#inquiry`} className="header-quote">{t('quote')}</Link>
        <button ref={menuButton} type="button" className="menu-toggle" aria-label={mobileOpen ? (locale==='en'?'Close menu':locale==='ar'?'إغلاق القائمة':locale==='ru'?'Закрыть меню':'Cerrar menú') : t('menu')} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={24}/> : <List size={25}/>}</button>
      </div>
    </div>
    {mobileOpen && <div className="mobile-nav-layer"><button className="mobile-nav-backdrop" type="button" tabIndex={-1} aria-hidden="true" onClick={()=>setMobileOpen(false)}/><nav ref={mobileNav} id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{nav.map(([key, href]) => <Link key={key} href={`/${locale}${href}`} onClick={() => setMobileOpen(false)}>{t(key)}</Link>)}</nav></div>}
  </header>;
}
