import 'server-only';
import {revalidateTag, unstable_cache} from 'next/cache';
import {cache} from 'react';
import {isContentPreview} from './content-preview';

type PublicData = 'catalog' | 'articles' | 'website' | 'contact';
const tag = (area: PublicData) => 'public-' + area;

export function publicCache<Args extends unknown[], Result>(
  area: PublicData,
  name: string,
  read: (...args: Args) => Promise<Result>,
) {
  const cached = unstable_cache((_source: string, ...args: Args) => read(...args), [tag(area), name, 'content-2026-11-10'],
    {revalidate: 300, tags: [tag(area)]});
  return cache((...args: Args) => {
    if (!process.env.DATABASE_URL || isContentPreview) return read(...args);
    const {host, pathname} = new URL(process.env.DATABASE_URL);
    return cached([process.env.VERCEL_ENV || 'local', host, pathname].join(':'), ...args);
  });
}

export function refreshPublicData(area: PublicData) {
  revalidateTag(tag(area), {expire: 0});
}

export function refreshPublicContent(kind: string) {
  refreshPublicData(kind === 'articles' || kind === 'news-categories' ? 'articles' : 'catalog');
}
