'use client';
import {useState} from 'react';
import {
  MagnifyingGlass,
  Stack,
  Printer,
  Package,
  ClipboardText,
  ChatCircle,
  Flask,
  Question,
} from '@phosphor-icons/react';
import {local} from '@/lib/content';
import type {WebsiteContent} from '@/lib/website-types';
import type {Locale} from '@/i18n/routing';
import {tr, ui} from '@/lib/interior-copy';
const topicIcons = {
  products: Stack,
  customization: Printer,
  samples: Flask,
  ordering: ClipboardText,
  shipping: Package,
  support: ChatCircle,
};
export function FaqBrowser({
  items,
  locale,
  topics,
}: {
  items: WebsiteContent[];
  locale: Locale;
  topics: {id: string; label: string}[];
}) {
  const [query, setQuery] = useState(''),
    [topic, setTopic] = useState('all');
  const shown = items.filter(
    (x) =>
      (topic === 'all' || x.topic === topic) &&
      (local(x.name, locale) + ' ' + local(x.body, locale))
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <>
      <label className="faq-search">
        <MagnifyingGlass size={24} />
        <input
          type="search"
          aria-label={tr(locale, 'Search questions', 'ابحث عن سؤال', 'Поиск вопросов', 'Buscar preguntas')}
          placeholder={tr(
            locale,
            'Search questions…',
            'ابحث عن سؤال…',
            'Поиск вопросов…',
            'Buscar preguntas…',
          )}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="faq-layout">
        <nav className="faq-categories" aria-label={ui(locale, 'contents')}>
          <button aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>
            <Question size={26} weight="light" />
            {tr(locale, 'All questions', 'جميع الأسئلة', 'Все вопросы', 'Todas las preguntas')}
          </button>
          {topics.map((t) => {
            const Icon = topicIcons[t.id as keyof typeof topicIcons] || Question;
            return (
              <button key={t.id} aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>
                <Icon size={26} weight="light" />
                {t.label}
              </button>
            );
          })}
        </nav>
        <div className="faq-list" aria-live="polite">
          {shown.map((x) => (
            <details key={x.slug}>
              <summary>{local(x.name, locale)}</summary>
              <p className="preserve-lines">{local(x.body, locale)}</p>
            </details>
          ))}
          {!shown.length && <p>{ui(locale, 'noResults')}</p>}
        </div>
      </div>
    </>
  );
}
