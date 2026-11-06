'use client';

import {useEffect,useRef,useState} from 'react';
import {useTranslations} from 'next-intl';
import {ArrowRight} from '@phosphor-icons/react';
import {PRODUCT_SELECTION_HELP, type InquiryOption} from '@/lib/inquiry';
import type {Locale} from '@/i18n/routing';
import {site} from '@/lib/site';
import {analyticsAllowed,analyticsIdentity,trackEvent} from '@/components/AnalyticsTracker';

export function InquiryFormClient({locale, initialProduct, productOptions, whatsapp}: {
  locale: Locale; initialProduct?: string; productOptions: InquiryOption[]; whatsapp: string;
}) {
  const t = useTranslations('form');
  const c = useTranslations('common');
  const [status, setStatus] = useState<{kind: 'success'|'error'; message: string}|null>(null);
  const [pending, setPending] = useState(false);
  const ref=useRef<HTMLFormElement>(null);const viewed=useRef(false);const opened=useRef(false);const started=useRef(false);const seenFields=useRef(new Set<string>());const requestId=useRef(crypto.randomUUID());
  const statusRef=useRef<HTMLParagraphElement>(null);
  const formId=initialProduct?'product':'general';
  function markView(){if(viewed.current||!analyticsAllowed())return;viewed.current=true;trackEvent('form_view',{formId,productId:initialProduct});}
  useEffect(()=>{const form=ref.current;if(!form)return;const mark=()=>{const box=form.getBoundingClientRect();if(box.top<innerHeight&&box.bottom>0&&analyticsAllowed()&&!viewed.current){viewed.current=true;trackEvent('form_view',{formId,productId:initialProduct});}};const observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting))mark();},{threshold:.25});observer.observe(form);window.addEventListener('analytics-consent-changed',mark);return()=>{observer.disconnect();window.removeEventListener('analytics-consent-changed',mark);};},[formId,initialProduct]);
  useEffect(() => {if (status) statusRef.current?.focus();}, [status]);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setStatus(null);trackEvent('form_submit_attempt',{formId,productId:initialProduct});
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const analyticsSessionId=analyticsAllowed()?analyticsIdentity().session:undefined;
      const response = await fetch('/api/inquiry', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...data, locale, sourceUrl:window.location.href, referrer:document.referrer, clientRequestId:requestId.current,analyticsSessionId,formId})});
      const body = await response.json();
      if (!response.ok) {
        trackEvent('form_submit_failure', {formId, productId:initialProduct, metadata:{status:response.status}});
        setStatus({kind:'error', message:t(response.status >= 500 ? 'unavailable' : response.status === 429 ? 'rateLimited' : 'error')});
        return;
      }
      setStatus({kind:'success',message:t('success',{id:body.id})});form.reset();requestId.current=crypto.randomUUID();opened.current=false;started.current=false;seenFields.current.clear();
    } catch {trackEvent('form_submit_failure',{formId,productId:initialProduct,metadata:{reason:'network'}});setStatus({kind:'error',message:t('error')});}
    finally {setPending(false);}
  }
  return <form ref={ref} id="inquiry" tabIndex={-1} className="quote-form" onSubmit={onSubmit} onFocusCapture={()=>{markView();if(!opened.current){opened.current=true;trackEvent('form_open',{formId,productId:initialProduct});}}} onChangeCapture={event=>{const element=event.target as unknown as HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement;if(!started.current&&element.name!=='website'&&element.name!=='consent'&&element.value.trim()){started.current=true;trackEvent('form_start',{formId,productId:initialProduct});}}} onBlurCapture={event=>{const element=event.target as unknown as HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement;const key=element.name;if(!key||key==='website'||seenFields.current.has(key))return;if(element.type==='checkbox'?(element as HTMLInputElement).checked:Boolean(element.value.trim())){seenFields.current.add(key);trackEvent('form_field_complete',{formId,productId:initialProduct,fieldKey:key});}}}>
    <label>{t('name')}<input name="name" autoComplete="name" required minLength={2} maxLength={120}/></label>
    <label>{t('company')}<input name="company" autoComplete="organization" required minLength={2} maxLength={180}/></label>
    <label>{t('businessEmail')}<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
    <label>{({en:'Phone (optional)',ar:'الهاتف (اختياري)',ru:'Телефон (необязательно)',es:'Teléfono (opcional)'} as const)[locale]}<input name="phone" type="tel" autoComplete="tel" maxLength={50}/></label>
    <label>{t('country')}<input name="country" autoComplete="country-name" required maxLength={100}/></label>
    <label>{t('product')}<select name="productId" defaultValue={initialProduct || ''} required><option value="">—</option>{!initialProduct && <option value={PRODUCT_SELECTION_HELP}>{t('productHelp')}</option>}{productOptions.map(product => <option key={product.id} value={product.id}>{product.label}</option>)}</select></label>
    <label>{t('quantity')}<input name="quantity" maxLength={100}/></label>
    <label className="wide">{t('requirements')}<textarea name="requirements" required minLength={10} maxLength={5000}/></label>
    <label className="sr-only">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <div className="consent wide">
      <input id="inquiry-consent" type="checkbox" name="consent" value="true" required aria-labelledby="inquiry-consent-text"/>
      <span id="inquiry-consent-text">{t.rich('consent', {policy: (words) => <a href={`/${locale}/privacy-policy`} target="_blank" rel="noopener noreferrer">{words}</a>})}</span>
    </div>
    <button className="button" type="submit" disabled={pending}>{pending ? c('sending') : c('submit')}<ArrowRight size={16}/></button>
    <a className="inquiry-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">{t('whatsapp')}</a>
    {status && <p ref={statusRef} className={`form-status ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'} tabIndex={-1}>{status.message}{status.kind === 'error' && <> <a href={`mailto:${site.email}`}>{site.email}</a></>}</p>}
  </form>;
}
