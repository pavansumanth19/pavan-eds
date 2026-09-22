/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article.
 * Base block: cards
 * Source: https://wknd.site/us/en.html (.image-list.list)
 * Generated: 2026-09-22
 *
 * Library structure: 2 columns, multiple rows. Row 1 = block name.
 * Each subsequent row = one card:
 *   cell 1 = image (mandatory)
 *   cell 2 = text content (title heading, description, optional CTA)
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-image-list__item'));

  const cells = [];

  items.forEach((item) => {
    const image = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');

    // Title: source wraps a span in an anchor. Promote to a heading that preserves the link.
    const titleLink = item.querySelector('.cmp-image-list__item-title-link');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    const description = item.querySelector('.cmp-image-list__item-description');

    const contentCell = [];
    if (titleLink && titleText) {
      const heading = document.createElement('h3');
      const link = document.createElement('a');
      link.href = titleLink.getAttribute('href') || '';
      link.textContent = titleText.textContent.trim();
      heading.append(link);
      contentCell.push(heading);
    } else if (titleText) {
      const heading = document.createElement('h3');
      heading.textContent = titleText.textContent.trim();
      contentCell.push(heading);
    }
    if (description) contentCell.push(description);

    // Skip empty items.
    if (!image && contentCell.length === 0) return;

    cells.push([image || '', contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
