import 'server-only';
import {neon} from '@neondatabase/serverless';
import {isContentPreview} from './content-preview';

export function db() {
  if (isContentPreview) throw new Error('Database access is disabled in the isolated content preview');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return neon(process.env.DATABASE_URL);
}

export function pagination(input: URLSearchParams) {
  const requested = Number(input.get('page'));
  const page = Number.isSafeInteger(requested) ? Math.max(1, Math.min(100000, requested)) : 1;
  const size = [10,20,50,100].includes(Number(input.get('size'))) ? Number(input.get('size')) : 20;
  return {page, size, offset:(page-1)*size};
}

export function safeLike(value: string) {return `%${value.replace(/[\\%_]/g, '\\$&').slice(0,120)}%`;}
