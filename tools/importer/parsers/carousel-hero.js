/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero.
 * Base block: carousel
 * Source: https://wknd.site/us/en.html (.carousel.cmp-carousel--hero)
 * Generated: 2026-09-22
 *
 * Library structure: 2 columns, multiple rows. Row 1 = block name.
 * Each subsequent row = one slide: cell 1 = image, cell 2 = text content
 * (title heading, description, optional CTA link).
 */
export default function parse(element, { document }) {
  // Each carousel item is a slide. Fall back to teaser wrappers if item class varies.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (slides.length === 0) {
    slides = Array.from(element.querySelectorAll('.teaser'));
  }

  const cells = [];

  slides.forEach((slide) => {
    // Image cell: prefer the semantic image node inside the slide.
    const image = slide.querySelector('.cmp-teaser__image img, .cmp-image img, img');

    // Content cell: title, description, and CTA links.
    const title = slide.querySelector('.cmp-teaser__title, h1, h2, h3, h4, h5, h6');
    const description = slide.querySelector('.cmp-teaser__description, .cmp-teaser__content p');
    const ctaLinks = Array.from(
      slide.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a'),
    );

    // Skip empty/non-slide nodes.
    if (!image && !title && !description && ctaLinks.length === 0) return;

    const contentCell = [];
    if (title) contentCell.push(title);
    if (description) contentCell.push(description);
    contentCell.push(...ctaLinks);

    cells.push([image || '', contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
