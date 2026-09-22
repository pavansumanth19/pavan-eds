/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion.
 * Base block: accordion. Source: https://wknd.site/ca/en/faqs.html
 * Library convention: 2-column table, one row per accordion item.
 *   Cell 1: title/question (mandatory). Cell 2: panel content/answer (mandatory).
 * Source is a cmp-accordion with 7 Q&A items; each item is a .cmp-accordion__item
 *   containing a header button (.cmp-accordion__title) and a hidden panel
 *   (.cmp-accordion__panel) that wraps the answer text.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-accordion__item'));

  const cells = [];
  items.forEach((item) => {
    // Cell 1: question/title. Prefer the dedicated title span, fall back to the
    // header/button text.
    const titleEl = item.querySelector(
      '.cmp-accordion__title, .cmp-accordion__header, .cmp-accordion__button',
    );
    const title = titleEl ? titleEl.textContent.trim() : '';

    // Cell 2: answer/panel content. Pull meaningful nodes from the panel, skipping
    // the empty grid/container wrappers.
    const panel = item.querySelector('.cmp-accordion__panel');
    const contentCell = [];
    if (panel) {
      const source = panel.querySelector('.cmp-text') || panel;
      source
        .querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, img')
        .forEach((el) => {
          // List items are captured via their parent ul/ol.
          if (el.closest('li')) return;
          // Skip empty placeholder headings/paragraphs (e.g. <h3>&nbsp;</h3>).
          if (!el.querySelector('img') && !el.textContent.replace(/ /g, '').trim()) return;
          contentCell.push(el);
        });
    }

    if (!title && !contentCell.length) return;

    // Both cells are mandatory per convention; pad if either came up empty.
    cells.push([title || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
