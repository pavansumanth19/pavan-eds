/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import breadcrumbsParser from './parsers/breadcrumbs.js';
import carouselParser from './parsers/carousel.js';
import columnsParser from './parsers/columns.js';
import tabsParser from './parsers/tabs.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  breadcrumbs: breadcrumbsParser,
  carousel: carouselParser,
  columns: columnsParser,
  tabs: tabsParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'adventure-detail',
  description: 'Detail page with breadcrumbs, image carousel and tabbed content sections',
  urls: [
    'https://wknd.site/ca/en/adventures/bali-surf-camp.html',
  ],
  blocks: [
    { name: 'breadcrumbs', instances: ['.breadcrumb.cmp-breadcrumb--fixed'] },
    { name: 'carousel', instances: ['.carousel.panelcontainer.cmp-carousel--mini'] },
    // tabs parsed before columns so tab-panel content fragments are consumed by tabs
    { name: 'tabs', instances: ['.tabs.panelcontainer'] },
    { name: 'columns', instances: ['.cmp-contentfragment'] },
  ],
  sections: [
    { id: 's1', name: 'breadcrumb', selector: ['.breadcrumb.cmp-breadcrumb--fixed'], style: null, blocks: ['breadcrumbs'], defaultContent: [] },
    { id: 's2', name: 'carousel', selector: ['.carousel.panelcontainer.cmp-carousel--mini'], style: null, blocks: ['carousel'], defaultContent: [] },
    { id: 's3', name: 'title-facts', selector: ['main.cmp-layout-container--fixed > .cmp-container', '.cmp-contentfragment'], style: null, blocks: ['columns'], defaultContent: ['.cmp-title__text'] },
    { id: 's4', name: 'tabs', selector: ['.tabs.panelcontainer'], style: null, blocks: ['tabs'], defaultContent: [] },
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
