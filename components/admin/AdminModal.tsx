'use client';
import {useEffect,useRef} from 'react';
export function AdminModal({children,onClose}:{children:React.ReactNode;onClose:()=>void}){
  const panel=useRef<HTMLElement>(null),close=useRef(onClose);
  useEffect(()=>{close.current=onClose;},[onClose]);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const elements=()=>Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')||[]).filter(el=>el.getClientRects().length>0);
    elements()[0]?.focus();
    const keydown=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close.current();}if(event.key==='Tab'){const items=elements(),first=items[0],last=items.at(-1);if(!first){event.preventDefault();return;}if(event.shiftKey&&(document.activeElement===first||!panel.current?.contains(document.activeElement))){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};
    document.addEventListener('keydown',keydown);return()=>{document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',keydown);previous?.focus();};
  },[]);
  return <div className="admin-modal-backdrop" onClick={event=>{if(event.currentTarget===event.target)onClose();}}><section ref={panel} className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">{children}</section></div>;
}
