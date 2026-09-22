/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-minimal-dark-withimg.
 * Base block: tabs.
 * Source: https://wknd.site/ca/en/adventures.html
 * Generated: 2026-09-22
 *
 * Source is an AEM core "tabs" component: an <ol.cmp-tabs__tablist> of
 * <li.cmp-tabs__tab> category labels (All / Climbing / Cycling / Skiing /
 * Surfing / Travel), each paired with a <div.cmp-tabs__tabpanel> whose body is
 * a grid of adventure image cards (<div.image-list> > <ul.cmp-image-list>).
 *
 * Tabs and panels are linked by their DOM ids:
 *   tab id   = tabs-{group}-item-{itemId}-tab
 *   panel id = tabs-{group}-item-{itemId}-tabpanel
 * We match on {itemId}. Only the active panel is typically present in the
 * server-rendered DOM (inactive panels are hydrated client-side), so tabs
 * without a matching panel get an empty content cell to keep a 2-column table.
 *
 * Output (per library-description.txt): 2 columns, one row per tab —
 * cell 1 = category label, cell 2 = panel content (the grid of cards).
 */
export default function parse(element, { document }) {
  const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab, [class*="tabs__tab"]:not([class*="tablist"]):not([class*="tabpanel"])'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel, [class*="tabpanel"]'));

  // Empty-block guard: nothing tab-like to work with.
  if (!tabs.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Extract the {itemId} segment from a tab/panel id so tabs and panels can be paired.
  const itemIdOf = (el, suffix) => {
    const id = el && el.id ? el.id : '';
    const m = id.match(new RegExp(`item-([^-]+)-${suffix}$`));
    return m ? m[1] : null;
  };

  const panelByItemId = new Map();
  panels.forEach((panel) => {
    const key = itemIdOf(panel, 'tabpanel');
    if (key) panelByItemId.set(key, panel);
  });

  const cells = [];
  tabs.forEach((tab, i) => {
    // Cell 1: category label (preserve inner markup, fall back to text).
    const label = document.createElement('span');
    label.innerHTML = tab.innerHTML || tab.textContent || '';

    // Cell 2: matching panel content. Prefer id-based pairing; if only one
    // panel exists (single active panel rendered) fall back to positional.
    const key = itemIdOf(tab, 'tab');
    let panel = key ? panelByItemId.get(key) : null;
    if (!panel && panels.length === tabs.length) panel = panels[i];

    let content = '';
    if (panel) {
      // Prefer the meaningful body (image grid) but keep whatever the panel holds.
      const body = panel.querySelector('.image-list, .cmp-image-list, ul');
      content = body || Array.from(panel.childNodes);
    }

    cells.push([label, content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-minimal-dark-withimg', cells });
  element.replaceWith(block);
}
