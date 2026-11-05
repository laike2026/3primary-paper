// Keep legacy catalog assets out of the redesigned inner pages.
// CMS uploads and homepage imagery keep their original behavior.
export function productVisual(image: string) {
  return image === '/images/products/color-2.webp' || image === '/images/products/color-1.webp'
    ? '/images/editorial/color-paper.webp'
    : image;
}
