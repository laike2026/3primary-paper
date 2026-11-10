# Approved product-content release, 10 November 2026

The customer approved all eight spreadsheet items and the linked corrections in this chat. This release updates the shared carton photograph, catalog logo and four-product cover, thermal-paper grammage, receipt-roll customization wording, Jumbo widths, and catalog contact details. It removes only the ATM entry from the PDF. The website ATM product and banking application pages remain available.

- Grammage for TP-8080, TP-5740, PP-ATM, TP-PRINTED and TP-JUMBO: 35 / 40 / 45 / 48 / 55 / 60 / 65 / 70 / 75 / 80 gsm.
- TP-8080: 80 × 80 mm / 80 × 70 mm, with custom sizes available.
- TP-5740: 57 × 50 mm / 57 × 40 mm / 57 × 30 mm, with custom sizes available.
- TP-JUMBO widths: 405 / 565 / 636 / 790 / 795 mm.
- Custom-size wording is localized in English, Arabic, Russian and Spanish. Numeric specifications are isolated as LTR content within RTL pages.
- The revised eight-page English catalog includes a short carbonless-paper entry based on the existing website products. Its contact section uses alex.chen@3primary.com, +86 13661927136 and the approved Anji address.

## Assets and rebuilding

The new artwork is `public/images/materials/product-01-2-20261110.webp`. Its front and side bold carton headings read PRIMARY PAPER ROLLS. The ImageGen edit preserves the product arrangement, carton, existing colored brand mark and smaller text.

The preserved original logo is still available as `public/images/brand/official-logo.jpg`. The new SVG master reconstructs its wordmark outlines, globe and Chinese lettering. It is not an original vector file supplied by the company. The catalog renders that master as vector paths; the website uses its 1328 × 400 PNG derivative.

- `node scripts/generate-brand-assets.mjs` rebuilds the website brand derivatives.
- `python scripts/build-catalog-20261110.py` rebuilds the PDF using ReportLab and Pillow. Windows Arial and Georgia are embedded when available; standard PDF fonts are the fallback.
- `node scripts/build-download-cover.mjs` rebuilds the four-product download thumbnail.
- `node scripts/content-release-assets.mjs` records the six asset checksums. Run this after any approved asset rebuild and before publication.

The current catalog is `/downloads/3primary-product-catalog-2026-11-10.pdf`. The previous site download path redirects once to it. Current product document links and download records use the final URL. Versioned Blob copies are retained alongside their matching media records. Previous files remain available for rollback.

## Production content application

The standard build invokes `scripts/apply-content-update-20261110.mjs`. It does nothing unless the project-specific production flag `TPC_CONTENT_RELEASE_20261110=1` is enabled. It also checks the production environment, intended site origin and Vercel project ID when supplied. Preview and local builds keep this flag inactive.

With the flag enabled, the script uses the project's existing environment-bound database and Blob clients. It never exports their credentials. The script validates local checksums, uploads only the six versioned release assets, then applies product, category and download-reference updates in one database transaction. It preserves unrelated fields and records full prior rows in content history and a release snapshot. Optimistic guards abort the transaction if an editor changes a selected row after the read.

- Marker: `site_settings.key = approved-content-2026-11-10`.
- Full prior rows: `site_settings.key = approved-content-2026-11-10-before`.
- Product/category history: `content_versions`.
- Download history: `website_content_versions`.
- Publish receipt: `admin_audit_log`, entity `content_release`.

An advisory transaction lock and marker make repeated deployment attempts safe. A completed marker skips repeat application, so later content editing is not overwritten on subsequent builds. Disable the production flag after the release has been verified. The public cache revision changes for this release so new builds read the approved data immediately.

## Validation and rollback

Run the existing lint, typecheck and production build, `node --test tests/*.test.mjs`, database transaction verification, browser checks across 320/390/768/1440 widths, and a fresh production crawl. Verify the five products in all four languages, Jumbo category tables, shared image references, downloads and matching Product schema. Keep the production release receipt and before/after evidence in the dated output directory.

The previous production deployment is `dpl_4SUhxZjkHstH5pqxKpZRAtnymV2k`, commit `ee6d44d1c50536f4b7dd40cac87c2215e265b9ab`. Disable the release flag before any rollback. Restore that deployment if application rollback is needed. Restore only this release's changed data fields from the saved prior rows or content history, after checking for later human edits. Preserve a new history version when restoring; do not reset version counters or run the older bulk materials import. Previous local and Blob asset URLs are preserved for that restoration. Vercel rollback pauses automatic alias assignment until the intended deployment is promoted again.
