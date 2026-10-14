export const site = {
  company: 'Zhejiang Three Primary Colors Paper Co., Ltd.',
  phone: '+86 13661927136',
  phoneHref: 'tel:+8613661927136',
  whatsapp: 'https://wa.me/8613661927136',
  email: 'alex.chen@3primary.com',
  // The supplied address differs from the address on the legacy site; keep it out of public pages until reconciled.
  address: null as string | null,
  logo: '/images/brand/official-logo.jpg',
  origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
};

export const isProduction = process.env.VERCEL_ENV === 'production' && Boolean(process.env.NEXT_PUBLIC_SITE_URL);
