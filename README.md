# 3PRIMARY global B2B website

Next.js website for Zhejiang Three Primary Colors Paper Co., Ltd., with English, Arabic, Russian and Spanish pages. The visual direction follows the supplied homepage reference while product records and company claims are limited to traceable sources.

## Run locally

Requires Node.js 24 and pnpm 11.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000/en`. The site can be browsed without service credentials. The online inquiry endpoint returns a visible unavailable response until its database and email variables are configured; direct email and WhatsApp links remain usable.

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
- `db/001_inquiries.sql`: dedicated inquiry table
- `public/images`: original logo, sourced product photos and generated illustrative art
- `public/downloads`: localized RFQ checklists
- `tests`: content invariants and browser flows

See [deployment instructions](docs/deployment.md), [source and claim register](docs/content-evidence.md), [design notes](docs/design-system.md) and [QA report](docs/qa-report.md).
The [maintenance guide](docs/maintenance.md) covers product publication, translations, inquiry records and release updates.
The [Search Console sync setup](docs/search-console-sync.md) records the server credential and property configuration for the future admin dashboard.

## Release and rollback

Use GitHub as the source of truth. Keep production on the protected default branch and test changes through a Vercel Preview deployment. Promote a tested commit to production only after the production hostname and service credentials have been confirmed. Roll back by restoring a previous Vercel deployment or reverting the commit, then retest the inquiry flow.
