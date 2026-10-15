'use client';

import {useEffect,useRef,useState} from 'react';
import {useTranslations} from 'next-intl';
import {ArrowRight} from '@phosphor-icons/react';
import {products as fallbackProducts, local, type Product} from '@/lib/content';
import type {Locale} from '@/i18n/routing';
import {site} from '@/lib/site';
import {analyticsAllowed,analyticsIdentity,trackEvent} from '@/components/AnalyticsTracker';

export function InquiryForm({locale, initialProduct, productOptions}: {locale: Locale; initialProduct?: string; productOptions?:Product[]}) {
  const t = useTranslations('form');
  const c = useTranslations('common');
  const [status, setStatus] = useState<{kind: 'success'|'error'; message: string}|null>(null);
  const [pending, setPending] = useState(false);
  const ref=useRef<HTMLFormElement>(null);const viewed=useRef(false);const opened=useRef(false);const started=useRef(false);const seenFields=useRef(new Set<string>());const requestId=useRef(crypto.randomUUID());
  const options=productOptions||fallbackProducts;
  const formId=initialProduct?'product':'general';
  function markView(){if(viewed.current||!analyticsAllowed())return;viewed.current=true;trackEvent('form_view',{formId,productId:initialProduct});}
  useEffect(()=>{const form=ref.current;if(!form)return;const mark=()=>{const box=form.getBoundingClientRect();if(box.top<innerHeight&&box.bottom>0&&analyticsAllowed()&&!viewed.current){viewed.current=true;trackEvent('form_view',{formId,productId:initialProduct});}};const observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting))mark();},{threshold:.25});observer.observe(form);window.addEventListener('analytics-consent-changed',mark);return()=>{observer.disconnect();window.removeEventListener('analytics-consent-changed',mark);};},[formId,initialProduct]);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setStatus(null);trackEvent('form_submit_attempt',{formId,productId:initialProduct});
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const analyticsSessionId=analyticsAllowed()?analyticsIdentity().session:undefined;
      const response = await fetch('/api/inquiry', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...data, locale, sourceUrl:window.location.href, referrer:document.referrer, clientRequestId:requestId.current,analyticsSessionId,formId})});
      const body = await response.json();
      if (!response.ok) throw new Error(response.status === 503 ? t('unavailable') : body.error || t('error'));
      setStatus({kind:'success',message:t('success',{id:body.id})});form.reset();requestId.current=crypto.randomUUID();opened.current=false;started.current=false;seenFields.current.clear();
    } catch (error) {trackEvent('form_submit_failure',{formId,productId:initialProduct,metadata:{reason:error instanceof Error?error.message.slice(0,80):'unknown'}});setStatus({kind:'error',message:error instanceof Error ? error.message : t('error')});}
    finally {setPending(false);}
  }
  return <form ref={ref} id="inquiry" className="quote-form" onSubmit={onSubmit} onFocusCapture={()=>{markView();if(!opened.current){opened.current=true;trackEvent('form_open',{formId,productId:initialProduct});}}} onChangeCapture={event=>{const element=event.target as unknown as HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement;if(!started.current&&element.name!=='website'&&element.name!=='consent'&&element.value.trim()){started.current=true;trackEvent('form_start',{formId,productId:initialProduct});}}} onBlurCapture={event=>{const element=event.target as unknown as HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement;const key=element.name;if(!key||key==='website'||seenFields.current.has(key))return;if(element.type==='checkbox'?(element as HTMLInputElement).checked:Boolean(element.value.trim())){seenFields.current.add(key);trackEvent('form_field_complete',{formId,productId:initialProduct,fieldKey:key});}}}>
    <label>{t('name')}<input name="name" autoComplete="name" required minLength={2} maxLength={120}/></label>
    <label>{t('company')}<input name="company" autoComplete="organization" required minLength={2} maxLength={180}/></label>
    <label>{t('businessEmail')}<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
    <label>{({en:'Phone (optional)',ar:'الهاتف (اختياري)',ru:'Телефон (необязательно)',es:'Teléfono (opcional)'} as const)[locale]}<input name="phone" type="tel" autoComplete="tel" maxLength={50}/></label>
    <label>{t('country')}<input name="country" autoComplete="country-name" required maxLength={100}/></label>
    <label>{t('product')}<select name="productId" defaultValue={initialProduct || ''} required><option value="">—</option>{options.map(product => <option key={product.id} value={product.id}>{local(product.name,locale)}</option>)}</select></label>
    <label>{t('quantity')}<input name="quantity" maxLength={100}/></label>
    <label className="wide">{t('requirements')}<textarea name="requirements" required minLength={10} maxLength={5000}/></label>
    <label className="sr-only">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <label className="consent wide"><input type="checkbox" name="consent" value="true" required/><span>{t('consent')}</span></label>
    <button className="button" type="submit" disabled={pending}>{pending ? t('sending') : c('submit')}<ArrowRight size={16}/></button>
    {status && <p className={`form-status ${status.kind}`} role="status">{status.message}{status.kind === 'error' && <> <a href={`mailto:${site.email}`}>{site.email}</a></>}</p>}
  </form>;
}
