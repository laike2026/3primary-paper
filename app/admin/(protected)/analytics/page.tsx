import {redirect} from 'next/navigation';
import {notFound} from 'next/navigation';
import {can,currentAdmin} from '@/lib/admin/auth';
import {AnalyticsReport} from '@/components/admin/AnalyticsReport';
export const dynamic='force-dynamic';
export default async function Analytics(){const user=await currentAdmin();if(!user)redirect('/admin/login');if(!can(user.role,'analytics:read'))notFound();return <AnalyticsReport mode="traffic"/>;}
