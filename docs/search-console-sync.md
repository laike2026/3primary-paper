# Search Console data sync setup

The admin dashboard reads Google Search Console search performance for the verified Domain property `sc-domain:tpc-paper.com`. The Vercel project `laike2026/3primary-paper` has these **Production** environment variables:

| Variable | Type | Value or source |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Secret, server only | JSON credential for `tpc-paper-com@formal-outpost-511601-m4.iam.gserviceaccount.com` |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Config | `sc-domain:tpc-paper.com` |

The service account is listed as a **Full** user of the Search Console Domain property. The source JSON file stays outside Git; never copy its private key into a public environment variable, a client component, or a committed file. When rotating the key, update the Vercel Secret and redeploy the consuming application.

## Activation and verification

On October 15, 2026, `searchconsole.googleapis.com` was enabled in Google Cloud project `formal-outpost-511601-m4`. A read-only service account test obtained an OAuth token, returned HTTP 200 from `GET https://www.googleapis.com/webmasters/v3/sites`, and listed `sc-domain:tpc-paper.com` with `siteFullUser` permission. A Search Analytics query for October 1–14 returned HTTP 200 with zero rows. The Search Console UI still showed “Processing data”; wait for Google to collect search activity before expecting nonempty reports.

## Current synchronization

The server reads `GOOGLE_SERVICE_ACCOUNT_JSON` and `GOOGLE_SEARCH_CONSOLE_SITE_URL` only on protected server routes. Admin login queues missing dates; `/api/cron/sync` runs every 30 minutes and continues the queue even when nobody logs in. Search Console data is requested through two calls per day: a date-only total for the dashboard and paginated page/query/country/device detail for drilldowns. Recent days refresh after 72 hours, while failed jobs use bounded retries. The report displays the latest stored date, queued jobs and exhausted jobs. A successful query with zero clicks still stores a dated zero-total row, so it can be distinguished from an unsynchronized date.

The separate Sunday `/api/cron/sitemap` job submits the current sitemap as the site's weekly update. Search Console may still delay or omit search data, and submitting the sitemap does not guarantee indexing.
