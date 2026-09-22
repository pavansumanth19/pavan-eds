/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import tabsMinimalDarkWithimgParser from './parsers/tabs-minimal-dark-withimg.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'tabs-minimal-dark-withimg': tabsMinimalDarkWithimgParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'adventure-listing',
  description: 'Listing page with a hero banner and tabbed category groupings',
  urls: [
    'https://wknd.site/ca/en/adventures.html',
  ],
  blocks: [
    { name: 'hero-banner', instances: ['.teaser.cmp-teaser--hero'] },
    { name: 'tabs-minimal-dark-withimg', instances: ['.tabs.panelcontainer'] },
  ],
  sections: [
    { id: 's1', name: 'page-title', selector: ['main.cmp-layout-container--fixed > .cmp-container'], style: null, blocks: [], defaultContent: ['.cmp-title__text'] },
    { id: 's2', name: 'hero', selector: ['.teaser.cmp-teaser--hero'], style: null, blocks: ['hero-banner'], defaultContent: [] },
    { id: 's3', name: 'current-adventures-heading', selector: ['main.cmp-layout-container--fixed:nth-of-type(2) > .cmp-container'], style: null, blocks: [], defaultContent: ['.cmp-title__text'] },
    { id: 's4', name: 'category-grid', selector: ['.tabs.panelcontainer'], style: null, blocks: ['tabs-minimal-dark-withimg'], defaultContent: [] },
    { id: 's5', name: 'separator', selector: ['main.cmp-layout-container--fixed:last-of-type > .cmp-container'], style: null, blocks: [], defaultContent: ['hr', '.separator'] },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
