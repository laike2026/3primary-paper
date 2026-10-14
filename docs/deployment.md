# Deployment and inquiry setup

## 1. Accounts and repository

Confirm the intended GitHub and Vercel account pair before writing to either account. Create a private repository for this source, push the tested commit, connect it to a new Vercel project and keep its default branch protected. The repo has no existing remote and no legacy deployment is overwritten.

Use `pnpm install --frozen-lockfile` and `pnpm build`. The application deliberately uses webpack for Next 16 builds in the current runtime.

## 2. Preview

Deploy the branch to Vercel Preview. Preview pages send `noindex, nofollow`, `robots.txt` disallows crawlers and `sitemap.xml` is empty. Validate the generated URL across all four locales before promotion.

Set `NEXT_PUBLIC_SITE_URL` to the chosen public origin when the production domain is known. Do not use a Preview hostname as the production canonical origin. There is no automatic DNS change.

## 3. Inquiry database and mail

Create a **dedicated** Neon Postgres project. Apply `db/001_inquiries.sql` with its direct connection string. Configure these Vercel environment variables separately for Preview and Production:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled Neon URL for serverless inquiry traffic |
| `RESEND_API_KEY` | Email API credential |
| `INQUIRY_FROM_EMAIL` | Verified sender address on an authorized domain |
| `INQUIRY_NOTIFY_EMAIL` | Destination, default `alex.chen@3primary.com` |
| `INQUIRY_HASH_SECRET` | Random server secret for hashed request IP rate limiting |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin for metadata and structured data |

Never commit real values. An unconfigured endpoint responds with HTTP 503 and the form directs the visitor to email; it does not fake success. With credentials configured, the endpoint validates fields, rejects a honeypot, limits repeated requests by hashed IP, stores the inquiry, sends a notification and returns an ID. Complete one authorized end to end test using a real receiving mailbox before considering the form live.

## 4. Production and rollback

Confirm the public hostname, correct company address, approved claim wording and successful inquiry notification. Then promote the tested commit. Verify canonical and `hreflang`, nonempty `sitemap.xml`, production `robots.txt`, every locale, the product path, search and a real inquiry. To roll back, restore the previous Vercel deployment or revert the Git commit. If the inquiry service fails, keep direct email and WhatsApp visible and repair the credentials or database separately.
