<img src="public/images/brand/official-logo.jpg" alt="3PRIMARY official logo" width="166" height="50" />

# 3PRIMARY global B2B website

Next.js website and Chinese management dashboard for Zhejiang Three Primary Colors Paper Co., Ltd., with English, Arabic, Russian and Spanish public pages. The visual direction follows the supplied homepage reference while product records and company claims are limited to traceable sources.

## Run locally

Requires Node.js 24 and pnpm 11.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000/en` for the public site and `/admin` for the dashboard. Copy `.env.example` to `.env.local` and configure Neon, Blob and server secrets. Apply `pnpm db:migrate`; use `pnpm db:seed` once on a new database to migrate the original site content. Public browsing works without service credentials, but online inquiry and admin features require the database.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Playwright starts a local server on port 3100 when none is already running. In CI, install its Chromium browser first. Local macOS testing uses Google Chrome if present.

## Structure

- `app/[locale]`: localized pages and metadata
- `lib/content.ts`: categories, products, applications and source URLs
- `lib/articles.ts`, `lib/copy.ts`, `messages/`: localized editorial and interface copy
- `app/api/inquiry/route.ts`: validated inquiry intake and email notification
- `app/admin`, `app/api/admin`: Chinese dashboard and permission-checked API
- `app/api/events`: consent-based interaction events for address, WhatsApp and forms
- `db/001_inquiries.sql`–`003_extended_workflows.sql`: versioned database schema
- `scripts/backup-data.mjs`: encrypted application-data backup and restore to an empty separate database
- `public/images`: original logo, sourced product photos and generated illustrative art
- `public/downloads`: localized RFQ checklists
- `tests`: content invariants and browser flows

See [deployment instructions](docs/deployment.md), [source and claim register](docs/content-evidence.md), [design notes](docs/design-system.md) and [QA report](docs/qa-report.md).
The [maintenance guide](docs/maintenance.md) covers product publication, translations, inquiry records and release updates.
The [Search Console sync setup](docs/search-console-sync.md) records the server credential and property configuration for the future admin dashboard.
The [brand asset guide](docs/brand-assets.md) records the official logo source, derived icon sizes, social preview and platform placements.
The [admin operations guide](docs/admin-operations.md) covers setup, roles, content and inquiries, analytics, backups, external dependencies and release checks.

## Release and rollback

Use GitHub as the source of truth. Keep production on the protected default branch and test changes through a Vercel Preview deployment. Promote a tested commit to production only after the production hostname and service credentials have been confirmed. Roll back by restoring a previous Vercel deployment or reverting the commit, then retest the inquiry flow.
