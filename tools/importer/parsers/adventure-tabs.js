/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the dynamic `adventure-tabs` block.
 *
 * Replaces the static category-tabbed grid (`.tabs.panelcontainer`) with an
 * empty `adventure-tabs` block. The block needs no authored config — it reads
 * every adventure from /query-index.json at runtime, groups by the indexed
 * activity into the source's tabs, and renders the cards. So publishing a new
 * adventure makes it appear under the right tab automatically.
 */
export default function parse(element, { document }) {
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'adventure-tabs',
    cells: [['']],
  });
  element.replaceWith(block);
}
