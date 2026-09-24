/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns.
 * Base block: columns. Source: https://wknd.site/ca/en/adventures/bali-surf-camp.html
 * Library convention: multi-column table; row 2 sets the column count and every
 *   later row must have the same number of columns.
 * Source is a cmp-contentfragment "adventure facts" sidebar with label/value
 *   pairs (Activity, Adventure Type, Trip Length, Group Size, Difficulty, Price).
 *   Natural grouping: 2 columns — one row per fact: [ label | value ].
 */
export default function parse(element, { document }) {
  const facts = Array.from(element.querySelectorAll('.cmp-contentfragment__element'));

  const cells = [];
  facts.forEach((fact) => {
    const labelEl = fact.querySelector('.cmp-contentfragment__element-title, dt');
    const valueEl = fact.querySelector('.cmp-contentfragment__element-value, dd');

    const label = labelEl ? labelEl.textContent.trim() : '';
    const value = valueEl ? valueEl.textContent.trim() : '';

    // Skip pairs with no content at all; pad so every row keeps 2 columns.
    if (!label && !value) return;
    cells.push([label, value]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
