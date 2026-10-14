import type {Metadata} from 'next';
import Image from 'next/image';
import {PageHero} from '@/components/PageHero';
import {site} from '@/lib/site';
import {pageMetadata} from '@/lib/seo';
import type {Locale} from '@/i18n/routing';
const text={en:['Company Identity','Our official 3PRIMARY identity is shown here. Additional product brand marks will be added only after ownership and use rights are verified.'],ar:['هوية الشركة','نعرض هنا هوية 3PRIMARY الرسمية. ستضاف علامات المنتجات الأخرى بعد التحقق من الملكية وحقوق الاستخدام.'],ru:['Фирменный стиль','Здесь показан официальный знак 3PRIMARY. Другие товарные знаки появятся после проверки прав.'],es:['Identidad corporativa','Aquí mostramos la identidad oficial 3PRIMARY. Otras marcas se añadirán tras verificar titularidad y derechos de uso.']} as const;
export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return pageMetadata(locale,'/brands',text[locale][0],text[locale][1]);}
export default async function Brands({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;return <><PageHero locale={locale} path="/brands" title={text[locale][0]} intro={text[locale][1]}/><section className="inner-content"><div className="container two-column"><div style={{background:'#faf8f5',padding:35,display:'grid',placeItems:'center',minHeight:250}}><Image src={site.logo} alt="Official 3PRIMARY logo" width={332} height={100}/></div><div className="body-copy"><h2>{site.company}</h2><p>{text[locale][1]}</p></div></div></section></>;}
