import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';
import {can,currentAdmin} from '@/lib/admin/auth';
import {UsersManager} from '@/components/admin/UsersManager';
export const dynamic='force-dynamic';
export default async function UsersPage(){const user=await currentAdmin();if(!user)redirect('/admin/login');if(!can(user.role,'users:read'))notFound();return <UsersManager canWrite={can(user.role,'users:write')}/>;}
