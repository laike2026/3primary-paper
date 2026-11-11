# Business data cleanup, 11 November 2026

The customer authorized removal of test and false records and of visible platform/generation references. A read-only production inventory preceded the cleanup. It found no test inquiries, no recorded synthetic visitor events and no explicit fixture accounts. The 52 stored search-data rows, three manually published buying guides, 13 published products and active owner account are retained.

The reviewed cleanup removes seven legacy verification worksheets, the unpublished material-claim product draft `TP-BPA-FREE`, and two superseded media-library entries (the previous carton artwork and catalog). These items are unverified or obsolete, not a finding that the company-supplied source documents themselves are fabricated. Complete original rows are kept privately for recovery. The supplier's approved media and company information remain available.

Business content, media-library links, history snapshots and exports use first-party URLs. Registered repository assets are selected only when their checksum matches the reviewed file index. New uploads are delivered through `/files/<id>`; their transport locations are private database columns and are excluded from business API responses. The file endpoint accepts only registered public-storage objects, rejects redirects/private hosts, limits response size and preserves file MIME types. Category and product references protect in-use media against removal. Old artwork and catalog paths redirect to their current approved versions.

## Controlled application

The normal build runs `scripts/apply-business-cleanup-20261111.mjs`. It is inactive unless `TPC_BUSINESS_CLEANUP_20261111` is explicitly set to `audit` or `apply`, and checks the production environment, intended project and `https://tpc-paper.com` origin. The audit stage is read-only. The apply stage installs additive migration `007_business_media.sql`, then archives and updates/deletes reviewed rows in one transaction. Full-row guards abort on concurrent edits; an advisory lock and marker make repeated application safe.

- Operation marker: `site_settings.key = business-data-cleanup-2026-11-11`.
- Private original rows: `business_cleanup_archive`, keyed by operation, table and original identity.
- Public cache revision: `business-data-2026-11-11`.
- Set the application flag back to `0` after production readback.

The private archive is not a business content collection and has no public or admin API. Encrypted backup creation includes it and resolves media from private transport fields, so first-party URLs do not break media recovery. Existing older backups remain supported.

## Validation and recovery

The dated output directory holds the original inventory, isolated database tests, desktop/mobile admin screenshots, API checks and production receipt. Validation covers real-data preservation, owner protection, idempotence, rollback on concurrent edits, media-reference protection, first-party links, export/history output and file delivery.

For recovery, disable the application flag first. Restore only selected original fields/rows from the private archive after checking for later human edits; preserve a new history version. The additive columns are compatible with the previous application release. Previous approved artwork and catalog files remain available as versioned source material. Do not rerun an old bulk import or reset the complete database.

This change cleans business-visible content and links. It does not delete the source repository, remove the hosting service, or represent the site's infrastructure as technically undiscoverable.
