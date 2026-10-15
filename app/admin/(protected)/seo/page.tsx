import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';
import {can,currentAdmin} from '@/lib/admin/auth';
import {SeoReport} from '@/components/admin/SeoReport';
export const dynamic='force-dynamic';
export default async function SeoPage(){const user=await currentAdmin();if(!user)redirect('/admin/login');if(!can(user.role,'seo:read'))notFound();return <SeoReport canRun={can(user.role,'sync:run')} canWrite={can(user.role,'seo:write')}/>;}
