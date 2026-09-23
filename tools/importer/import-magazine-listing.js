/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS — reuse the homepage block parsers; the magazine listing uses
// the same AEM components (featured teaser, image-list grid, teasers).
import columnsFeaturedParser from './parsers/columns-featured.js';
import articleFeedParser from './parsers/article-feed.js';
import heroBannerParser from './parsers/hero-banner.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-featured': columnsFeaturedParser,
  'article-feed': articleFeedParser,
  'hero-banner': heroBannerParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'magazine-listing',
  description: 'Magazine landing page: featured article, article card grid, members-only teasers',
  urls: [
    'https://wknd.site/us/en/magazine.html',
  ],
  blocks: [
    { name: 'columns-featured', instances: ['.teaser.cmp-teaser--featured'] },
    { name: 'article-feed', instances: ['.image-list.list'] },
    { name: 'hero-banner', instances: ['.teaser.cmp-teaser--list'] },
  ],
  sections: [
    { id: 's1', name: 'featured-article', selector: ['.teaser.cmp-teaser--featured'], style: null, blocks: ['columns-featured'], defaultContent: ['h1'] },
    { id: 's2', name: 'all-articles', selector: ['.image-list.list'], style: null, blocks: ['article-feed'], defaultContent: [] },
    { id: 's3', name: 'members-only', selector: ['.teaser.cmp-teaser--list'], style: null, blocks: ['hero-banner'], defaultContent: [] },
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
