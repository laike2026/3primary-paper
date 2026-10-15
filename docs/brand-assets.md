# 3PRIMARY brand assets

The company's legacy site supplies the official horizontal logo at 166 × 50 px. The original file is preserved as `public/images/brand/official-logo.jpg` and is used at native size in the site header, footer, GitHub README and social preview. No new lettering or colors are introduced.

`pnpm assets:brand` reproducibly creates these derivatives from that source and the existing paper-product hero artwork:

| Asset | Use |
| --- | --- |
| `public/favicon.ico` | Browser tabs and bookmarks, with 16, 32 and 48 px frames |
| `public/images/brand/icon-{16,32,48,64,192,512}.png` | Small icon, Google favicon eligibility, web manifest and Vercel project avatar |
| `public/images/brand/apple-touch-icon.png` | iOS home-screen icon, 180 × 180 px |
| `public/images/brand/organization-logo.png` | Complete official wordmark on a 600 × 200 white canvas for Organization structured data |
| `public/images/brand/social-preview.jpg` | Branded 1200 × 630 link preview |

The square icon crops only the blue globe/paper glyph from the official wordmark. The source has no high-resolution master, so large derivatives cannot gain genuine detail through enlargement. If the company later supplies an original SVG, AI or high-resolution transparent PNG, replace the source and re-check the crop coordinates and every derivative before publishing.

The site exposes the icon, Apple icon and manifest through metadata; pages use the branded social preview and the home/About Organization schema uses the complete logo. Search Console has no direct logo-upload control for organic results. Google may choose the crawlable favicon and structured-data logo after the site is indexable and recrawled; placement is not guaranteed. `INDEXING_ENABLED` stays `false` until the separate public launch checklist is complete.

The private GitHub repository displays the official logo in README. GitHub's social-preview upload is not available for this private repository in the current account state. The Vercel project has a separate avatar setting, but the currently connected dashboard account reports insufficient permission to upload it. Do not change the account-wide GitHub or Vercel avatars, because they represent other projects too.
