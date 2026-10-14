# Design system and reference implementation

The supplied image establishes the visual language: white navigation, original 3PRIMARY logo, warm neutral hero, large editorial serif typography, dark forest green actions, thin gold accents, five product cards, customization band, production story, landscape section, conversion band and a quiet white footer.

## Components

| Area | Implementation |
| --- | --- |
| Navigation | Desktop links and product mega menu; compact mobile menu; locale switch keeps the current path |
| Hero | HTML headline and actions over an original generated product still life; RTL uses a mirrored background so Arabic copy has clear space |
| Product cards | Source based product photography, localized titles and real detail links |
| Inquiry | Inline validated form with visible pending, success and failure states; email fallback |
| Footer | Original logo, useful local links, real contact actions, privacy and terms |

The first five home sections follow the reference hierarchy closely. Applications, guides, FAQ and a full inquiry form follow to satisfy the expanded B2B information architecture in the brief. Layouts adapt at tablet and phone widths, including a 375 px overflow check. Arabic uses document level RTL direction and localized copy.

## Asset handling

- `public/images/brand/official-logo.jpg` is copied from the existing company site without redrawing or changing the lettering.
- Product photographs in `public/images/products` are sourced from existing company pages and converted to WebP.
- `hero-paper-studio.webp`, `oem-paper-studio.webp` and `forest-panorama.webp` are generated decorative art. They are not evidence of specific facilities or exact commercial SKUs.
- Existing about imagery remains in `public/images/sections/about-source-*.webp` for future approved edits; the current production page uses `about-source-13.webp`.

The reference screenshot contains labels and logos printed inside artwork. In this implementation the SEO critical headings and actions are real HTML, and the generated artwork has no imitated brand print.
