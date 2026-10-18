import type {MetadataRoute} from 'next';
import {site,isIndexingEnabled} from '@/lib/site';
export default function robots():MetadataRoute.Robots {return isIndexingEnabled?{rules:{userAgent:'*',allow:'/',disallow:['/api/','/admin']},sitemap:new URL('/sitemap.xml',site.origin).toString()}:{rules:{userAgent:'*',disallow:'/'}};}
