import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Magazine article layout: the source renders the story body in a main column
 * with a right-hand sidebar holding "Share this Story" + related articles.
 * The imported content places the share heading and its related-links list at
 * the end of the article's default-content flow; lift them into an <aside> so
 * CSS can grid them into the sidebar column. Defensive: bails if not found.
 * @param {Element} main The main element
 */
function decorateMagazineArticle(main) {
  if (!document.body.classList.contains('magazine-article')) return;
  const wrappers = [...main.querySelectorAll('.default-content-wrapper')];
  const bodyWrapper = wrappers.find((w) => w.querySelector('h5'));
  if (!bodyWrapper) return;
  const shareHeading = [...bodyWrapper.querySelectorAll('h5')]
    .find((h) => /share this story/i.test(h.textContent));
  if (!shareHeading) return;

  const aside = document.createElement('aside');
  aside.className = 'magazine-sidebar';
  // Move the share heading and everything after it (the related-articles list)
  // out of the article flow and into the sidebar.
  let node = shareHeading;
  while (node) {
    const next = node.nextElementSibling;
    aside.append(node);
    node = next;
  }
  const articleSection = bodyWrapper.closest('.section');
  articleSection.append(aside);
  // Tag the section so the two-column (article + sidebar) grid layout applies
  // reliably. Not all articles contain a blockquote (which would add the
  // `quote-container` class), so we can't rely on that class for scoping.
  articleSection.classList.add('magazine-article-body');

  // Each related-article link imports as one run of text: "<Title> <Weekday>,
  // <D Mon YYYY>". Split the trailing date onto its own line so the sidebar can
  // render the title and date as the source does (title above, gray date below).
  aside.querySelectorAll('li a').forEach((a) => {
    if (a.querySelector('.magazine-sidebar-title')) return;
    const text = a.textContent.trim();
    const match = text.match(/^(.*?)\s+((?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day,\s+\d{1,2}\s+\w+\s+\d{4})$/);
    if (!match) return;
    const [, title, date] = match;
    a.textContent = '';
    const titleEl = document.createElement('span');
    titleEl.className = 'magazine-sidebar-title';
    titleEl.textContent = title;
    const dateEl = document.createElement('span');
    dateEl.className = 'magazine-sidebar-date';
    dateEl.textContent = date;
    a.append(titleEl, dateEl);
  });

  // The article ends with an author byline card: a small avatar image, the
  // author name (last h2), a role line, and social links. The source renders
  // this as a compact card (circular avatar, name/role beside it, social icons).
  // Group those trailing elements and tag the social links so CSS can show icon
  // glyphs (matching cards-profile) instead of the plain "Facebook" text.
  const bodyHeadings = [...bodyWrapper.querySelectorAll('h2')];
  const authorHeading = bodyHeadings[bodyHeadings.length - 1];
  if (authorHeading) {
    const authorCard = document.createElement('div');
    authorCard.className = 'magazine-author';
    // The avatar image sits in the paragraph immediately before the name.
    const avatar = authorHeading.previousElementSibling;
    if (avatar && avatar.querySelector('picture')) {
      avatar.classList.add('magazine-author-avatar');
      authorCard.append(avatar);
    }

    // Collect the remaining author elements (name, role, social links) so they
    // can be arranged into a single horizontal row: avatar | name+role | social.
    const rest = [];
    let cur = authorHeading;
    while (cur) {
      const next = cur.nextElementSibling;
      rest.push(cur);
      cur = next;
    }

    // Name + role stack in an info column; the social links (paragraphs whose
    // only child is a link) move into a trailing social group.
    const info = document.createElement('div');
    info.className = 'magazine-author-info';
    const social = document.createElement('div');
    social.className = 'magazine-author-social';
    rest.forEach((el) => {
      const link = el.querySelector('a');
      const isSocialLink = link && el.children.length === 1
        && el.textContent.trim() === link.textContent.trim();
      if (isSocialLink) social.append(el);
      else info.append(el);
    });

    authorCard.append(info);
    if (social.children.length) authorCard.append(social);
    bodyWrapper.append(authorCard);

    // Tag each social link by platform so CSS swaps the text for the icon.
    social.querySelectorAll('a').forEach((a) => {
      const hint = `${a.textContent} ${a.getAttribute('href') || ''}`.toLowerCase();
      if (hint.includes('facebook')) a.classList.add('social-facebook');
      else if (hint.includes('twitter')) a.classList.add('social-twitter');
      else if (hint.includes('insta')) a.classList.add('social-instagram');
      a.setAttribute('aria-label', a.textContent.trim());
    });
  }
}

/**
 * Adventure detail layout: the source places the metadata block ("Activity /
 * Adventure Type / …") in a narrow left sidebar with the tabbed content
 * (Overview / Itinerary / What to Bring) beside it on the right, with the H1
 * spanning full width above both. Tag the metadata + tabs sections and lift the
 * H1 so CSS can grid them into that layout. Defensive: bails if not found.
 * @param {Element} main The main element
 */
function decorateAdventureDetail(main) {
  if (!document.body.classList.contains('adventure-detail')) return;
  const metaSection = [...main.querySelectorAll('.section')]
    .find((s) => s.querySelector('.columns'));
  const tabsSection = [...main.querySelectorAll('.section')]
    .find((s) => s.querySelector('[class*="tabs"]'));
  if (!metaSection) return;
  metaSection.classList.add('adventure-meta');
  if (tabsSection) tabsSection.classList.add('adventure-tabs');

  // The H1 shares the metadata section; move it into its own full-width section
  // ahead of the metadata so it spans the whole content width like the source.
  const h1Wrapper = metaSection.querySelector('.default-content-wrapper');
  if (h1Wrapper && h1Wrapper.querySelector('h1')) {
    const titleSection = document.createElement('div');
    titleSection.className = 'section adventure-title';
    titleSection.append(h1Wrapper);
    metaSection.before(titleSection);
  }
}

/**
 * Strips the `.html` extension from internal links. The imported content
 * carries `.html` on internal hrefs (e.g. /us/en/magazine.html), but EDS serves
 * extensionless paths, so normalize them to avoid a redirect on click.
 * @param {Element} main The main element
 */
function normalizeInternalLinks(main) {
  main.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    try {
      const url = new URL(href, window.location.href);
      // only touch same-origin links that end in .html
      if (url.origin === window.location.origin && url.pathname.endsWith('.html')) {
        url.pathname = url.pathname.replace(/\.html$/, '');
        a.setAttribute('href', url.pathname + url.search + url.hash);
      }
    } catch {
      /* ignore malformed hrefs */
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateMagazineArticle(main);
  decorateAdventureDetail(main);
  normalizeInternalLinks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  // Tag magazine article pages so their template-specific layout (byline,
  // article + sidebar) can be scoped in CSS without extra authoring metadata.
  if (window.location.pathname.includes('/magazine/')) {
    document.body.classList.add('magazine-article');
  }
  // Tag the magazine landing/listing page (…/magazine, no trailing segment) so
  // its section layout (All Articles underline, contained members teasers) can
  // be scoped in CSS.
  if (/\/magazine$/.test(window.location.pathname.replace(/\.html$/, ''))) {
    document.body.classList.add('magazine-listing');
  }
  // Tag the FAQ page so its two-column layout (FAQ content left, "Need more
  // help?" right) and heading underline can be scoped in CSS.
  if (/\/faqs?$/.test(window.location.pathname.replace(/\.html$/, ''))) {
    document.body.classList.add('faq-page');
  }
  // Tag the adventures landing/listing page (…/adventures, no trailing segment)
  // so its section-title underline and tab/card styling can be scoped in CSS.
  if (/\/adventures$/.test(window.location.pathname.replace(/\.html$/, ''))) {
    document.body.classList.add('adventures-listing');
  }
  // Tag adventure detail pages (…/adventures/<slug>) so their two-column layout
  // (metadata sidebar + tabbed content) and metadata styling can be scoped.
  if (/\/adventures\/[^/]+$/.test(window.location.pathname.replace(/\.html$/, ''))) {
    document.body.classList.add('adventure-detail');
  }
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
