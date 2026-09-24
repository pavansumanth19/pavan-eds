/* eslint-disable */
/* global WebImporter */
/**
 * Parser for breadcrumbs.
 * Base block: breadcrumbs (custom — not in library catalog, inferred from source HTML + block contract).
 * Source: https://wknd.site/ca/en/adventures/bali-surf-camp.html
 * Structure: 1-column block. One breadcrumb per row, ordered root → current page.
 *   Linked ancestors keep their anchor; the active (last) item is emitted as plain text.
 */
export default function parse(element, { document }) {
  // Each ancestor / current page is a list item in the cmp-breadcrumb list.
  const items = Array.from(element.querySelectorAll('.cmp-breadcrumb__item, li'));

  const cells = [];
  items.forEach((item) => {
    const link = item.querySelector('a[href]');
    if (link) {
      // Linked ancestor — preserve the anchor (with its href).
      const label = link.textContent.trim();
      if (!label) return;
      link.textContent = label;
      cells.push([link]);
    } else {
      // Active / current page — plain text, no link.
      const label = item.textContent.trim();
      if (!label) return;
      cells.push([label]);
    }
  });

  // Empty-block guard: nothing to render.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'breadcrumbs', cells });
  element.replaceWith(block);
}
