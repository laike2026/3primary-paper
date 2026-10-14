'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {ArrowRight} from '@phosphor-icons/react';
import {products, local} from '@/lib/content';
import type {Locale} from '@/i18n/routing';
import {site} from '@/lib/site';

export function InquiryForm({locale, initialProduct}: {locale: Locale; initialProduct?: string}) {
  const t = useTranslations('form');
  const c = useTranslations('common');
  const [status, setStatus] = useState<{kind: 'success'|'error'; message: string}|null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setStatus(null);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/inquiry', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...data, locale, sourceUrl:window.location.href, referrer:document.referrer})});
      const body = await response.json();
      if (!response.ok) throw new Error(response.status === 503 ? t('unavailable') : body.error || t('error'));
      setStatus({kind:'success',message:t('success',{id:body.id})});form.reset();
    } catch (error) {setStatus({kind:'error',message:error instanceof Error ? error.message : t('error')});}
    finally {setPending(false);}
  }
  return <form id="inquiry" className="quote-form" onSubmit={onSubmit}>
    <label>{t('name')}<input name="name" autoComplete="name" required minLength={2} maxLength={120}/></label>
    <label>{t('company')}<input name="company" autoComplete="organization" required minLength={2} maxLength={180}/></label>
    <label>{t('businessEmail')}<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
    <label>{t('country')}<input name="country" autoComplete="country-name" required maxLength={100}/></label>
    <label>{t('product')}<select name="productId" defaultValue={initialProduct || ''} required><option value="">—</option>{products.map(product => <option key={product.id} value={product.id}>{local(product.name,locale)}</option>)}</select></label>
    <label>{t('quantity')}<input name="quantity" maxLength={100}/></label>
    <label className="wide">{t('requirements')}<textarea name="requirements" required minLength={10} maxLength={5000}/></label>
    <label className="sr-only">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <label className="consent wide"><input type="checkbox" name="consent" value="true" required/><span>{t('consent')}</span></label>
    <button className="button" type="submit" disabled={pending}>{pending ? t('sending') : c('submit')}<ArrowRight size={16}/></button>
    {status && <p className={`form-status ${status.kind}`} role="status">{status.message}{status.kind === 'error' && <> <a href={`mailto:${site.email}`}>{site.email}</a></>}</p>}
  </form>;
}
