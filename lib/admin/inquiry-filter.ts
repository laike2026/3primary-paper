import {z} from 'zod';
import {validDateRange} from './query-validation';

export function inquiryFilter(input: URLSearchParams) {
  const read = (key: string, length: number) => (input.get(key) || '').trim().slice(0, length);
  const q = read('q', 120);
  const status = read('status', 30);
  const country = read('country', 100);
  const product = read('product', 50);
  const source = read('source', 100);
  const assignee = input.get('assignee') || '';
  const from = input.get('from') || '';
  const to = input.get('to') || '';
  if (assignee && assignee !== 'unassigned' && !z.uuid().safeParse(assignee).success) {
    return {error: '负责人编号无效'} as const;
  }
  if (!validDateRange(from, to)) return {error: '请输入有效且顺序正确的起止日期'} as const;

  const args = [q, status, country, product, source, assignee && assignee !== 'unassigned' ? assignee : null,
    from || null, to || null, assignee === 'unassigned'];
  const where = `WHERE deleted_at IS NULL
    AND ($1='' OR id ILIKE '%'||$1||'%' OR name ILIKE '%'||$1||'%' OR company ILIKE '%'||$1||'%'
      OR email ILIKE '%'||$1||'%' OR phone ILIKE '%'||$1||'%')
    AND ($2='' OR status=$2 OR ($2='needs-followup' AND status IN ('new','pending_contact')))
    AND ($3='' OR country ILIKE '%'||$3||'%') AND ($4='' OR product_id=$4)
    AND ($5='' OR utm_source ILIKE '%'||$5||'%') AND ($6::uuid IS NULL OR assigned_to=$6::uuid)
    AND ($7::date IS NULL OR created_at>=($7::date::timestamp AT TIME ZONE 'Asia/Shanghai'))
    AND ($8::date IS NULL OR created_at<(($8::date+1)::timestamp AT TIME ZONE 'Asia/Shanghai'))
    AND (NOT $9::boolean OR assigned_to IS NULL)`;
  return {where, args, sort: input.get('sort') === 'oldest' ? 'ASC' : 'DESC',
    audit: {status, country, product, from, to}} as const;
}

export function safeCsvCell(value: unknown) {
  const text = String(value ?? '');
  return /^[\t\r\n]|^\s*[=+\-@＝＋－＠]/u.test(text) ? "'" + text : text;
}
