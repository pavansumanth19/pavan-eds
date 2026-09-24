/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: quote
 * Base block: quote
 * Source: https://wknd.site/ca/en/magazine/arctic-surfing.html
 * Generated: 2026-09-22
 *
 * Source structure: a `.cmp-text` element wrapping a <blockquote> with the
 * quotation text, and optionally an attribution (footer/cite/em).
 *
 * Block contract (1 column, rows):
 *   Row 1: the quotation (element)
 *   Row 2 (optional): the attribution (element)
 * The base block reads each row's firstElementChild, so each cell holds a
 * single element node (a <p>), never raw text.
 */
export default function parse(element, { document }) {
  const blockquote = element.querySelector('blockquote') || element;

  // Attribution candidates inside the blockquote (optional).
  const attributionEl = blockquote.querySelector('footer, cite');

  // Extract the quotation text: the blockquote text minus any attribution text.
  let quotationText = '';
  if (blockquote === element) {
    quotationText = (element.textContent || '').trim();
  } else {
    // Clone so removing the attribution does not mutate the source DOM.
    const clone = blockquote.cloneNode(true);
    const cloneAttr = clone.querySelector('footer, cite');
    if (cloneAttr) cloneAttr.remove();
    quotationText = (clone.textContent || '').trim();
  }

  // Empty-block guard.
  if (!quotationText && !attributionEl) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 1: quotation (wrapped in a paragraph so firstElementChild is an element).
  const quotationP = document.createElement('p');
  quotationP.textContent = quotationText;
  cells.push([quotationP]);

  // Row 2 (optional): attribution.
  if (attributionEl) {
    const attributionText = (attributionEl.textContent || '').trim();
    if (attributionText) {
      const attributionP = document.createElement('p');
      const em = document.createElement('em');
      em.textContent = attributionText;
      attributionP.append(em);
      cells.push([attributionP]);
    }
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote', cells });
  element.replaceWith(block);
}
