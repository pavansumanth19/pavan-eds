/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel.
 * Base block: carousel. Source: https://wknd.site/ca/en/adventures/bali-surf-camp.html
 * Library convention: 2-column table, one row per slide.
 *   Cell 1: image (mandatory, image only, no other content).
 *   Cell 2: optional text content (title / description / CTA).
 *   The WKND cmp-carousel--mini slides contain only an image, so cell 2 is
 *   left empty (padded) to keep the 2-column table well-formed.
 */
export default function parse(element, { document }) {
  const slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));

  const cells = [];
  slides.forEach((slide) => {
    const image = slide.querySelector('img');

    // Optional text content in the slide (excludes carousel chrome).
    const contentCell = [];
    slide.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a[href]').forEach((el) => {
      if (el.closest('.cmp-carousel__actions, .cmp-carousel__indicators')) return;
      contentCell.push(el);
    });

    // Skip slides that have neither an image nor text content.
    if (!image && !contentCell.length) return;
    // Cell 1: image only. Cell 2: optional content (padded empty if none).
    cells.push([image || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });
  element.replaceWith(block);
}
