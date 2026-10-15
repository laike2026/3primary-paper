# Search Console data sync setup

The future admin dashboard will read Google Search Console search performance for the verified Domain property `sc-domain:tpc-paper.com`. The Vercel project `laike2026/3primary-paper` has these **Production** environment variables:

| Variable | Type | Value or source |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Secret, server only | JSON credential for `tpc-paper-com@formal-outpost-511601-m4.iam.gserviceaccount.com` |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Config | `sc-domain:tpc-paper.com` |

The service account is listed as a **Full** user of the Search Console Domain property. The source JSON file stays outside Git; never copy its private key into a public environment variable, a client component, or a committed file. When rotating the key, update the Vercel Secret and redeploy the consuming application.

## Activation and verification

On October 15, 2026, `searchconsole.googleapis.com` was enabled in Google Cloud project `formal-outpost-511601-m4`. A read-only service account test obtained an OAuth token, returned HTTP 200 from `GET https://www.googleapis.com/webmasters/v3/sites`, and listed `sc-domain:tpc-paper.com` with `siteFullUser` permission. A Search Analytics query for October 1–14 returned HTTP 200 with zero rows. The Search Console UI still showed “Processing data”; wait for Google to collect search activity before expecting nonempty reports.

## Admin implementation contract

When the admin backend is built, load `GOOGLE_SERVICE_ACCOUNT_JSON` only in server code, request the `https://www.googleapis.com/auth/webmasters.readonly` OAuth scope, and use `GOOGLE_SEARCH_CONSOLE_SITE_URL` as the `siteUrl` for Search Analytics queries. Fetch daily search metrics with bounded date windows and pagination, then upsert rows and record the last successful sync time. Handle empty responses and Google's data delay without treating them as errors. Protect the admin read and sync endpoints with the future admin authentication and authorization system.

These environment variables prepare access; they do not schedule imports, store reports, or display a dashboard yet. A deployment created before the variables were added does not automatically gain them; redeploy when the consuming backend is added.
