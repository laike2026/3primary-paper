# Inner-page artwork and icon sources

The owner approved the inner-page mockups and asked to use generated imagery directly on 5 November 2026. These assets illustrate products and applications; factory photographs and published product records continue to come from the existing content library/CMS.

| Asset in `public/images/editorial` | Size | Usage |
| --- | --- | --- |
| `retail-pos.webp` | 1600 × 1000 | Retail/POS application story and product application section |
| `banking-atm.webp` | 1500 × 1000 | Banking/ATM application story |
| `logistics.webp` | 1500 × 1000 | Logistics application story |
| `color-paper.webp` | 1200 × 1200 | Color-paper category and product artwork |
| `roll-dimensions.webp` | 1500 × 650 | Roll width, diameter and core explanatory visual |
| `rfq-checklist.webp` | 1400 × 1000 | Resource hero, featured checklist and checklist detail |

All six editorial images were generated with Image Gen for this approved direction, inspected and exported as WebP. The dimension labels are real localized HTML and do not assert a particular product measurement. Existing uploaded CMS images retain precedence over the two legacy color-paper asset paths mapped to the new artwork.

UI icons use the installed **Phosphor Icons** library (`@phosphor-icons/react`, MIT), with a consistent light stroke. They are library assets rather than hand-drawn approximations. The supplied company logo is preserved.

Social marks are stored locally, with their original paths unchanged:

- WhatsApp: [WhatsApp green logo original SVG](https://commons.wikimedia.org/wiki/File:WhatsApp_Logo_green.svg), downloaded from `https://upload.wikimedia.org/wikipedia/commons/4/4c/WhatsApp_Logo_green.svg`. This is the recognizable WhatsApp artwork, not a generated replacement.
- Facebook: [2023 Facebook icon original SVG](https://commons.wikimedia.org/wiki/File:2023_Facebook_icon.svg), downloaded from `https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg`.

The floating WhatsApp link and footer use the same local mark and the configured public contact number. The button stays on the physical right side, vertically centered, including RTL pages. Its decorative pulse stops when the visitor requests reduced motion.

Facebook is displayed as a brand icon. It becomes a link when the company page URL is supplied through `NEXT_PUBLIC_FACEBOOK_URL`; no company account URL has been guessed.
