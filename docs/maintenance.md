# Website maintenance

The current site uses a Chinese admin CMS backed by Neon for product categories, products, news categories, articles, media, inquiries and contact settings. Static translations, some page copy, FAQ and downloads remain in the repository. Code changes should pass local checks before deployment.

## Products and categories

Use the admin product editor. A product record needs a stable ID and slug, an existing category, approved localized text, an image and verified specifications. Save as draft while preparing; only published records flow into catalogs, detail routes and the sitemap. Archive discontinued entries and avoid reusing slugs or IDs. The TypeScript content layer is a local fallback when the database is unavailable, not the production editing workflow.

Manage product categories in the admin. Add a category only when it has a supported product family and approved localized wording. Application pages still reference category slugs in code, so check those links if a category changes.

## Articles, FAQs and languages

Write news and blog articles in the admin only. Save each new article as a draft, review its localized text, then use the individual publish button. Articles cannot be scheduled or bulk imported. The homepage, blog, Resources page and sitemap read published CMS records automatically. Homepage FAQs and editorial copy live in `lib/copy.ts`; menu and form strings live in `messages/{locale}.json`. Run `pnpm test` to catch missing message keys and visit the Arabic page to check RTL layout.

## Brand, company details and media

The official logo path is defined in `lib/site.ts`. Keep the original lettering and color intact. The admin website settings control phone, WhatsApp, detailed address and map link; the public email remains in `lib/site.ts`. Images are stored in `public/images` or the admin media library; update alt text when replacing them. Put downloadable documents in `public/downloads` and link them from the Resources pages in each locale. Do not publish unverified capacity, certification or environmental figures.

## SEO and metadata

Each page calls `pageMetadata` from `lib/seo.ts` for localized title, description, canonical and reciprocal alternate URLs. Add a new page to `app/sitemap.ts` only when it is ready for all published locales. Preview builds remain blocked from indexing; the production environment requires the actual public `NEXT_PUBLIC_SITE_URL`. Review schema data in article, product and company pages after content changes.

## Inquiries and marketing source

Authorized staff can query the dedicated Neon `inquiries` table. It stores the reference ID, contact details, product, locale, source URL, referrer, UTM source/medium/campaign, notification status and timestamps. Limit database access to staff who handle inquiries. A `pending` notification status warrants checking the configured mail service and contacting the buyer through an authorized channel. Review and delete records according to the company's approved retention schedule; none is assumed here.

## Release and rollback

Push changes to the connected GitHub deployment branch, verify Vercel build and the production domain, then check core pages, sitemap and protected admin routes. For changes to the inquiry pipeline, test with a clearly marked record and remove it afterward when a safe cleanup path exists. If a release fails, restore the previous Vercel deployment or revert the Git commit, and retest. Add release evidence to the dated audit document.
