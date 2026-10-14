import {defineRouting} from 'next-intl/routing';

export const locales = ['en', 'ar', 'ru', 'es'] as const;
export type Locale = (typeof locales)[number];
export const routing = defineRouting({locales, defaultLocale: 'en', localePrefix: 'always'});
export const isLocale = (value: string): value is Locale => locales.includes(value as Locale);
