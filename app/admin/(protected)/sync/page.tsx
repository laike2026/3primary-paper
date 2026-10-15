import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';
import {can,currentAdmin} from '@/lib/admin/auth';
import {SyncManager} from '@/components/admin/SyncManager';
export const dynamic='force-dynamic';
export default async function SyncPage(){const user=await currentAdmin();if(!user)redirect('/admin/login');if(!can(user.role,'sync:read'))notFound();return <SyncManager canRun={can(user.role,'sync:run')}/>;}
