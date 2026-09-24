/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * Removes non-authorable site chrome (header, footer, nav, search, mobile nav,
 * tracking iframe) and leftover elements. All selectors verified in
 * migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Tracking / ID-syncing iframe (cleaned.html line ~566) and mobile nav toggle
    // overlays — remove before parsing so they can't interfere with block matching.
    WebImporter.DOMUtils.remove(element, [
      'iframe#destination_publishing_iframe_wkndsite_0', // Adobe ID syncing iframe
      'iframe', // any other embedded tracking iframes
      '#toggleNav', // mobile nav hamburger toggle
      '#mobileNav', // mobile navigation drawer
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (verified in cleaned.html):
    //   header.cmp-experiencefragment--header (line ~5)
    //   footer.cmp-experiencefragment--footer (line ~471)
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header', // global header XF (logo, nav, search, language nav, sign-in)
      'footer.cmp-experiencefragment--footer', // global footer XF (logo, nav, social, copyright)
      '.cmp-contentfragment__title', // hidden CF title that duplicates the page H1 (magazine articles)
      'meta', // stray empty <meta> tags left inside cmp-image wrappers
      'noscript',
      'link',
    ]);

    // Strip data-layer / accessibility tracking attributes present in captured DOM.
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
      el.removeAttribute('data-cmp-hook-image');
      el.removeAttribute('data-cmp-hook-teaser');
      el.removeAttribute('data-cmp-src');
      el.removeAttribute('data-asset-id');
      el.removeAttribute('onclick');
    });

    // Normalize internal links: the source markup carries a `.html` suffix on
    // in-content links (e.g. /us/en/adventures.html), but EDS serves only the
    // extensionless path — the `.html` URL 404s. Strip `.html` from same-site
    // links so the authored href resolves directly (no runtime rewrite, no dead
    // link for crawlers). External links and asset links (.pdf, images) are left
    // untouched.
    const sourceHosts = ['wknd.site', 'www.wknd.site', 'localhost'];
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href) return;
      // Relative path, or absolute URL pointing back at the source site.
      const isInternal = href.startsWith('/')
        || sourceHosts.some((h) => href.includes(`//${h}`) || href.includes(`//${h}:`));
      if (!isInternal) return;
      // Only rewrite the path portion; keep any query/hash intact.
      const cleaned = href.replace(/\.html(?=($|[?#]))/, '');
      if (cleaned !== href) a.setAttribute('href', cleaned);
    });
  }
}
