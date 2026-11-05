# Public inner-page design verification

The 17 owner-approved references are in `../design-previews/images/01-products.png` through `17-terms.png`. They range from 787 to 973 px wide and 1616 to 1998 px tall. These are full-page design images without a declared browser viewport. The rendered desktop comparison uses Chromium at 1440 × 1000 CSS px and device scale 1. Tablet and mobile checks use 840 × 1100 and 390 × 1000 CSS px. Localized mobile checks also use 390 × 844.

The side-by-side evidence in `output/qa` scales both columns to the same width. `comparison-01-products.jpg`, `comparison-02-product-category.jpg`, `comparison-03-product-detail.jpg` and `comparison-13-article-detail.jpg` show full pages. `comparison-inner-1.jpg` through `comparison-inner-4.jpg` compare the remaining layouts in focused first-screen crops. The screenshots and source images have different content lengths because the implementation uses published product data, live navigation and the existing legal copy. The QA baseline used the default catalog and FAQ states. It also covered the gallery and inquiry success states separately.

## Findings and fixes

- P2. Catalog introduction, category icon scale and title weight initially fell short of the approved desktop hierarchy. The title and introduction now form two columns, with larger icons and bold serif headings. See the updated `comparison-01-products.jpg`.
- P2. The tablet catalog split the final letter of “Products” at 840 px. The title now scales with the viewport. `catalog-tablet-final.jpg` shows the complete word and the adjacent intro.
- P2. Russian product and contact forms exceeded 390 px because long select options widened a grid track. The form columns now shrink within the viewport. English, Spanish, Arabic and Russian responsive checks completed without document overflow. The Arabic footer and contact block use left-to-right direction for the English address, company name and international phone number.
- P2. The mobile contact page hid the persistent WhatsApp control. The shared layout now keeps it on the right at the viewport midpoint on desktop and mobile. The browser checks confirmed visibility and centering on each inner-page screenshot and verified that reduced motion stops the pulse.
- P2. The first manufacturing hero used a split image, and a later overlay inherited a narrow grid track. The final hero spans the full container under the offset headline panel. See `manufacturing-final.jpg`. Brand, resource and guide heroes and FAQ and legal icons are visible in the revised comparison sheets.
- P2. The category page omitted the comparison region shown in the source. It now uses published items, listed sizes and applications. Narrow screens scroll the table inside its own container. See the updated `comparison-02-product-category.jpg`.

## Fidelity and interactions

- Typography and rhythm use serif display headings, sans-serif body copy, thin dividers and wider spacing at large viewports. Focused mobile contact and tablet catalog captures show the form labels, headline wraps and control sizes. Layouts stack at mobile widths.
- The ivory base and forest green controls follow the reference palette. Native form controls and keyboard focus retain visible borders. FAQ and catalog controls expose their selected states. Arabic uses right-to-left layout with isolated left-to-right contact details.
- Real product and factory imagery uses the existing content library. Six generated WebP images supply the new editorial scenes and diagrams. The product, resource and application comparisons show their use at the intended sizes. Social marks are the original WhatsApp and Facebook artwork. See `docs/interior-assets.md`.
- The copy and product tables use the current CMS records and localized text. The desktop article detail comparison used a temporary local article because the local CMS contains no published articles. The fixture was removed and the production build was rebuilt with the existing publish gate. The Facebook mark awaits the verified company URL before it becomes a link.
- The final Playwright visual run passed 50 checks with zero page errors. Catalog category filtering returned three items and the `80x80` search returned one. The FAQ filter and accordion, gallery thumbnails, inquiry anchor and a mocked form success passed. The prior article fixture run passed both desktop and mobile article renders. Evidence is in `output/qa/results.json` and the screenshot files above.

## Follow-up polish

Approved designs use illustrative product counts, individual names and brand-packaging compositions. The production version uses its existing catalog, product galleries and approved company photographs. The differences in copy length, card count and hero crop are expected.

final result: passed
