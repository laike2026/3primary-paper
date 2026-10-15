import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';
import {can,currentAdmin} from '@/lib/admin/auth';
import {config,type ContentKind} from '@/lib/admin/content';
import {ContentManager} from '@/components/admin/ContentManager';
export const dynamic='force-dynamic';
export default async function ContentPage({params}:{params:Promise<{kind:string}>}){const {kind}=await params;if(!config(kind))notFound();const user=await currentAdmin();if(!user)redirect('/admin/login');if(!can(user.role,'content:read'))notFound();return <ContentManager kind={kind as ContentKind} canWrite={can(user.role,'content:write')} canPublish={can(user.role,'content:publish')}/>;}
