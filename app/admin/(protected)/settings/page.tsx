import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';
import {can,currentAdmin} from '@/lib/admin/auth';
import {SettingsManager} from '@/components/admin/SettingsManager';
export const dynamic='force-dynamic';
export default async function SettingsPage(){const user=await currentAdmin();if(!user)redirect('/admin/login');if(!can(user.role,'settings:read'))notFound();return <SettingsManager canWrite={can(user.role,'settings:write')}/>;}
