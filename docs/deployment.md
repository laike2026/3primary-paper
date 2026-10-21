# 3PRIMARY deployment and release

## Current resources

- Public GitHub repository: `laike2026/3primary-paper`.
- Vercel project: `laike2026/3primary-paper`, Production branch `codex/website-build`, domain `tpc-paper.com`.
- Vercel-managed Neon database `3primary-paper-admin`, connected to Production and Preview with Preview branching. `DATABASE_URL` is for runtime; `DATABASE_URL_UNPOOLED` is for migrations.
- Public Vercel Blob store `3primary-media`, connected to Production and Preview. Only public website assets belong there.
- Google Search Console domain property `sc-domain:tpc-paper.com`; service account and API access are configured for Production. OAuth and Search Analytics returned HTTP 200 in a local credential test on 15 Oct 2026. The tested day had zero rows; the dashboard must show this honestly.
- `INQUIRY_HASH_SECRET`, `CRON_SECRET`, `ADMIN_BOOTSTRAP_TOKEN` are server-side Vercel Secrets for Production and Preview. They require a fresh deployment to take effect.

Never commit credentials, database URLs, exported inquiry records or local `.env.local`. Use a Git author identity linked to `laike2026` so Vercel accepts Git deployments.

## Preview workflow

1. Push a feature branch. Vercel builds a Preview deployment using the Preview Neon branch and Blob connection.
2. Apply database migrations to the Preview branch if the integration has not applied them automatically; seed its content once when empty. This must precede admin API testing.
3. Test `/admin/login`, `/admin/setup` if no initial account exists, role permissions, product edit and public page, inquiry submission, the tracking funnel, media upload, health check, all four locales, robots and sitemap.
4. Preview remains `noindex`; it does not change DNS or the Production branch. Do not use its hostname as canonical metadata.

## Production launch

After the one-time acceptance of the Preview, merge/promote the reviewed commit to `codex/website-build`. Verify the new Vercel deployment, `/api/health`, the domain certificate, products and content, form storage, WhatsApp and address links, mobile layout and four languages. Keep `INDEXING_ENABLED=false` until the official street address, claims, metadata, canonical, sitemap, robots and notification delivery have been checked.

The initial admin can activate a username account at `/admin/setup` with the initialization token and a strong password. A verified recovery email may be bound later in account management. The setup API closes after the first user is created. Never commit a password or store its plaintext in application data.

Inquiry storage works with Neon even when mail is unavailable. The public contact and inquiry notification recipient is `info@tpc-paper.com`. To enable notifications and password reset, verify a sending domain and set `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL` and `INQUIRY_NOTIFY_EMAIL=info@tpc-paper.com` in Vercel, then perform one authorized inbox delivery test. Notification jobs retry without discarding stored inquiries. The official English address and HTTPS map link must be confirmed before they can be saved to public contact settings.

## Rollback and recovery

Roll back the Vercel deployment or revert the Git commit for application changes. Database schema changes are forward migrations; do not assume a code rollback reverses data changes. Use a Neon recovery point or the encrypted backup procedure in [admin operations](admin-operations.md), restore into an empty separate database and verify counts and pages before cutover. Application-data backups do not contain Blob file bytes.
