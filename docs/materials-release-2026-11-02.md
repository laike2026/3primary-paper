# Company materials release — 2 November 2026

Source: the company-supplied Desktop folder `网站资料收集包 4`. Source documents and historical sales replies remain outside the public repository. The public JSON contains only edited, publishable content.

## Content

- Enriched the existing POS, portable POS, ATM, label and jumbo records without changing their IDs or URLs.
- Added preprinted rolls, fanfold labels, thermal-transfer labels and custom stickers. The BPA/BPS-free item remains a draft. Total: 13 published products, 1 product draft, including retained NCR, coreless and colour-paper products.
- Published 20 procurement FAQs in English, Arabic, Russian and Spanish, six company-supplied production photographs, a company profile and one revised catalog entry.
- Kept seven internal review records covering conflicting addresses, certification/capacity claims, the original FAQ, old catalog, expanded range, BPA/BPS-free claims and template/blank news material. These records cannot be published through the website-content API.
- Registered 31 optimized images and the new PDF in the media library. The low-resolution production photo is retained for reference, not used as a large public image. Images carrying unverified BPA-free badges remain outside public assets.
- Created an eight-page English catalog, approximately 455 KB, with current product information and `info@tpc-paper.com`. It contains no conflicting address, certification or capacity claims. The older scanned catalog is retained privately.

## Maintenance

`/admin/website` provides company information, factory photography, FAQ, downloads and internal review tabs. All changes use existing content permissions and same-origin checks. Publishing requires four-language titles and applicable bodies; downloads require an image and file URL. Updates save a prior snapshot in `website_content_versions`. Draft, archived and review records are excluded from public queries. News publication remains manual.

Public pages read the database on each request, with React request-scoped deduplication. Public queries select no internal source notes. Product images use a thumbnail selector. Header menus, mobile navigation, resources, footer and contextual product FAQs link to the new content.

The existing confirmed public address was retained. Conflicting addresses in this new packet remain internal drafts and do not replace it. Both the public email and inquiry notification recipient are `info@tpc-paper.com`.

## Database and assets

Migration: `006_website_content.sql` (additive). Imported records are in the existing Neon database. Images and the revised PDF were uploaded to the project's existing public Blob store before content references were updated, avoiding missing images during rollout. The assets are also included in `public/` for independent builds.

`scripts/import-materials.mjs` imports the reviewed private manifest in one transaction, retains old product snapshots and records an idempotency marker. Do not commit the original private manifest. The pre-import encrypted backup is under ignored `output/`.

Application rollback uses the previous Vercel deployment/commit. The additive tables remain compatible with previous code. Product edits retain prior snapshots; restoring all data requires the encrypted backup procedure and an isolated restore target. The backup verifier accepts backups from before the new tables existed.

## Framework patch

Updated Next.js and its ESLint configuration from 16.4.0 to the security-patched 16.4.1. The official advisory identifies 16.4.1 as a patched version: https://github.com/advisories/GHSA-2464-fhr4-w9xw. The npm advisory endpoint returned no advisories for 16.4.1 during this release.

## Verification

Production build, TypeScript, ESLint, unit and browser tests. Real database/API verification covers anonymous and cross-origin denial, draft isolation, multilingual validation, review publication denial, publish/edit/archive visibility, saved versions and media records. Temporary verification rows and sessions are removed after testing. Visual inspection covers desktop, mobile and the revised catalog.

Inbox delivery requires the existing mail provider to be configured; no successful inbox-delivery test is claimed by this release. Notification routing now uses the confirmed site email directly, so a stale environment recipient cannot route inquiries elsewhere.
