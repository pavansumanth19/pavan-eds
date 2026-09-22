/**
 * Breadcrumbs block.
 * Content contract: a single column of links (one per row, or a single list),
 * ordered from the site root to the current page. The last item is rendered as
 * the current page (non-link). Renders as an ordered navigation list with
 * separators between items.
 */
export default async function decorate(block) {
  // Collect the authored anchors in document order.
  const anchors = [...block.querySelectorAll('a')];

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const list = document.createElement('ol');
  list.className = 'breadcrumbs-list';

  const crumbs = anchors.length
    ? anchors.map((a) => ({ label: a.textContent.trim(), href: a.getAttribute('href') }))
    // Fallback: plain text cells become non-link crumbs.
    : [...block.querySelectorAll(':scope > div')]
      .map((row) => ({ label: row.textContent.trim(), href: null }))
      .filter((c) => c.label);

  crumbs.forEach((crumb, idx) => {
    const item = document.createElement('li');
    item.className = 'breadcrumbs-item';
    const isLast = idx === crumbs.length - 1;

    if (crumb.href && !isLast) {
      const link = document.createElement('a');
      link.href = crumb.href;
      link.textContent = crumb.label;
      item.append(link);
    } else {
      item.textContent = crumb.label;
      if (isLast) item.setAttribute('aria-current', 'page');
    }
    list.append(item);
  });

  nav.append(list);
  block.textContent = '';
  block.append(nav);
}
