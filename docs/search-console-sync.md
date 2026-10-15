# Search Console data sync setup

The future admin dashboard will read Google Search Console search performance for the verified Domain property `sc-domain:tpc-paper.com`. The Vercel project `laike2026/3primary-paper` has these **Production** environment variables:

| Variable | Type | Value or source |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Secret, server only | JSON credential for `tpc-paper-com@formal-outpost-511601-m4.iam.gserviceaccount.com` |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Config | `sc-domain:tpc-paper.com` |

The service account is listed as a **Full** user of the Search Console Domain property. The source JSON file stays outside Git; never copy its private key into a public environment variable, a client component, or a committed file. When rotating the key, update the Vercel Secret and redeploy the consuming application.

## Remaining activation

The service account can obtain an OAuth token, but as of October 15, 2026 the Google Search Console API is disabled in Google Cloud project `formal-outpost-511601-m4`. Enable `searchconsole.googleapis.com` in that project, then confirm that `GET https://www.googleapis.com/webmasters/v3/sites` lists `sc-domain:tpc-paper.com`. The Search Console UI may show “Processing data” until Google has collected search activity.

## Admin implementation contract

When the admin backend is built, load `GOOGLE_SERVICE_ACCOUNT_JSON` only in server code, request the `https://www.googleapis.com/auth/webmasters.readonly` OAuth scope, and use `GOOGLE_SEARCH_CONSOLE_SITE_URL` as the `siteUrl` for Search Analytics queries. Fetch daily search metrics with bounded date windows and pagination, then upsert rows and record the last successful sync time. Handle empty responses and Google's data delay without treating them as errors. Protect the admin read and sync endpoints with the future admin authentication and authorization system.

These environment variables prepare access; they do not schedule imports, store reports, or display a dashboard yet. A deployment created before the variables were added does not automatically gain them; redeploy when the consuming backend is added.
