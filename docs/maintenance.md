# Website maintenance

The current site uses a structured TypeScript and JSON content layer. It does not require a paid CMS. Every content edit should be reviewed in a branch and pass the local checks before a Vercel Preview is promoted.

## Products and categories

Edit `lib/content.ts`. A product record needs a stable `id` and `slug`, one of the existing category slugs, four localized name/summary/application strings, an image in `public/images/products`, and a source URL. Mark it `draft` while information is being prepared; only `published` records flow into catalogs, detail routes and the sitemap. Mark discontinued entries `archived`. Avoid reusing slugs or IDs. Put verified sizes in `size`; leave unsupported technical fields absent.

Categories also live in `lib/content.ts`. Add a category only when it has a supported product family and approved localized wording. Applications refer to category slugs, so update those links if a category changes.

## Articles, FAQs and languages

Write news and blog articles in the admin only. Save each new article as a draft, review its localized text, then use the individual publish button. Articles cannot be scheduled or bulk imported. The homepage, blog, Resources page and sitemap read published CMS records automatically. Homepage FAQs and editorial copy live in `lib/copy.ts`; menu and form strings live in `messages/{locale}.json`. Run `pnpm test` to catch missing message keys and visit the Arabic page to check RTL layout.

## Brand, company details and media

The official logo path is defined in `lib/site.ts`. Keep the original lettering and color intact. Add other brand artwork only after rights are verified. `lib/site.ts` is also the central place for phone, WhatsApp, email and the confirmed address. Images are stored in `public/images`; update component references and alt text when replacing them. Put downloadable documents in `public/downloads` and link them from the Resources pages in each locale. Do not publish unverified capacity, certification or environmental figures.

## SEO and metadata

Each page calls `pageMetadata` from `lib/seo.ts` for localized title, description, canonical and reciprocal alternate URLs. Add a new page to `app/sitemap.ts` only when it is ready for all published locales. Preview builds remain blocked from indexing; the production environment requires the actual public `NEXT_PUBLIC_SITE_URL`. Review schema data in article, product and company pages after content changes.

## Inquiries and marketing source

Authorized staff can query the dedicated Neon `inquiries` table. It stores the reference ID, contact details, product, locale, source URL, referrer, UTM source/medium/campaign, notification status and timestamps. Limit database access to staff who handle inquiries. A `pending` notification status warrants checking the configured mail service and contacting the buyer through an authorized channel. Review and delete records according to the company's approved retention schedule; none is assumed here.

## Release and rollback

Push changes to the selected GitHub repository, verify CI and the Vercel Preview, then promote the approved commit. Check core pages, sitemap and a real inquiry after any backend change. If a release fails, restore the previous Vercel deployment or revert the Git commit, and retest. Update the local `docs/qa-report.md` with the release URL and test evidence.
