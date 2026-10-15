import type {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '3PRIMARY Paper',
    short_name: '3PRIMARY',
    description: 'Paper solutions for global business procurement.',
    start_url: '/en',
    scope: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#263b2e',
    icons: [
      {src: '/images/brand/icon-192.png', sizes: '192x192', type: 'image/png'},
      {src: '/images/brand/icon-512.png', sizes: '512x512', type: 'image/png'}
    ]
  };
}
