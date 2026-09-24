import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

// Locales available in this site tree, shown in the language/country switcher.
const LOCALES = [
  { code: '/us/en', label: 'EN-US' },
  { code: '/ca/en', label: 'EN-CA' },
  { code: '/de/de', label: 'DE-DE' },
  { code: '/ch/de', label: 'DE-CH' },
  { code: '/fr/fr', label: 'FR-FR' },
  { code: '/es/es', label: 'ES-ES' },
  { code: '/it/it', label: 'IT-IT' },
];

/** Current locale prefix (/xx/xx) from the path, defaulting to /us/en. */
function currentLocalePrefix() {
  const m = window.location.pathname.match(/^(\/[a-z]{2}\/[a-z]{2})(\/|$)/);
  return m ? m[1] : '/us/en';
}

/**
 * Turn the static "EN-US" language link into a working country/language switcher.
 * Selecting a locale navigates to the same page path under that locale.
 */
function decorateLanguageNav(scope) {
  const link = scope.querySelector('a[href="#langnav"], a[href*="langnav" i]');
  if (!link) return;

  const prefix = currentLocalePrefix();
  const rest = window.location.pathname.replace(/\.html$/, '').slice(prefix.length); // path after locale
  const current = LOCALES.find((l) => l.code === prefix) || LOCALES[0];

  const details = document.createElement('details');
  details.className = 'nav-langnav';
  const summary = document.createElement('summary');
  summary.textContent = current.label;
  summary.setAttribute('aria-label', `Change language, current ${current.label}`);
  const list = document.createElement('ul');
  LOCALES.forEach((loc) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `${loc.code}${rest}`;
    a.textContent = loc.label;
    if (loc.code === prefix) a.setAttribute('aria-current', 'true');
    li.append(a);
    list.append(li);
  });
  details.append(summary, list);

  // Close the dropdown when clicking outside.
  document.addEventListener('click', (e) => {
    if (!details.contains(e.target)) details.removeAttribute('open');
  });

  const target = link.closest('p') || link;
  target.replaceWith(details);
}

/**
 * Replace the static `:search:` icon with a working search box. Submitting
 * navigates to the magazine listing with a `?q=` query the listing can read;
 * pressing the icon toggles the input.
 */
function decorateSearch(scope) {
  const iconSpan = scope.querySelector('.icon-search, span.icon[class*="search"]');
  const host = iconSpan ? iconSpan.closest('p') : scope.querySelector('.default-content-wrapper > p');
  if (!host) return;

  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = `${currentLocalePrefix()}/magazine`;
  form.method = 'get';

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Search';
  input.setAttribute('aria-label', 'Search');

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'nav-search-button';
  button.setAttribute('aria-label', 'Search');
  // Preserve the existing search icon inside the button if present.
  if (iconSpan) button.append(iconSpan.cloneNode(true));

  form.append(input, button);
  host.replaceWith(form);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools', 'utility'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Pull the utility block (Sign In / language) out of the nav and render it as
  // a thin dark bar above the main header, matching the source's top strip.
  const navUtility = nav.querySelector('.nav-utility');
  let utilityWrapper;
  if (navUtility) {
    // Make the language link a working country/language switcher.
    decorateLanguageNav(navUtility);
    utilityWrapper = document.createElement('div');
    utilityWrapper.className = 'nav-utility-wrapper';
    utilityWrapper.append(navUtility);
  }

  // Make the search icon (in the nav-tools section) a working search box.
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) decorateSearch(navTools);

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  // Utility bar sits above the main nav
  if (utilityWrapper) block.append(utilityWrapper);
  block.append(navWrapper);
}
