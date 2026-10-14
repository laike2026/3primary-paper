import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const config: NextConfig = {
  reactStrictMode: true,
  images: {formats: ['image/avif', 'image/webp']},
  async redirects() {
    return [
      {source:'/en/products.html', destination:'/en/products', permanent:true},
      {source:'/en/contactus.html', destination:'/en/contact', permanent:true},
      {source:'/en/aboutus.html', destination:'/en/about', permanent:true}
    ];
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        {key: 'X-Content-Type-Options', value: 'nosniff'},
        {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
        {key: 'X-Frame-Options', value: 'SAMEORIGIN'},
        {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'}
      ]
    }];
  }
};

export default createNextIntlPlugin('./i18n/request.ts')(config);
