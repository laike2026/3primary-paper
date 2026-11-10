'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import {MagnifyingGlass} from '@phosphor-icons/react';
import {local, type Category, type Product} from '@/lib/content';
import type {Locale} from '@/i18n/routing';
import {ui, tr} from '@/lib/interior-copy';
import {ProductCard} from './ProductCard';
import {normalizeCatalogQuery} from '@/lib/catalog-search';
import {productSize} from '@/lib/product-size';
const formatOf = (p: Product) =>
  p.category === 'color-paper' ? 'sheet' : p.slug.includes('continuous') ? 'continuous' : 'roll';
const applicationOf = (p: Product) =>
  p.category.includes('label')
    ? 'labels'
    : p.category.includes('carbonless')
      ? 'forms'
      : p.category === 'color-paper'
        ? 'office'
        : 'receipts';
export function ProductCatalog({
  locale,
  label,
  empty,
  all,
  categories,
  products,
}: {
  locale: Locale;
  label: string;
  empty: string;
  all: string;
  categories: Category[];
  products: Product[];
}) {
  const searchField = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('all'),
    [sort, setSort] = useState('name'),
    [usage, setUsage] = useState('all'),
    [format, setFormat] = useState('all'),
    [page, setPage] = useState(1);
  useEffect(() => {
    const legacyQuery = new URLSearchParams(window.location.search).get('search');
    if (legacyQuery) queueMicrotask(() => setQuery(legacyQuery.slice(0, 160)));
    const focusSearch = () => {
      if (window.location.hash === '#catalog-search' || legacyQuery !== null) {
        searchField.current?.focus({preventScroll: true});
        searchField.current?.scrollIntoView({block: 'start'});
      }
    };
    focusSearch();
    window.addEventListener('hashchange', focusSearch);
    return () => window.removeEventListener('hashchange', focusSearch);
  }, []);
  const uses = [
    ['all', all],
    ['receipts', tr(locale, 'Receipts & POS', 'الإيصالات ونقاط البيع', 'Чеки и POS', 'Recibos y POS')],
    [
      'labels',
      tr(
        locale,
        'Identification & logistics',
        'التعريف والخدمات اللوجستية',
        'Маркировка и логистика',
        'Identificación y logística',
      ),
    ],
    ['forms', tr(locale, 'Business forms', 'النماذج التجارية', 'Деловые бланки', 'Formularios comerciales')],
    ['office', tr(locale, 'Office', 'المكاتب', 'Офис', 'Oficina')],
  ];
  const formats = [
    ['all', all],
    ['roll', tr(locale, 'Roll', 'لفة', 'Рулон', 'Rollo')],
    ['sheet', tr(locale, 'Sheet', 'ورقة', 'Лист', 'Hoja')],
    ['continuous', tr(locale, 'Continuous', 'متصل', 'Непрерывная форма', 'Continuo')],
  ];
  const searchable = useMemo(() => products.map((p) => {
    const c = categories.find((c) => c.slug === p.category);
    return {p, text: normalizeCatalogQuery([
            p.id,
            p.slug,
            p.size,
            productSize(p, locale),
            local(p.name, locale),
            local(p.summary, locale),
            local(p.application, locale),
            c && local(c.name, locale),
            ...((p.specifications || []).map((spec) => local(spec.value, locale))),
    ].join(' '))};
  }), [products, categories, locale]);
  const filtered = useMemo(() => {
    const search = normalizeCatalogQuery(query);
    return searchable
        .filter(({p, text}) =>
            (category === 'all' || p.category === category) &&
            (usage === 'all' || applicationOf(p) === usage) &&
            (format === 'all' || formatOf(p) === format) &&
            text.includes(search)
        )
        .map(({p}) => p)
        .sort((a, b) =>
          sort === 'category'
            ? a.category.localeCompare(b.category) ||
              local(a.name, locale).localeCompare(local(b.name, locale))
            : local(a.name, locale).localeCompare(local(b.name, locale)),
        );
  }, [query, category, sort, usage, format, locale, searchable]);
  const pageSize = 9,
    shown = filtered.slice((page - 1) * pageSize, page * pageSize),
    categoryLabel = tr(locale, 'Category', 'الفئة', 'Категория', 'Categoría'),
    formatLabel = tr(locale, 'Format', 'الصيغة', 'Формат', 'Formato');
  function choose(c: string) {
    setCategory(c);
    setPage(1);
  }
  return (
    <div className="catalog-layout">
      <aside className="catalog-sidebar">
        <fieldset className="catalog-filter-group">
          <legend>{ui(locale, 'families')}</legend>
          {[{slug: 'all', name: {en: all, ar: all, ru: all, es: all}}, ...categories].map((c) => (
            <label key={c.slug}>
              <input
                type="radio"
                name="product-family"
                checked={category === c.slug}
                onChange={() => choose(c.slug)}
              />
              <span>{local(c.name, locale)}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="catalog-filter-group">
          <legend>{ui(locale, 'application')}</legend>
          {uses.map(([id, name]) => (
            <label key={id}>
              <input
                type="radio"
                name="product-use"
                checked={usage === id}
                onChange={() => {
                  setUsage(id);
                  setPage(1);
                }}
              />
              {name}
            </label>
          ))}
        </fieldset>
        <fieldset className="catalog-filter-group">
          <legend>{formatLabel}</legend>
          {formats.map(([id, name]) => (
            <label key={id}>
              <input
                type="radio"
                name="product-format"
                checked={format === id}
                onChange={() => {
                  setFormat(id);
                  setPage(1);
                }}
              />
              {name}
            </label>
          ))}
        </fieldset>
      </aside>
      <div className="catalog-main">
        <div className="catalog-toolbar">
          <label className="search-field">
            <MagnifyingGlass size={21} />
            <input
              id="catalog-search"
              ref={searchField}
              type="search"
              maxLength={160}
              aria-label={tr(
                locale,
                'Search products',
                'ابحث عن المنتجات',
                'Поиск продукции',
                'Buscar productos',
              )}
              placeholder={tr(
                locale,
                'Search size, product or SKU…',
                'ابحث عن مقاس أو منتج أو رمز…',
                'Поиск по размеру, товару или коду…',
                'Buscar tamaño, producto o código…',
              )}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            className="catalog-category-mobile"
            aria-label={categoryLabel}
            value={category}
            onChange={(e) => choose(e.target.value)}
          >
            <option value="all">{all}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {local(c.name, locale)}
              </option>
            ))}
          </select>
          <select
            className="catalog-use-mobile"
            aria-label={ui(locale, 'application')}
            value={usage}
            onChange={(e) => {
              setUsage(e.target.value);
              setPage(1);
            }}
          >
            {uses.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select
            className="catalog-format-mobile"
            aria-label={formatLabel}
            value={format}
            onChange={(e) => {
              setFormat(e.target.value);
              setPage(1);
            }}
          >
            {formats.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select
            aria-label={tr(
              locale,
              'Sort products',
              'ترتيب المنتجات',
              'Сортировка товаров',
              'Ordenar productos',
            )}
            value={sort}
            onChange={(e) => {setSort(e.target.value); setPage(1);}}
          >
            <option value="name">{tr(locale, 'Name', 'الاسم', 'Название', 'Nombre')}</option>
            <option value="category">{categoryLabel}</option>
          </select>
          <span className="catalog-count" role="status">
            {filtered.length} {tr(locale, 'products', 'منتجات', 'товаров', 'productos')}
          </span>
          {(query || category !== 'all' || usage !== 'all' || format !== 'all') && (
            <button className="catalog-reset" type="button" onClick={() => {
              setQuery('');
              setCategory('all');
              setUsage('all');
              setFormat('all');
              setPage(1);
              searchField.current?.focus();
            }}>
              {tr(locale, 'Clear filters', 'مسح المرشحات', 'Сбросить фильтры', 'Limpiar filtros')}
            </button>
          )}
        </div>
        {shown.length ? (
          <div className="page-card-grid">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} label={label} />
            ))}
          </div>
        ) : (
          <p role="status">{empty}</p>
        )}
        {filtered.length > pageSize && (
          <nav
            className="catalog-pages"
            aria-label={tr(
              locale,
              'Product pages',
              'صفحات المنتجات',
              'Страницы товаров',
              'Páginas de productos',
            )}
          >
            {Array.from({length: Math.ceil(filtered.length / pageSize)}, (_, i) => (
              <button
                key={i}
                className={page === i + 1 ? 'button' : 'button button-outline'}
                aria-current={page === i + 1 ? 'page' : undefined}
                onClick={() => {
                  setPage(i + 1);
                  searchField.current?.scrollIntoView({block: 'start'});
                }}
              >
                {i + 1}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
