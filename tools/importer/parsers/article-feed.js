/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the dynamic `article-feed` block.
 *
 * Replaces a static card grid (`.image-list.list`) with an `article-feed` block
 * whose config drives a runtime query against /query-index.json. This is what
 * makes the listing live: the imported document holds only the block config, and
 * the rendered cards come from whatever is currently published under the section.
 *
 * Section (magazine vs adventures) is inferred from the nearest preceding
 * heading (e.g. "Recent Articles" → magazine, "Next Adventures" → adventures),
 * which disambiguates the home page's two grids; it falls back to the page URL
 * for the listing pages. Locale is taken from the page URL.
 */
function sectionFromHeading(element) {
  // Walk backwards to find the closest heading that labels this grid.
  let node = element;
  while (node) {
    let sib = node.previousElementSibling;
    while (sib) {
      const heading = sib.matches && sib.matches('h1,h2,h3')
        ? sib
        : sib.querySelector && sib.querySelector('h1,h2,h3');
      if (heading) {
        const t = heading.textContent.toLowerCase();
        if (t.includes('adventure') || t.includes('trip') || t.includes('where to go')) return 'adventures';
        if (t.includes('article') || t.includes('magazine') || t.includes('stor')) return 'magazine';
      }
      sib = sib.previousElementSibling;
    }
    node = node.parentElement;
  }
  return null;
}

export default function parse(element, { document, params }) {
  const url = (params && params.originalURL) || '';
  const pathname = (() => {
    try { return new URL(url).pathname; } catch { return ''; }
  })();

  let section = sectionFromHeading(element);
  if (!section) {
    section = /\/adventures(\.html)?$/.test(pathname) ? 'adventures' : 'magazine';
  }

  const localeMatch = pathname.match(/^(\/[^/]+\/[^/]+)\//);
  const locale = localeMatch ? localeMatch[1] : '';

  const rows = [['filter', section]];
  if (locale) rows.push(['locale', locale]);
  // Home-page rails show a short teaser strip (source shows 4); the listing
  // pages show all.
  const isListing = /\/(magazine|adventures)(\.html)?$/.test(pathname);
  if (!isListing) rows.push(['limit', '4']);

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'article-feed',
    cells: rows,
  });

  element.replaceWith(block);
}
