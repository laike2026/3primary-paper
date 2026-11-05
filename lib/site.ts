const address = 'Room 206, 2nd Floor, Building 4, West of Phoenix Mountain, No. 8, Anji Avenue, Changshuo Subdistrict, Anji County, Huzhou City, Zhejiang Province.';

export const site = {
  company: 'Zhejiang Three Primary Colors Paper Co., Ltd.',
  phone: '+86 13661927136',
  phoneHref: 'tel:+8613661927136',
  whatsapp: 'https://wa.me/8613661927136',
  email: 'alex.chen@3primary.com',
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
  address,
  mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
  logo: '/images/brand/official-logo.jpg',
  organizationLogo: '/images/brand/organization-logo.png',
  socialImage: '/images/brand/social-preview.jpg',
  origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
};

export const isIndexingEnabled = process.env.VERCEL_ENV === 'production' && process.env.INDEXING_ENABLED === 'true' && Boolean(process.env.NEXT_PUBLIC_SITE_URL);
