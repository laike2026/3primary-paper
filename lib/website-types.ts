import type {Localized} from './content';
export type WebsiteKind='about'|'factory'|'faq'|'download'|'review';
export type WebsiteContent={slug:string;kind:WebsiteKind;name:Localized;summary:Localized;body:Localized;image:string;file_url:string;topic:string;product_ids:string[];source:string;notes:string;status:'draft'|'published'|'archived';sort_order:number;updated_at?:string};
