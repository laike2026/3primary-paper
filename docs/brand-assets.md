# 3PRIMARY brand assets

The company's legacy horizontal logo is preserved at 166 × 50 px as `public/images/brand/official-logo.jpg`. The November 10 approved update adds `primary-wordmark-20261110.svg`, a reconstruction of the existing wordmark outlines, globe detail and Chinese brand lettering. This is a reconstruction, not an original high-resolution master supplied by the company.

The site header and footer use the 1328 × 400 `official-logo-hd-20261110.png` derivative at the existing display size. The catalog renders the SVG geometry as vector paths. `organization-logo-20261110.png` places the complete mark on a 600 × 200 canvas for structured data. The blue symbol used by the favicon remains derived from the preserved original.

`pnpm assets:brand` reproducibly creates these derivatives from that source and the existing paper-product hero artwork:

| Asset | Use |
| --- | --- |
| `public/favicon.ico` | Browser tabs and bookmarks, with 16, 32 and 48 px frames |
| `public/images/brand/icon-{16,32,48,64,192,512}.png` | Small icon, Google favicon eligibility, web manifest and Vercel project avatar |
| `public/images/brand/apple-touch-icon.png` | iOS home-screen icon, 180 × 180 px |
| `public/images/brand/organization-logo.png` | Complete official wordmark on a 600 × 200 white canvas for Organization structured data |
| `public/images/brand/social-preview.jpg` | Branded 1200 × 630 link preview |

The square icon crops only the blue globe/paper glyph from the original wordmark. If the company later supplies an original SVG, AI or high-resolution transparent PNG, prefer that source and re-check every derivative before publishing. Do not recreate the vector master by enlarging the 166 × 50 JPEG.

The site exposes the icon, Apple icon and manifest through metadata; pages use the branded social preview and the home/About Organization schema uses the complete logo. Search Console has no direct logo-upload control for organic results. Google may choose the crawlable favicon and structured-data logo after the site is indexable and recrawled; placement is not guaranteed. Production indexing requires the intended site origin, production environment and `INDEXING_ENABLED=true`.

The public GitHub repository displays the official logo in README and uses the branded social preview in its repository settings. The Vercel project avatar uses `icon-512.png`. These are project-specific placements; the account-wide GitHub and Vercel avatars represent other projects and are left unchanged.
