'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

export function AuthForm({mode}:{mode:'login'|'setup'}){
  const router=useRouter();const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [visible,setVisible]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError('');const data=Object.fromEntries(new FormData(event.currentTarget).entries());
    try{if(mode==='setup'&&data.password!==data.confirmPassword)throw new Error('两次输入的密码不一致');const response=await fetch(`/api/admin/auth/${mode}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...data,remember:data.remember==='on'})});const body=await response.json();if(!response.ok)throw new Error(body.error||'请求失败');router.push('/admin');router.refresh();}
    catch(e){setError(e instanceof Error?e.message:'请求失败');}finally{setBusy(false);}
  }
  return <form className="admin-auth-form" onSubmit={submit}>
    {mode==='setup'&&<><label>初始化口令<input name="token" required autoComplete="off"/></label><label>管理员姓名<input name="name" required minLength={2} maxLength={100}/></label></>}
    <label>邮箱<input name="email" type="email" required autoComplete="email"/></label>
    <label>密码<span className="admin-password"><input name="password" type={visible?'text':'password'} required minLength={mode==='setup'?12:1} autoComplete={mode==='setup'?'new-password':'current-password'}/><button type="button" onClick={()=>setVisible(!visible)}>{visible?'隐藏':'显示'}</button></span></label>
    {mode==='setup'&&<label>再次输入密码<input name="confirmPassword" type={visible?'text':'password'} required minLength={12} autoComplete="new-password"/></label>}
    {mode==='login'&&<label className="admin-check"><input name="remember" type="checkbox"/> 记住我（30 天）</label>}
    {error&&<p className="admin-error" role="alert">{error}</p>}
    <button type="submit" className="admin-primary" disabled={busy}>{busy?'请稍候…':mode==='setup'?'创建管理员':'登录后台'}</button>
  </form>;
}
