/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured.
 * Base block: columns
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--featured)
 * Generated: 2026-09-22
 *
 * Library structure: multiple columns/rows. Row 1 = block name.
 * The featured teaser presents text content and an image side by side,
 * so it maps to a single content row with 2 columns:
 *   cell 1 = text content (pretitle, title, description, CTA)
 *   cell 2 = image
 */
export default function parse(element, { document }) {
  const pretitle = element.querySelector('.cmp-teaser__pretitle');
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3, h4, h5, h6');
  const description = element.querySelector('.cmp-teaser__description');
  const ctaLinks = Array.from(
    element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a'),
  );
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  const contentCell = [];
  if (pretitle) contentCell.push(pretitle);
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  contentCell.push(...ctaLinks);

  // Empty-block guard.
  if (contentCell.length === 0 && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[contentCell, image || '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
