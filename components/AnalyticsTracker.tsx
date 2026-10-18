'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import type {Locale} from '@/i18n/routing';

type EventName='page_view'|'address_click'|'whatsapp_click'|'form_cta_click'|'form_view'|'form_open'|'form_start'|'form_field_complete'|'form_submit_attempt'|'form_submit_failure';
const queueKey='primary_analytics_queue';
let draining=false;
let fallbackQueue:string[]=[];
function readQueue(){try{return JSON.parse(localStorage.getItem(queueKey)||'[]') as string[];}catch{return fallbackQueue;}}
function saveQueue(items:string[]){fallbackQueue=items;try{localStorage.setItem(queueKey,JSON.stringify(items));}catch{/* Private browsing may disable storage. */}}
async function drainEvents(){
  if(draining||!analyticsAllowed())return;draining=true;
  try{let queue=readQueue();while(queue.length){
    const body=queue[0];let response:Response;
    try{response=await fetch('/api/events',{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true});}catch{break;}
    if(!response.ok&&response.status!==204&&response.status>=500)break;
    if(response.status===429)break;
    queue=readQueue().filter(item=>item!==body);saveQueue(queue);
  }}finally{draining=false;}
}
function flushBeacons(){if(!analyticsAllowed()||!navigator.sendBeacon)return;for(const body of readQueue())navigator.sendBeacon('/api/events',new Blob([body],{type:'application/json'}));}
function cookie(name:string){return document.cookie.split('; ').find(x=>x.startsWith(`${name}=`))?.split('=')[1]||'';}
export function analyticsAllowed(){return typeof document!=='undefined'&&cookie('analytics_consent')==='yes';}
export function analyticsIdentity(){
  let visitor=cookie('primary_visitor');if(!visitor){visitor=crypto.randomUUID();document.cookie=`primary_visitor=${visitor}; Path=/; Max-Age=7776000; SameSite=Lax; Secure`;}
  let session=sessionStorage.getItem('primary_session');if(!session){session=crypto.randomUUID();sessionStorage.setItem('primary_session',session);}
  return {visitor,session};
}
export function trackEvent(type:EventName,detail:{placement?:string;productId?:string;formId?:string;fieldKey?:string;metadata?:Record<string,string|number|boolean>}={}){
  if(!analyticsAllowed())return;
  const ids=analyticsIdentity();const locale=location.pathname.split('/')[1];
  const body=JSON.stringify({eventId:crypto.randomUUID(),type,sessionId:ids.session,visitorId:ids.visitor,pagePath:location.pathname+location.search,placement:detail.placement||detail.formId||'',productId:detail.productId||'',formId:detail.formId||'',fieldKey:detail.fieldKey||'',locale:['en','ar','ru','es'].includes(locale)?locale:'en',metadata:detail.metadata||{}});
  saveQueue([...readQueue(),body].slice(-100));void drainEvents();
}
const consentCopy:Record<Locale,{label:string;body:string;decline:string;accept:string}>={
  en:{label:'Analytics consent',body:'To improve this site, we would like to count page visits and clicks on contact links. We never record text entered into an unsubmitted form.',decline:'Decline analytics',accept:'Allow analytics'},
  ar:{label:'الموافقة على التحليلات',body:'لتحسين الموقع، نود إحصاء زيارات الصفحات والنقرات على روابط التواصل. لا نسجل النص المكتوب في نموذج لم يُرسل.',decline:'رفض التحليلات',accept:'السماح بالتحليلات'},
  ru:{label:'Согласие на аналитику',body:'Для улучшения сайта мы хотели бы подсчитывать просмотры страниц и нажатия на ссылки связи. Текст незаполненной заявки не сохраняется.',decline:'Отклонить аналитику',accept:'Разрешить аналитику'},
  es:{label:'Consentimiento de análisis',body:'Para mejorar el sitio, nos gustaría contar visitas y clics en enlaces de contacto. Nunca registramos el texto de un formulario sin enviar.',decline:'Rechazar análisis',accept:'Permitir análisis'}
};
export function AnalyticsTracker({locale}:{locale:Locale}){
  const pathname=usePathname();const [consent,setConsent]=useState<'yes'|'no'|''>('');
  useEffect(()=>{queueMicrotask(()=>setConsent(cookie('analytics_consent') as 'yes'|'no'|''));},[]);
  useEffect(()=>{if(consent==='yes')trackEvent('page_view');},[pathname,consent]);
  useEffect(()=>{if(consent!=='yes')return;void drainEvents();const timer=setInterval(()=>{if(document.visibilityState==='visible')void drainEvents();},15000);const visible=()=>{if(document.visibilityState==='visible')void drainEvents();else flushBeacons();};const online=()=>void drainEvents();window.addEventListener('online',online);document.addEventListener('visibilitychange',visible);window.addEventListener('pagehide',flushBeacons);return()=>{clearInterval(timer);window.removeEventListener('online',online);document.removeEventListener('visibilitychange',visible);window.removeEventListener('pagehide',flushBeacons);};},[consent]);
  useEffect(()=>{
    function click(event:MouseEvent){const target=event.target as HTMLElement;const anchor=target.closest('a');if(!anchor)return;const href=anchor.getAttribute('href')||'';const placement=anchor.dataset.trackPlacement||(anchor.classList.contains('whatsapp-float')?'floating':anchor.closest('header')?'header':anchor.closest('footer')?'footer':'page');
      if(anchor.dataset.trackEvent==='address_click')trackEvent('address_click',{placement});
      else if(href.includes('wa.me/'))trackEvent('whatsapp_click',{placement});
      else if(href.includes('#inquiry')||href.includes('#product-inquiry'))trackEvent('form_cta_click',{placement});
    }
    document.addEventListener('click',click,true);return()=>document.removeEventListener('click',click,true);
  },[]);
  function choose(value:'yes'|'no'){document.cookie=`analytics_consent=${value}; Path=/; Max-Age=15552000; SameSite=Lax; Secure`;if(value==='no')saveQueue([]);setConsent(value);window.dispatchEvent(new Event('analytics-consent-changed'));}
  const copy=consentCopy[locale];
  return consent?null:<div className="analytics-consent" role="dialog" aria-label={copy.label}><p>{copy.body}</p><div><button onClick={()=>choose('no')}>{copy.decline}</button><button onClick={()=>choose('yes')}>{copy.accept}</button></div></div>;
}
