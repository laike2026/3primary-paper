import type {Metadata} from 'next';
import './admin.css';
export const metadata:Metadata={title:'3PRIMARY 管理后台',robots:{index:false,follow:false},icons:{icon:[{url:'/favicon.ico'},{url:'/images/brand/icon-32.png',sizes:'32x32'}],apple:'/images/brand/apple-touch-icon.png'}};
export default function AdminRoot({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body className="admin-body">{children}</body></html>;}
