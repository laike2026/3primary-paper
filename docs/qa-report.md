# Local QA report — 14 Oct 2026

## Automated checks

| Check | Result |
| --- | --- |
| ESLint | Passed without warnings |
| TypeScript | Passed |
| Content tests | 2 passed: translation completeness and source backed product IDs |
| Production build | Passed; 154 static routes generated plus dynamic product index and inquiry API |
| Playwright | 9 passed: four locales, metadata and RTL, product search/filter and locale preservation, mobile menu and width, section routes and 404, checklist download and legacy redirect, unconfigured inquiry response |
| Sitemap simulation | 148 URLs checked; all returned HTTP 200 and each had five locale alternates (four locales plus `x-default`) |
| Lighthouse, local production simulation | Performance 90, Accessibility 100, Best Practices 100, SEO 100; local conditions are not a field measurement |
| Lighthouse, local Preview rules | Performance 95, Accessibility 100, Best Practices 100; SEO 54 because Preview intentionally sends `noindex` and uses no production canonical hostname |

## Visual review

Screenshots were captured from the running local production build and saved under ignored `output/playwright/`. Reviewed 1440 px and 1920 px English home pages, 390 px English and Arabic home pages, 1440 px Arabic home page, products, product detail, About, OEM and Contact. `document.documentElement.scrollWidth` equalled the viewport at every captured width. The supplied image served as the home page reference; additional B2B sections follow its core sequence.

## Remaining release gates

1. Confirm the GitHub/Vercel account pair for the new repository and Preview deployment.
2. Confirm the current street address and any approved production or capacity claims.
3. Provision dedicated Neon and Resend credentials; run a real stored inquiry and notification test.
4. Confirm a production hostname before enabling indexable metadata or changing DNS.

No production deployment, DNS change or live inquiry success claim is implied by local QA.

## Admin backend QA — 15 Oct 2026

The Chinese admin and consent-based tracking were added after the earlier public-site report. The older static-route count above describes the preceding release.

- Neon migrations `001`–`003` and original content seed completed: 6 product categories, 9 products, 3 articles.
- Authenticated API smoke checks passed against the connected Neon database: bootstrap, login, role denial, content create/publish/version/soft delete/restore, CSV export/import validation, media upload/search/edit, inquiry storage, redirects, events, analytics and audit export. Temporary records and Blob files were removed. The final production-build smoke run also passed actual CSV import, media soft deletion, inquiry notes, bulk status changes and inquiry CSV export.
- Google service account OAuth and Search Analytics API returned HTTP 200. The tested date had zero rows, so the dashboard displays empty real data rather than examples.
- Encrypted backup was verified, restored into separate disposable database `qa_restore_20261015`, compared against source counts and product lookup, then the disposable database was removed.
- ESLint, TypeScript, content tests and production build passed after the initial backend implementation. The final build completed after the last UI and tracking edits; ESLint and the two content tests passed. The production build performed its TypeScript check.
- Browser review of the local production build confirmed the official logo on admin login and sidebar, the protected dashboard, product list and structured editor, and the tracking panel. English analytics consent was corrected from Chinese. A consented browser session produced form_view, form_open, form_start, form_field_complete and page_view as separate database events, with the expected form placement and Shanghai date. Test events were removed.

`INDEXING_ENABLED=false` remains in effect pending the remaining production release gates below.

## Vercel Preview review — 15 Oct 2026

- Commit `d6de65b` on `codex/admin-backend` deployed automatically to `https://3primary-paper-h3mpqi48i-laike2026.vercel.app`; Vercel reports **Ready**.
- In the authenticated Preview browser session, English and Arabic public home pages rendered with published products. The Chinese admin login and first-admin setup pages rendered with the official logo.
- Admin login metadata returned `noindex, nofollow`; the official logo asset was served from the deployment.
- Direct unauthenticated HTTP requests reached Vercel Authentication. The connected Vercel API credential returned `403` for the protected-deployment fetch, so the live Preview health API was not verified through that route. Local health/API smoke checks passed as recorded above.
- Release gates remaining after Preview review: verified sender/notification delivery, owner's admin account, and confirmed address/map URL. Production branch and domain still point at the preceding website release.
