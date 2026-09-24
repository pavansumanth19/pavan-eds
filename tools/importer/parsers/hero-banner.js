/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner.
 * Base block: hero
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--hero.cmp-teaser--imagebottom)
 * Generated: 2026-09-22
 *
 * Library structure: 1 column, 3 rows. Row 1 = block name.
 *   Row 2 (single cell) = background image (optional)
 *   Row 3 (single cell) = title (heading), subheading, optional CTA
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3, h4, h5, h6');
  const description = element.querySelector('.cmp-teaser__description');
  const ctaLinks = Array.from(
    element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a'),
  );

  // Empty-block guard.
  if (!title && !description && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (only if present).
  if (image) cells.push([image]);

  // Row 3: text content in a single cell.
  const contentCell = [];
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  contentCell.push(...ctaLinks);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
