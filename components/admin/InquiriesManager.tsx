'use client';
import {AdminIcon} from './AdminIcon';
import {AdminModal} from './AdminModal';
import {displayStatus} from '@/lib/admin/presentation';
import {useCallback,useEffect,useRef,useState} from 'react';
type Inquiry={id:string;created_at:string;name:string;company:string;email:string;phone:string;country:string;product_id:string;form_type:string;locale:string;status:string;notification_status:string;notification_attempts?:number;notified_at?:string;quantity?:string;requirements?:string;source_url?:string;referrer?:string;utm_source?:string;utm_medium?:string;utm_campaign?:string;assigned_to?:string|null;tags?:string[];duplicate_of?:string|null};
type Note={id:number;body:string;created_at:string;actor:string};
type Assignee={id:string;name:string;email:string};
const states=[['new','新询盘'],['pending_contact','待联系'],['contacted','已联系'],['qualified','有效线索'],['unqualified','无效线索'],['quoting','报价中'],['quoted','已报价'],['won','已成交'],['lost','未成交'],['spam','垃圾信息'],['archived','已归档']];
const label=(value:string)=>states.find(([key])=>key===value)?.[1]||value;
const notificationLabel:Record<string,string>={sent:'发信服务已受理',pending:'等待发送',failed:'发送失败，询盘已入库'};
const localDate=(value:string)=>new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
type InitialFilters={q:string;status:string;assignee:string};
export function InquiriesManager({canWrite,canExport,initialFilters}:{
  canWrite:boolean;canExport:boolean;initialFilters:InitialFilters;
}){
  const latestRequest=useRef(0);
  const [items,setItems]=useState<Inquiry[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[size,setSize]=useState(20),[q,setQ]=useState(initialFilters.q),[status,setStatus]=useState(initialFilters.status),[assignee,setAssignee]=useState(initialFilters.assignee),[country,setCountry]=useState(''),[product,setProduct]=useState(''),[source,setSource]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[sort,setSort]=useState('newest'),[selected,setSelected]=useState<Inquiry|null>(null),[selectedIds,setSelectedIds]=useState<string[]>([]),[notes,setNotes]=useState<Note[]>([]),[note,setNote]=useState(''),[assignees,setAssignees]=useState<Assignee[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const query=new URLSearchParams({page:String(page),size:String(size),q,status,assignee,country,product,source,from,to,sort}).toString();
  const load=useCallback(async(silent=false)=>{
    const requestId=++latestRequest.current;
    if(!silent){setBusy(true);setError('');}
    try {
      const response=await fetch('/api/admin/inquiries?'+query,{cache:'no-store'});
      const body=await response.json();
      if(requestId!==latestRequest.current)return;
      if(!response.ok)throw new Error(body.error);
      setItems(body.items);setTotal(body.total);
      if(!silent)setSelectedIds([]);
    } catch (cause) {
      if(!silent&&requestId===latestRequest.current)setError(cause instanceof Error?cause.message:'读取失败');
    } finally {
      if(requestId===latestRequest.current)setBusy(false);
    }
  },[query]);
  useEffect(()=>{void Promise.resolve().then(()=>load());},[load]);
  useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible'&&!selectedIds.length&&!selected)void load(true);},30000);return()=>clearInterval(timer);},[load,selectedIds.length,selected]);
  useEffect(()=>{fetch('/api/admin/inquiries/assignees').then(r=>r.json()).then(b=>setAssignees(b.items||[])).catch(()=>{});},[]);
  async function open(id:string){const res=await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`);const body=await res.json();if(!res.ok){setError(body.error);return;}setSelected(body.item);setNotes(body.notes);}
  async function update(values:Record<string,unknown>){if(!selected)return;const res=await fetch(`/api/admin/inquiries/${encodeURIComponent(selected.id)}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(values)});const body=await res.json();if(!res.ok){setError(body.error);return;}await open(selected.id);await load();}
  async function addNote(){if(!selected||!note.trim())return;const res=await fetch(`/api/admin/inquiries/${encodeURIComponent(selected.id)}/notes`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({body:note})});const body=await res.json();if(!res.ok){setError(body.error);return;}setNote('');await open(selected.id);}
  async function bulk(values:Record<string,unknown>){if(!selectedIds.length)return;if(!window.confirm(`确认修改 ${selectedIds.length} 条询盘？`))return;const res=await fetch('/api/admin/inquiries/bulk',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:selectedIds,...values})});const body=await res.json();if(!res.ok){setError(body.error);return;}await load();}
  async function exportCsv(){
    setError('');
    try {
      const response=await fetch('/api/admin/inquiries/export?'+query,{cache:'no-store'});
      if(!response.ok)throw new Error((await response.json()).error || '导出失败');
      const href=URL.createObjectURL(await response.blob());
      const download=document.createElement('a');
      download.href=href;
      download.download='3primary-inquiries.csv';
      download.click();
      setTimeout(()=>URL.revokeObjectURL(href),1000);
    } catch (cause) {setError(cause instanceof Error ? cause.message : '导出失败');}
  }
  const filterChange=(setter:(value:string)=>void)=>(event:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>{setter(event.target.value);setPage(1);};
  return <><div className="admin-page-heading"><div><small>销售线索</small><h1>询盘管理</h1></div>{canExport&&<button className="admin-secondary" onClick={exportCsv}><AdminIcon name="download"/>导出询盘</button>}</div>
    <div className="admin-toolbar"><input className="admin-input" aria-label="搜索询盘" placeholder="搜索编号、客户、公司、邮箱、电话" value={q} onChange={filterChange(setQ)}/><select aria-label="询盘状态" value={status} onChange={filterChange(setStatus)}><option value="">全部状态</option><option value="needs-followup">待跟进（新询盘或待联系）</option>{states.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select><select aria-label="负责人" value={assignee} onChange={filterChange(setAssignee)}><option value="">全部负责人</option><option value="unassigned">未分配</option>{assignees.map(user=><option key={user.id} value={user.id}>{user.name}</option>)}</select><input className="admin-input" aria-label="国家或地区" placeholder="国家或地区" value={country} onChange={filterChange(setCountry)}/><input className="admin-input" aria-label="产品编号" placeholder="产品编号" value={product} onChange={filterChange(setProduct)}/><input className="admin-input" aria-label="询盘来源" placeholder="来源" value={source} onChange={filterChange(setSource)}/><label>开始日期 <input type="date" value={from} onChange={filterChange(setFrom)}/></label><label>结束日期 <input type="date" value={to} onChange={filterChange(setTo)}/></label><select aria-label="排序" value={sort} onChange={filterChange(setSort)}><option value="newest">最新优先</option><option value="oldest">最早优先</option></select><select aria-label="每页条数" value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1);}}>{[10,20,50,100].map(n=><option key={n} value={n}>每页 {n}</option>)}</select><button className="admin-secondary" onClick={()=>void load()}><AdminIcon name="refresh"/>刷新</button></div>
    {canWrite&&<div className="admin-toolbar"><span>已选 {selectedIds.length} 条</span><select aria-label="批量修改状态" defaultValue="" onChange={e=>{if(e.target.value)bulk({status:e.target.value});e.target.value='';}}><option value="">批量修改状态</option>{states.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select><select aria-label="批量分配负责人" defaultValue="" onChange={e=>{if(e.target.value)bulk({assignedTo:e.target.value});e.target.value='';}}><option value="">批量分配负责人</option>{assignees.map(user=><option key={user.id} value={user.id}>{user.name}</option>)}</select></div>}
    {error&&!selected&&<p className="admin-error" role="alert"><AdminIcon name="warning"/>{error}</p>}
    <div className="admin-table-wrap admin-card-wrap"><table className="admin-table admin-card-table"><thead><tr>{canWrite&&<th><input type="checkbox" aria-label="选择本页询盘" checked={items.length>0&&items.every(x=>selectedIds.includes(x.id))} onChange={e=>setSelectedIds(e.target.checked?items.map(x=>x.id):[])}/></th>}<th>时间 / 编号</th><th>客户</th><th>产品 / 来源</th><th>国家</th><th>状态</th><th>通知</th><th>操作</th></tr></thead><tbody>{items.map(item=><tr key={item.id}>{canWrite&&<td data-label="选择"><input type="checkbox" aria-label={`选择 ${item.id}`} checked={selectedIds.includes(item.id)} onChange={e=>setSelectedIds(e.target.checked?[...selectedIds,item.id]:selectedIds.filter(x=>x!==item.id))}/></td>}<td data-label="时间 / 编号">{localDate(item.created_at)}<br/><small>{item.id}</small></td><td data-label="客户"><strong>{item.name}</strong><br/>{item.company}<br/><small>{item.email}</small>{item.duplicate_of&&<><br/><small>可能重复</small></>}</td><td data-label="产品 / 来源">{item.product_id||'待选型'}<br/><small>{item.form_type==='product'?'产品询盘':'联系表单'} / {item.utm_source||'直接访问'}</small></td><td data-label="国家">{item.country}</td><td data-label="状态"><span className="admin-pill" data-status={item.status}>{label(item.status)}</span></td><td data-label="通知"><span className="admin-pill" data-status={item.notification_status}>{notificationLabel[item.notification_status]||displayStatus(item.notification_status)}</span></td><td data-label="操作"><button onClick={()=>open(item.id)}><AdminIcon name="inquiries"/>查看 / 跟进</button></td></tr>)}</tbody></table>{!busy&&!items.length&&<div className="admin-empty"><AdminIcon name="empty"/>暂无符合条件的询盘</div>}</div><div className="admin-pager"><span>共 {total} 条 · 第 {page} 页</span><button disabled={page<=1} onClick={()=>setPage(page-1)}><AdminIcon name="chevronLeft"/>上一页</button><button disabled={page*size>=total} onClick={()=>setPage(page+1)}><AdminIcon name="chevronRight"/>下一页</button></div>
    {selected&&<AdminModal onClose={()=>setSelected(null)}><header><div><small>{selected.id}</small><h2 id="admin-dialog-title">{selected.company} · {selected.name}</h2></div><button onClick={()=>setSelected(null)}><AdminIcon name="close"/>关闭</button></header>{error&&<p className="admin-error" role="alert">{error}</p>}<div className="admin-detail-grid"><div><small>邮箱</small><a href={`mailto:${selected.email}`}>{selected.email}</a></div><div><small>电话</small><strong>{selected.phone||'—'}</strong></div><div><small>国家 / 语言</small><strong>{selected.country} / {selected.locale}</strong></div><div><small>产品 / 数量</small><strong>{selected.product_id||'待选型'} / {selected.quantity||'—'}</strong></div><div><small>来源</small><strong>{selected.utm_source||selected.source_url||'—'}</strong></div><div><small>重复关联</small><strong>{selected.duplicate_of||'无'}</strong></div><div><small>通知状态</small><strong>{notificationLabel[selected.notification_status]||displayStatus(selected.notification_status)}{selected.notified_at&&' · '+localDate(selected.notified_at)}</strong></div></div><div className="admin-panel"><h3>询盘内容</h3><p className="admin-message">{selected.requirements}</p></div>{canWrite&&<div className="admin-toolbar"><label>状态 <select value={selected.status} onChange={e=>update({status:e.target.value})}>{states.map(([key,name])=><option value={key} key={key}>{name}</option>)}</select></label><label>负责人 <select value={selected.assigned_to||''} onChange={e=>update({assignedTo:e.target.value||null})}><option value="">未分配</option>{assignees.map(user=><option key={user.id} value={user.id}>{user.name}</option>)}</select></label><label>标签（逗号分隔）<input defaultValue={(selected.tags||[]).join(', ')} onBlur={e=>{const tags=e.target.value.split(',').map(x=>x.trim()).filter(Boolean);if(JSON.stringify(tags)!==JSON.stringify(selected.tags||[]))update({tags});}}/></label></div>}<div className="admin-panel"><h3>跟进记录</h3>{canWrite&&<div className="admin-note-entry"><textarea value={note} onChange={e=>setNote(e.target.value)} aria-label="跟进备注" placeholder="记录客户沟通、报价和下一步"/><button className="admin-primary" onClick={addNote}><AdminIcon name="write"/>添加备注</button></div>}{notes.map(n=><div className="admin-note" key={n.id}><small>{n.actor||'管理员'} · {new Date(n.created_at).toLocaleString('zh-CN')}</small><p>{n.body}</p></div>)}{!notes.length&&<p className="admin-empty">暂无跟进记录</p>}</div></AdminModal>}
  </>;
}
