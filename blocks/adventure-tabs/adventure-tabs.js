import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Dynamic, query-index-driven adventures listing with category tabs.
 *
 * Reads every adventure from /query-index.json, groups them into the source's
 * categories (All / Climbing / Cycling / Skiing / Surfing / Travel) using the
 * indexed `activity` field, and renders the tabbed card UI. Publishing a new
 * adventure makes it appear under "All" and its category tab automatically — no
 * code change, no other-document edits.
 *
 * Reuses the tabs-minimal-dark-withimg visual treatment (same class names) so it
 * looks identical to the static tabbed grid it replaces.
 */

const QUERY_INDEX = `${window.hlx?.codeBasePath || ''}/query-index.json`;

// Tab label → predicate over an item's indexed `activity` value.
const CATEGORIES = [
  { label: 'All', match: () => true },
  { label: 'Climbing', match: (a) => /climb/i.test(a) },
  { label: 'Cycling', match: (a) => /cycl|bike|biking/i.test(a) },
  { label: 'Skiing', match: (a) => /ski/i.test(a) },
  { label: 'Surfing', match: (a) => /surf/i.test(a) },
  // Travel groups the social/food/camping experiences the source files there.
  { label: 'Travel', match: (a) => /social|travel|camp|food|wine|gastronom/i.test(a) },
];

function currentLocale() {
  const m = window.location.pathname.match(/^(\/[^/]+\/[^/]+)\//);
  return m ? m[1] : '';
}

async function fetchIndex() {
  return fetch(QUERY_INDEX)
    .then((resp) => (resp.ok ? resp.json() : { data: [] }))
    .then((json) => json.data || [])
    .catch(() => []);
}

function titleFor(item) {
  const t = (item.title || '').trim();
  if (t && t.toLowerCase() !== 'og title') return t;
  const slug = item.path.replace(/\/$/, '').split('/').pop() || '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCard(item) {
  const li = document.createElement('li');
  const title = titleFor(item);
  if (item.image && !item.image.startsWith('/default-meta-image')) {
    const a = document.createElement('a');
    a.href = item.path;
    a.append(createOptimizedPicture(item.image, title, false, [{ width: '750' }]));
    li.append(a);
  }
  const titleLink = document.createElement('a');
  titleLink.href = item.path;
  titleLink.textContent = title;
  li.append(titleLink);
  if (item.description) {
    const p = document.createElement('p');
    p.textContent = item.description;
    li.append(p);
  }
  return li;
}

export default async function decorate(block) {
  const locale = currentLocale();
  const data = await fetchIndex();

  const adventures = data
    .filter((item) => item.path
      && item.path.includes('/adventures/')
      && !/\/adventures$/.test(item.path)
      && (!locale || item.path.startsWith(locale)));

  const tablist = document.createElement('div');
  tablist.className = 'adventure-tabs-list';
  tablist.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'adventure-tabs-panels';

  CATEGORIES.forEach((cat, idx) => {
    const items = adventures.filter((it) => cat.match(it.activity || ''));
    if (!items.length && cat.label !== 'All') return; // hide empty categories

    const id = cat.label.toLowerCase();
    const button = document.createElement('button');
    button.className = 'adventure-tabs-tab';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
    button.setAttribute('aria-controls', `adv-panel-${id}`);
    button.id = `adv-tab-${id}`;
    button.type = 'button';
    button.textContent = cat.label;
    tablist.append(button);

    const panel = document.createElement('div');
    panel.className = 'adventure-tabs-panel';
    panel.id = `adv-panel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `adv-tab-${id}`);
    panel.setAttribute('aria-hidden', idx === 0 ? 'false' : 'true');
    const ul = document.createElement('ul');
    items.forEach((it) => ul.append(buildCard(it)));
    panel.append(ul);
    panels.append(panel);

    button.addEventListener('click', () => {
      tablist.querySelectorAll('[role="tab"]').forEach((t) => t.setAttribute('aria-selected', 'false'));
      panels.querySelectorAll('[role="tabpanel"]').forEach((p) => p.setAttribute('aria-hidden', 'true'));
      button.setAttribute('aria-selected', 'true');
      panel.setAttribute('aria-hidden', 'false');
    });
  });

  block.replaceChildren(tablist, panels);
}
