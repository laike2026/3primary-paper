import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const config: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1','localhost'],
  images: {formats: ['image/avif', 'image/webp'],remotePatterns:[{protocol:'https',hostname:'**.public.blob.vercel-storage.com'}]},
  async redirects() {
    return [
      {source:'/en/products.html', destination:'/en/products', permanent:true},
      {source:'/en/contactus.html', destination:'/en/contact', permanent:true},
      {source:'/en/aboutus.html', destination:'/en/about', permanent:true}
    ];
  },
  async headers() {
    const privateHeaders = [
      {key: 'Cache-Control', value: 'private, no-store, max-age=0'},
      {key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive'},
    ];
    const indexing = process.env.VERCEL_ENV === 'production' && process.env.INDEXING_ENABLED === 'true';
    return [{
      source: '/(.*)',
      headers: [
        {key: 'X-Content-Type-Options', value: 'nosniff'},
        {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
        {key: 'X-Frame-Options', value: 'SAMEORIGIN'},
        {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
        {key: 'Content-Security-Policy', value: "base-uri 'self'; frame-ancestors 'self'; object-src 'none'; form-action 'self'"},
        ...(!indexing ? [{key: 'X-Robots-Tag', value: 'noindex, nofollow'}] : []),
      ]
    }, {source: '/admin/:path*', headers: privateHeaders},
    {source: '/api/admin/:path*', headers: privateHeaders}];
  }
};

export default createNextIntlPlugin('./i18n/request.ts')(config);
