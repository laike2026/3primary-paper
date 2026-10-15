import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';
import {can,currentAdmin} from '@/lib/admin/auth';
import {InquiriesManager} from '@/components/admin/InquiriesManager';
export const dynamic='force-dynamic';
export default async function InquiriesPage(){const user=await currentAdmin();if(!user)redirect('/admin/login');if(!can(user.role,'inquiries:read'))notFound();return <InquiriesManager canWrite={can(user.role,'inquiries:write')} canExport={can(user.role,'inquiries:export')}/>;}
