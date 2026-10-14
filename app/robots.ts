import type {MetadataRoute} from 'next';
import {site,isProduction} from '@/lib/site';
export default function robots():MetadataRoute.Robots {return isProduction?{rules:{userAgent:'*',allow:'/',disallow:['/api/']},sitemap:new URL('/sitemap.xml',site.origin).toString()}:{rules:{userAgent:'*',disallow:'/'}};}
