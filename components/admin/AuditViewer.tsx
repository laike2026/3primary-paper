'use client';
import {useCallback,useEffect,useState} from 'react';
type Row={id:number;actor:string|null;actor_email:string|null;action:string;entity_type:string;entity_id:string;created_at:string;details:Record<string,unknown>};
export function AuditViewer(){
  const [items,setItems]=useState<Row[]>([]),[page,setPage]=useState(1),[total,setTotal]=useState(0),[q,setQ]=useState(''),[action,setAction]=useState(''),[entity,setEntity]=useState(''),[error,setError]=useState('');
  const query=new URLSearchParams({page:String(page),q,action,entity}).toString();
  const load=useCallback(async()=>{const r=await fetch(`/api/admin/audit?${query}`);const b=await r.json();if(r.ok){setItems(b.items);setTotal(b.total);setError('');}else setError(b.error);},[query]);
  useEffect(()=>{void Promise.resolve().then(load);},[load]);
  return <><div className="admin-page-heading"><div><small>安全审计</small><h1>操作审计</h1><p>记录后台登录、内容发布、询盘跟进、账号与系统设置操作。</p></div></div>
    <div className="admin-toolbar"><input className="admin-input" placeholder="操作人或对象编号" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}}/><input className="admin-input" placeholder="动作，如 login" value={action} onChange={e=>{setAction(e.target.value);setPage(1);}}/><input className="admin-input" placeholder="对象，如 product" value={entity} onChange={e=>{setEntity(e.target.value);setPage(1);}}/><a className="admin-secondary" href={`/api/admin/audit?${query}&format=csv`}>导出 CSV</a></div>
    {error&&<p className="admin-error">{error}</p>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>时间</th><th>操作人</th><th>动作</th><th>对象</th><th>编号</th><th>详情</th></tr></thead><tbody>{items.map(row=><tr key={row.id}><td>{new Date(row.created_at).toLocaleString('zh-CN')}</td><td>{row.actor||'系统'}<small>{row.actor_email||''}</small></td><td>{row.action}</td><td>{row.entity_type}</td><td>{row.entity_id}</td><td><details><summary>查看</summary><pre>{JSON.stringify(row.details,null,2)}</pre></details></td></tr>)}</tbody></table></div><div className="admin-pager"><span>共 {total} 条</span><button disabled={page===1} onClick={()=>setPage(page-1)}>上一页</button><button disabled={page*20>=total} onClick={()=>setPage(page+1)}>下一页</button></div></>;
}
