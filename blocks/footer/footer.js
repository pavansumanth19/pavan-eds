import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Accessibility: the WKND logo link is icon-only (empty title, no text), which
  // fails the "links must have discernible text" check. Give any icon-only link
  // an accessible name so screen readers and Lighthouse a11y pass.
  footer.querySelectorAll('a').forEach((a) => {
    const hasText = a.textContent.trim().length > 0;
    const hasLabel = a.getAttribute('aria-label') || (a.getAttribute('title') || '').trim();
    if (!hasText && !hasLabel) {
      const img = a.querySelector('img[alt]');
      a.setAttribute('aria-label', (img && img.getAttribute('alt')) || 'WKND home');
    }
  });

  block.append(footer);
}
