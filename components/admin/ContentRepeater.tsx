'use client';
type Localized=Record<string,string>;
type Field='features'|'specifications'|'gallery'|'documents'|'sections';
const blank=():Localized=>({en:'',ar:'',ru:'',es:''});
const labels:Record<Field,string>={features:'产品卖点',specifications:'技术参数',gallery:'图片集',documents:'产品文件',sections:'文章正文段落'};
export function ContentRepeater({field,value,lang,readOnly,onChange}:{field:Field;value:unknown;lang:string;readOnly:boolean;onChange:(items:unknown[])=>void}){
  const items=Array.isArray(value)?value:[];
  function add(){onChange([...items,field==='features'?blank():field==='specifications'?{key:blank(),value:blank()}:field==='sections'?{heading:blank(),body:blank()}:'' ]);}
  function change(index:number,next:unknown){onChange(items.map((item,i)=>i===index?next:item));}
  function remove(index:number){onChange(items.filter((_,i)=>i!==index));}
  return <section className="admin-repeater wide"><div className="admin-repeater-head"><h3>{labels[field]} <small>· {lang}</small></h3>{!readOnly&&<button className="admin-secondary" type="button" onClick={add}>＋ 添加</button>}</div>{items.length===0&&<p>暂无内容</p>}{items.map((item,index)=><div className="admin-repeater-item" key={index}><strong>第 {index+1} 项</strong>
    {field==='features'&&<label>卖点描述<textarea disabled={readOnly} value={String((item as Localized)?.[lang]||'')} onChange={e=>change(index,{...(item as object),[lang]:e.target.value})}/></label>}
    {field==='specifications'&&<><label>参数名称<input disabled={readOnly} value={String(((item as {key:Localized})?.key||{})[lang]||'')} onChange={e=>change(index,{...(item as object),key:{...((item as {key:Localized})?.key||blank()),[lang]:e.target.value}})}/></label><label>参数值<input disabled={readOnly} value={String(((item as {value:Localized})?.value||{})[lang]||'')} onChange={e=>change(index,{...(item as object),value:{...((item as {value:Localized})?.value||blank()),[lang]:e.target.value}})}/></label></>}
    {field==='sections'&&<><label>段落标题<input disabled={readOnly} value={String(((item as {heading:Localized})?.heading||{})[lang]||'')} onChange={e=>change(index,{...(item as object),heading:{...((item as {heading:Localized})?.heading||blank()),[lang]:e.target.value}})}/></label><label>段落正文<textarea disabled={readOnly} value={String(((item as {body:Localized})?.body||{})[lang]||'')} onChange={e=>change(index,{...(item as object),body:{...((item as {body:Localized})?.body||blank()),[lang]:e.target.value}})}/></label></>}
    {(field==='gallery'||field==='documents')&&<label>{field==='gallery'?'图片 URL':'文件 URL'}<input disabled={readOnly} value={String(item||'')} placeholder="/images/... 或 https://..." onChange={e=>change(index,e.target.value)}/></label>}
    {!readOnly&&<button className="admin-danger" type="button" onClick={()=>remove(index)}>移除</button>}
  </div>)}</section>;
}
