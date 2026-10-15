import 'server-only';
import {neon} from '@neondatabase/serverless';

export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return neon(process.env.DATABASE_URL);
}

export function pagination(input: URLSearchParams) {
  const page = Math.max(1, Math.min(100000, Number(input.get('page')) || 1));
  const size = [10,20,50,100].includes(Number(input.get('size'))) ? Number(input.get('size')) : 20;
  return {page, size, offset:(page-1)*size};
}

export function safeLike(value: string) {return `%${value.replace(/[\\%_]/g, '\\$&').slice(0,120)}%`;}
