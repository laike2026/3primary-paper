import type {Locale} from '@/i18n/routing';

export type Localized = Record<Locale, string>;
export const local = (value: Localized, locale: Locale) => value[locale];

export type Category = {
  slug: string;
  updated_at?: string | Date;
  name: Localized;
  summary: Localized;
  image: string;
  source: string;
  description?:Localized;
  nav_visible?:boolean;
  seo?: {title?:Localized;description?:Localized;keywords?:string;canonical?:string;ogTitle?:Localized;ogDescription?:Localized;ogImage?:string;noindex?:boolean};
};

export const categories: Category[] = [
  {
    slug: 'thermal-paper-rolls', image: '/images/products/thermal-2.webp', source: 'http://3primarythermalpaper.com.cn/en/products/thermal-paper-43.html',
    name: {en: 'Thermal Paper Rolls', ar: 'لفائف الورق الحراري', ru: 'Рулоны термобумаги', es: 'Rollos de papel térmico'},
    summary: {en: 'Receipt and POS paper rolls for everyday business printing.', ar: 'لفائف إيصالات ونقاط بيع للطباعة التجارية اليومية.', ru: 'Бумага для чеков и POS-печати.', es: 'Rollos para recibos y puntos de venta.'}
  },
  {
    slug: 'thermal-jumbo-rolls', image: '/images/products/thermal-1.webp', source: 'http://3primarythermalpaper.com.cn/en/products/large-rolls-of-paper-154.html',
    name: {en: 'Thermal Jumbo Rolls', ar: 'لفائف حرارية كبيرة', ru: 'Большие рулоны термобумаги', es: 'Bobinas térmicas jumbo'},
    summary: {en: 'Large format rolls for converting and downstream production.', ar: 'لفائف كبيرة للتحويل والتصنيع اللاحق.', ru: 'Большие рулоны для переработки и дальнейшего производства.', es: 'Bobinas grandes para conversión y producción posterior.'}
  },
  {
    slug: 'thermal-labels', image: '/images/products/labels-1.webp', source: 'http://3primarythermalpaper.com.cn/en/products/label-83.html',
    name: {en: 'Thermal Labels', ar: 'ملصقات حرارية', ru: 'Термoэтикетки', es: 'Etiquetas térmicas'},
    summary: {en: 'Self-adhesive labels for identification and logistics.', ar: 'ملصقات ذاتية اللصق للتعريف والخدمات اللوجستية.', ru: 'Самоклеящиеся этикетки для маркировки и логистики.', es: 'Etiquetas autoadhesivas para identificación y logística.'}
  },
  {
    slug: 'carbonless-ncr-paper', image: '/images/products/carbonless-1.webp', source: 'http://3primarythermalpaper.com.cn/en/products/carbonless-paper-85.html',
    name: {en: 'Carbonless NCR Paper', ar: 'ورق نسخ بدون كربون', ru: 'Самокопирующаяся бумага NCR', es: 'Papel autocopiativo NCR'},
    summary: {en: 'Multi-part paper rolls and continuous business forms.', ar: 'لفائف متعددة النسخ ونماذج أعمال متصلة.', ru: 'Многослойные рулоны и непрерывные деловые бланки.', es: 'Rollos multicopia y formularios continuos.'}
  },
  {
    slug: 'color-paper', image: '/images/products/color-2.webp', source: 'http://3primarythermalpaper.com.cn/en/products/color-paper-84.html',
    name: {en: 'Color Paper', ar: 'ورق ملون', ru: 'Цветная бумага', es: 'Papel de color'},
    summary: {en: 'A range of light, medium and deep colored sheets.', ar: 'مجموعة أوراق بألوان فاتحة ومتوسطة وداكنة.', ru: 'Бумага светлых, средних и насыщенных оттенков.', es: 'Hojas en tonos claros, medios e intensos.'}
  },
  {
    slug: 'printed-paper', image: '/images/sections/oem-paper-studio.webp', source: 'http://3primarythermalpaper.com.cn/en/products/printing-paper-47.html',
    name: {en: 'Printed Paper Solutions', ar: 'حلول الورق المطبوع', ru: 'Решения для печатной бумаги', es: 'Soluciones de papel impreso'},
    summary: {en: 'Printed receipt rolls and continuous paper programs.', ar: 'لفائف إيصالات مطبوعة وبرامج ورق متصل.', ru: 'Печатные чековые рулоны и непрерывная бумага.', es: 'Rollos de recibos impresos y papel continuo.'}
  }
];

export type Product = {
  id: string;
  updated_at?: string | Date;
  slug: string;
  category: string;
  image: string;
  name: Localized;
  summary: Localized;
  application: Localized;
  size?: string;
  source: string;
  status: 'draft' | 'published' | 'archived';
  details?:Localized;
  features?:Localized[];
  specifications?:{key:Localized;value:Localized}[];
  gallery?:string[];
  documents?:string[];
  video_url?:string;
  moq?:string;
  lead_time?:string;
  price_mode?:string;
  price_min?:number|null;
  price_max?:number|null;
  featured?:boolean;
  pinned?:boolean;
  seo?: {title?:Localized;description?:Localized;keywords?:string;canonical?:string;ogTitle?:Localized;ogDescription?:Localized;ogImage?:string;noindex?:boolean};
};

export const productRecords: Product[] = [
  {
    id: 'TP-8080', slug: '80x80-thermal-paper-roll', category: 'thermal-paper-rolls', image: '/images/products/thermal-2.webp', size: '80 × 80 mm', status: 'published',
    source: 'http://3primarythermalpaper.com.cn/en/products/80x80-thermal-roll-97.html',
    name: {en: '80×80 Thermal Paper Roll', ar: 'لفة ورق حراري 80×80', ru: 'Терморулон 80×80', es: 'Rollo térmico 80×80'},
    summary: {en: 'A listed 80×80 receipt roll format for POS sourcing.', ar: 'مقاس مدرج 80×80 لإيصالات نقاط البيع.', ru: 'Формат 80×80 для закупки чековых рулонов POS.', es: 'Formato 80×80 para abastecimiento de recibos POS.'},
    application: {en: 'POS and receipt printing', ar: 'نقاط البيع وطباعة الإيصالات', ru: 'POS и печать чеков', es: 'POS e impresión de recibos'}
  },
  {
    id: 'TP-5740', slug: '57x40-thermal-paper-roll', category: 'thermal-paper-rolls', image: '/images/products/thermal-3.webp', size: '57 × 40 mm', status: 'published',
    source: 'http://3primarythermalpaper.com.cn/en/products/57x40-thermal-roll-102.html',
    name: {en: '57×40 Thermal Paper Roll', ar: 'لفة ورق حراري 57×40', ru: 'Терморулон 57×40', es: 'Rollo térmico 57×40'},
    summary: {en: 'Compact thermal roll format listed in the company catalog.', ar: 'مقاس لفة حرارية صغير مدرج في كتالوج الشركة.', ru: 'Компактный формат терморулона из каталога компании.', es: 'Formato compacto de rollo térmico del catálogo.'},
    application: {en: 'Compact receipt printers', ar: 'طابعات الإيصالات الصغيرة', ru: 'Компактные чековые принтеры', es: 'Impresoras compactas de recibos'}
  },
  {
    id: 'TP-JUMBO', slug: 'thermal-jumbo-roll', category: 'thermal-jumbo-rolls', image: '/images/products/thermal-1.webp', status: 'published',
    source: 'http://3primarythermalpaper.com.cn/en/products/large-rolls-of-paper-154.html',
    name: {en: 'Thermal Jumbo Roll', ar: 'لفة ورق حراري كبيرة', ru: 'Большой рулон термобумаги', es: 'Bobina térmica jumbo'},
    summary: {en: 'Large roll format for converters. Confirm width, grade and core when requesting a quote.', ar: 'صيغة كبيرة للمحوّلين. يرجى تحديد العرض والنوع والقلب عند طلب السعر.', ru: 'Большой рулон для переработчиков. При запросе цены уточните ширину, сорт и втулку.', es: 'Formato grande para convertidores. Confirme ancho, calidad y núcleo al solicitar precio.'},
    application: {en: 'Paper converting', ar: 'تحويل الورق', ru: 'Переработка бумаги', es: 'Conversión de papel'}
  },
  {
    id: 'TP-CORELESS', slug: 'coreless-thermal-roll', category: 'thermal-paper-rolls', image: '/images/products/thermal-2.webp', status: 'published',
    source: 'http://3primarythermalpaper.com.cn/en/products/coreless-thermal-roll-95.html',
    name: {en: 'Coreless Thermal Roll', ar: 'لفة حرارية بلا قلب', ru: 'Терморулон без втулки', es: 'Rollo térmico sin núcleo'},
    summary: {en: 'Coreless receipt roll option shown in the company catalog.', ar: 'خيار لفائف إيصالات بلا قلب وارد في كتالوج الشركة.', ru: 'Вариант чекового рулона без втулки из каталога компании.', es: 'Opción de rollo sin núcleo incluida en el catálogo.'},
    application: {en: 'Receipt printing', ar: 'طباعة الإيصالات', ru: 'Печать чеков', es: 'Impresión de recibos'}
  },
  {
    id: 'LB-THERMAL', slug: 'thermal-self-adhesive-label', category: 'thermal-labels', image: '/images/products/labels-1.webp', status: 'published',
    source: 'http://3primarythermalpaper.com.cn/en/products/thermal-self-adhesive-paper-sticker-113.html',
    name: {en: 'Thermal Self-Adhesive Label', ar: 'ملصق حراري ذاتي اللصق', ru: 'Самоклеящаяся термоэтикетка', es: 'Etiqueta térmica autoadhesiva'},
    summary: {en: 'Thermal label material for identification and print workflows.', ar: 'مادة ملصقات حرارية للتعريف والطباعة.', ru: 'Материал для термоэтикеток и маркировки.', es: 'Material térmico para identificación e impresión.'},
    application: {en: 'Identification and logistics', ar: 'التعريف والخدمات اللوجستية', ru: 'Маркировка и логистика', es: 'Identificación y logística'}
  },
  {
    id: 'NCR-ROLL', slug: 'carbonless-paper-roll', category: 'carbonless-ncr-paper', image: '/images/products/carbonless-1.webp', status: 'published',
    source: 'http://3primarythermalpaper.com.cn/en/products/multiply-carbonless-paper-roll-121.html',
    name: {en: 'Carbonless Paper Roll', ar: 'لفة ورق نسخ بدون كربون', ru: 'Рулон самокопирующейся бумаги', es: 'Rollo de papel autocopiativo'},
    summary: {en: 'Multi-part carbonless roll for business record formats.', ar: 'لفة نسخ متعددة لنماذج السجلات التجارية.', ru: 'Многослойный рулон для деловой документации.', es: 'Rollo multicopia para registros comerciales.'},
    application: {en: 'Multi-part business records', ar: 'السجلات متعددة النسخ', ru: 'Многослойные деловые документы', es: 'Registros comerciales multicopia'}
  },
  {
    id: 'NCR-CONT', slug: 'carbonless-continuous-form', category: 'carbonless-ncr-paper', image: '/images/products/carbonless-2.webp', status: 'published',
    source: 'http://3primarythermalpaper.com.cn/en/products/carbonless-paper-continuous-form-122.html',
    name: {en: 'Carbonless Continuous Form', ar: 'نموذج متصل بدون كربون', ru: 'Непрерывный самокопирующийся бланк', es: 'Formulario continuo autocopiativo'},
    summary: {en: 'Continuous carbonless form format listed by the company.', ar: 'صيغة نماذج متصلة بدون كربون مدرجة لدى الشركة.', ru: 'Формат непрерывных самокопирующихся бланков из каталога.', es: 'Formato continuo autocopiativo incluido en el catálogo.'},
    application: {en: 'Office forms', ar: 'النماذج المكتبية', ru: 'Офисные бланки', es: 'Formularios de oficina'}
  },
  {
    id: 'CP-COLOR', slug: 'color-paper-sheets', category: 'color-paper', image: '/images/products/color-2.webp', status: 'published',
    source: 'http://3primarythermalpaper.com.cn/en/products/color-paper-84.html',
    name: {en: 'Color Paper Sheets', ar: 'أوراق ملونة', ru: 'Цветные листы бумаги', es: 'Hojas de papel de color'},
    summary: {en: 'Colored paper range shown in the company product catalog.', ar: 'مجموعة الورق الملون المعروضة في كتالوج الشركة.', ru: 'Ассортимент цветной бумаги из каталога компании.', es: 'Gama de papel de color del catálogo de la empresa.'},
    application: {en: 'Printing and stationery', ar: 'الطباعة والقرطاسية', ru: 'Печать и канцелярия', es: 'Impresión y papelería'}
  },
  {
    id: 'PP-ATM', slug: 'printed-atm-receipt-roll', category: 'printed-paper', image: '/images/products/printing-1.webp', status: 'published',
    source: 'http://3primarythermalpaper.com.cn/en/products/atm-receipt-paper-rolls-112.html',
    name: {en: 'Printed ATM Receipt Roll', ar: 'لفة إيصالات صراف آلي مطبوعة', ru: 'Печатный рулон для чеков банкомата', es: 'Rollo impreso para recibos de cajero'},
    summary: {en: 'Printed paper roll format for ATM receipt applications.', ar: 'صيغة لفائف مطبوعة لإيصالات أجهزة الصراف الآلي.', ru: 'Печатный рулон для чеков банкомата.', es: 'Formato de rollo impreso para recibos de cajeros.'},
    application: {en: 'ATM receipts', ar: 'إيصالات الصراف الآلي', ru: 'Чеки банкомата', es: 'Recibos de cajero automático'}
  }
];

export const products = productRecords.filter(item => item.status === 'published');

export const categoryBySlug = (slug: string) => categories.find(item => item.slug === slug);
export const productBySlug = (slug: string) => products.find(item => item.slug === slug);

export type Application = {slug: string; name: Localized; summary: Localized; category: string};
export const applications: Application[] = [
  {slug: 'retail-pos', category: 'thermal-paper-rolls', name: {en: 'Retail & POS', ar: 'التجزئة ونقاط البيع', ru: 'Розница и POS', es: 'Comercio y POS'}, summary: {en: 'Receipt rolls selected around printer fit, paper grade and order volume.', ar: 'اختيار لفائف الإيصالات وفق ملاءمة الطابعة ونوع الورق وحجم الطلب.', ru: 'Подбор чековых рулонов по принтеру, сорту бумаги и объёму заказа.', es: 'Rollos elegidos según impresora, calidad del papel y volumen.'}},
  {slug: 'banking-atm', category: 'printed-paper', name: {en: 'Banking & ATM', ar: 'البنوك والصراف الآلي', ru: 'Банки и банкоматы', es: 'Banca y cajeros'}, summary: {en: 'Paper formats for ATM receipts and financial transaction records.', ar: 'صيغ ورقية لإيصالات الصراف وسجلات المعاملات.', ru: 'Бумага для чеков банкомата и финансовых операций.', es: 'Formatos para recibos de cajero y registros de transacciones.'}},
  {slug: 'logistics-warehousing', category: 'thermal-labels', name: {en: 'Logistics & Warehousing', ar: 'الخدمات اللوجستية والمستودعات', ru: 'Логистика и склады', es: 'Logística y almacenes'}, summary: {en: 'Label stock for product identification, sorting and shipment workflows.', ar: 'ملصقات لتعريف المنتجات والفرز والشحن.', ru: 'Этикетки для маркировки, сортировки и отгрузки.', es: 'Etiquetas para identificación, clasificación y envíos.'}},
  {slug: 'hospitality-restaurants', category: 'thermal-paper-rolls', name: {en: 'Hospitality & Restaurants', ar: 'الضيافة والمطاعم', ru: 'Гостиницы и рестораны', es: 'Hostelería y restaurantes'}, summary: {en: 'Receipt paper for payment, orders and customer service workflows.', ar: 'ورق إيصالات للدفع والطلبات وخدمة العملاء.', ru: 'Бумага для оплаты, заказов и обслуживания гостей.', es: 'Papel para pagos, pedidos y atención al cliente.'}},
  {slug: 'office-business-forms', category: 'carbonless-ncr-paper', name: {en: 'Office & Business Forms', ar: 'المكاتب والنماذج التجارية', ru: 'Офис и деловые бланки', es: 'Oficina y formularios'}, summary: {en: 'Carbonless and continuous forms for multi-part business records.', ar: 'نماذج بلا كربون ومتصلة للسجلات متعددة النسخ.', ru: 'Самокопирующиеся и непрерывные многослойные бланки.', es: 'Formularios autocopiativos y continuos para registros multicopia.'}}
];
