import type {Localized} from './content';

export type Article = {slug:string;title:Localized;intro:Localized;sections:{heading:Localized;body:Localized}[];author?:string;featured?:boolean;pinned?:boolean;updated_at?:string|Date;seo?:{title?:Localized;description?:Localized;keywords?:string;canonical?:string;ogTitle?:Localized;ogDescription?:Localized;ogImage?:string;noindex?:boolean}};
