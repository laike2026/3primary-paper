// Only this explicitly enabled, non-production preview uses reviewed local data.
export const isContentPreview = process.env.VERCEL_ENV === 'preview' && process.env.TPC_CONTENT_PREVIEW === '1';
