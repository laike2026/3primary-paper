import {notFound} from 'next/navigation';
import {can,currentAdmin} from '@/lib/admin/auth';
import {WebsiteManager} from '@/components/admin/WebsiteManager';
export const dynamic='force-dynamic';
export default async function WebsitePage(){const user=await currentAdmin();if(!user||!can(user.role,'content:read'))notFound();return <WebsiteManager canWrite={can(user.role,'content:write')} canPublish={can(user.role,'content:publish')}/>;}
