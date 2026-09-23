import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Dynamic, query-index-driven feed of article/adventure teaser cards.
 *
 * This is what makes the site "live": the magazine listing, the adventures
 * listing, the home page's recent-articles rail and the related rails all read
 * from /query-index.json at runtime, so publishing a new article under
 * /magazine/ (or /adventures/) makes it appear automatically — no code change
 * and no edits to any other document.
 *
 * Authoring contract (one config row per line, "key | value"):
 *   | article-feed |            <- block name
 *   | filter    | magazine |   <- path segment to match (magazine|adventures)
 *   | limit     | 3 |          <- max cards (optional; default all)
 *   | locale    | /us/en |     <- restrict to a locale path prefix (optional;
 *                                 defaults to the current page's /xx/xx prefix)
 *   | exclude   | current |    <- omit the current page (optional)
 * Missing/omitted rows fall back to sensible defaults, so an empty block still
 * renders a locale-scoped feed of the section it's placed under.
 */

const QUERY_INDEX = `${window.hlx?.codeBasePath || ''}/query-index.json`;

/** Parse the block's config rows into a plain object. */
function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      if (key) config[key] = value;
    }
  });
  return config;
}

/** Best-effort locale prefix (/xx/xx) from the current path. */
function currentLocale() {
  const m = window.location.pathname.match(/^(\/[^/]+\/[^/]+)\//);
  return m ? m[1] : '';
}

/** Fetch and cache the query index. */
let indexPromise;
async function fetchIndex() {
  if (!indexPromise) {
    indexPromise = fetch(QUERY_INDEX)
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => json.data || [])
      .catch(() => []);
  }
  return indexPromise;
}

/** Newest-first comparator by publisheddate (falls back to lastModified). */
function byNewest(a, b) {
  const da = Date.parse(a.publisheddate) || Number(a.lastModified) * 1000 || 0;
  const db = Date.parse(b.publisheddate) || Number(b.lastModified) * 1000 || 0;
  return db - da;
}

function buildCard(item) {
  const li = document.createElement('li');

  const imageDiv = document.createElement('div');
  imageDiv.className = 'cards-card-image';
  if (item.image && !item.image.startsWith('/default-meta-image')) {
    const picture = createOptimizedPicture(item.image, item.title, false, [{ width: '750' }]);
    imageDiv.append(picture);
  }

  const body = document.createElement('div');
  body.className = 'cards-card-body';
  const h3 = document.createElement('h3');
  const a = document.createElement('a');
  a.href = item.path;
  a.textContent = item.title;
  h3.append(a);
  body.append(h3);
  if (item.description) {
    const p = document.createElement('p');
    p.textContent = item.description;
    body.append(p);
  }

  if (imageDiv.hasChildNodes()) li.append(imageDiv);
  li.append(body);
  return li;
}

export default async function decorate(block) {
  const config = readConfig(block);
  const filter = (config.filter || '').toLowerCase();
  const locale = config.locale || currentLocale();
  const limit = config.limit ? parseInt(config.limit, 10) : 0;
  const excludeCurrent = (config.exclude || '').toLowerCase() === 'current';
  const currentPath = window.location.pathname.replace(/\.html$/, '');

  const data = await fetchIndex();

  const items = data
    .filter((item) => {
      if (!item.path) return false;
      // Must be an article/adventure detail page under the requested section.
      if (filter && !item.path.includes(`/${filter}/`)) return false;
      // Exclude the section landing page itself (…/magazine, …/adventures).
      if (filter && new RegExp(`/${filter}$`).test(item.path)) return false;
      if (locale && !item.path.startsWith(locale)) return false;
      if (excludeCurrent && item.path === currentPath) return false;
      return true;
    })
    .sort(byNewest);

  const shown = limit > 0 ? items.slice(0, limit) : items;

  const ul = document.createElement('ul');
  shown.forEach((item) => ul.append(buildCard(item)));
  block.replaceChildren(ul);

  // Adopt the base cards + cards-article classes so their grid + card styling
  // applies without duplicating it here.
  block.classList.add('cards', 'cards-article');
}
