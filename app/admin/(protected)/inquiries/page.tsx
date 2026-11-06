import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';
import {can,currentAdmin} from '@/lib/admin/auth';
import {InquiriesManager} from '@/components/admin/InquiriesManager';
export const dynamic='force-dynamic';
export default async function InquiriesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const user=await currentAdmin();
  if(!user)redirect('/admin/login');
  if(!can(user.role,'inquiries:read'))notFound();
  const params=await searchParams;
  const q=typeof params.q==='string' ? params.q.slice(0,120) : '';
  const status=params.status==='needs-followup' ? params.status : '';
  const assignee=params.assignee==='unassigned' ? params.assignee : '';
  const filters={q,status,assignee};
  return <InquiriesManager key={JSON.stringify(filters)} canWrite={can(user.role,'inquiries:write')}
    canExport={can(user.role,'inquiries:export')} initialFilters={filters}/>;
}
