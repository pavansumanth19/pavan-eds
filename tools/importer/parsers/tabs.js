/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs.
 * Base block: tabs. Source: https://wknd.site/ca/en/adventures/bali-surf-camp.html
 * Library convention: 2-column table, one row per tab.
 *   Cell 1: tab label (mandatory). Cell 2: tab content (mandatory).
 * Source is a cmp-tabs with 3 tabs (Overview, Itinerary, What to Bring); tab
 *   labels live in .cmp-tabs__tab list items, panels in matching .cmp-tabs__tabpanel.
 */
export default function parse(element, { document }) {
  const tabLabels = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  const cells = [];
  tabLabels.forEach((tabLabel, i) => {
    const label = tabLabel.textContent.trim();
    const panel = panels[i];
    if (!label && !panel) return;

    // Cell 2: panel content — meaningful nodes, skipping empty grid wrappers.
    const contentCell = [];
    if (panel) {
      const source = panel.querySelector('.cmp-contentfragment__elements') || panel;
      source.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, img').forEach((el) => {
        // List items are captured via their parent ul/ol.
        if (el.closest('li')) return;
        contentCell.push(el);
      });
    }

    // Both cells are mandatory per convention; pad content if it came up empty.
    cells.push([label || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
