import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';
import {can,currentAdmin} from '@/lib/admin/auth';
import {AuditViewer} from '@/components/admin/AuditViewer';
export const dynamic='force-dynamic';
export default async function AuditPage(){const user=await currentAdmin();if(!user)redirect('/admin/login');if(!can(user.role,'audit:read'))notFound();return <AuditViewer/>;}
