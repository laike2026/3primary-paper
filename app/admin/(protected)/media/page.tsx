import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';
import {can,currentAdmin} from '@/lib/admin/auth';
import {MediaManager} from '@/components/admin/MediaManager';
export const dynamic='force-dynamic';
export default async function MediaPage(){const user=await currentAdmin();if(!user)redirect('/admin/login');if(!can(user.role,'media:read'))notFound();return <MediaManager canWrite={can(user.role,'media:write')}/>;}
