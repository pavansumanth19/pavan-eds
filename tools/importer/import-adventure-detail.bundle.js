/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-adventure-detail.js
  var import_adventure_detail_exports = {};
  __export(import_adventure_detail_exports, {
    default: () => import_adventure_detail_default
  });

  // tools/importer/parsers/breadcrumbs.js
  function parse(element, { document: document2 }) {
    const items = Array.from(element.querySelectorAll(".cmp-breadcrumb__item, li"));
    const cells = [];
    items.forEach((item) => {
      const link = item.querySelector("a[href]");
      if (link) {
        const label = link.textContent.trim();
        if (!label) return;
        link.textContent = label;
        cells.push([link]);
      } else {
        const label = item.textContent.trim();
        if (!label) return;
        cells.push([label]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "breadcrumbs", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel.js
  function parse2(element, { document: document2 }) {
    const slides = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    const cells = [];
    slides.forEach((slide) => {
      const image = slide.querySelector("img");
      const contentCell = [];
      slide.querySelectorAll("h1, h2, h3, h4, h5, h6, p, a[href]").forEach((el) => {
        if (el.closest(".cmp-carousel__actions, .cmp-carousel__indicators")) return;
        contentCell.push(el);
      });
      if (!image && !contentCell.length) return;
      cells.push([image || "", contentCell.length ? contentCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse3(element, { document: document2 }) {
    const facts = Array.from(element.querySelectorAll(".cmp-contentfragment__element"));
    const cells = [];
    facts.forEach((fact) => {
      const labelEl = fact.querySelector(".cmp-contentfragment__element-title, dt");
      const valueEl = fact.querySelector(".cmp-contentfragment__element-value, dd");
      const label = labelEl ? labelEl.textContent.trim() : "";
      const value = valueEl ? valueEl.textContent.trim() : "";
      if (!label && !value) return;
      cells.push([label, value]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs.js
  function parse4(element, { document: document2 }) {
    const tabLabels = Array.from(element.querySelectorAll(".cmp-tabs__tab"));
    const panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    const cells = [];
    tabLabels.forEach((tabLabel, i) => {
      const label = tabLabel.textContent.trim();
      const panel = panels[i];
      if (!label && !panel) return;
      const contentCell = [];
      if (panel) {
        const source = panel.querySelector(".cmp-contentfragment__elements") || panel;
        source.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, img").forEach((el) => {
          if (el.closest("li")) return;
          contentCell.push(el);
        });
      }
      cells.push([label || "", contentCell.length ? contentCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "iframe#destination_publishing_iframe_wkndsite_0",
        // Adobe ID syncing iframe
        "iframe",
        // any other embedded tracking iframes
        "#toggleNav",
        // mobile nav hamburger toggle
        "#mobileNav"
        // mobile navigation drawer
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.cmp-experiencefragment--header",
        // global header XF (logo, nav, search, language nav, sign-in)
        "footer.cmp-experiencefragment--footer",
        // global footer XF (logo, nav, social, copyright)
        ".cmp-contentfragment__title",
        // hidden CF title that duplicates the page H1 (magazine articles)
        "meta",
        // stray empty <meta> tags left inside cmp-image wrappers
        "noscript",
        "link"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("data-cmp-data-layer");
        el.removeAttribute("data-cmp-hook-image");
        el.removeAttribute("data-cmp-hook-teaser");
        el.removeAttribute("data-cmp-src");
        el.removeAttribute("data-asset-id");
        el.removeAttribute("onclick");
      });
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-adventure-detail.js
  var parsers = {
    breadcrumbs: parse,
    carousel: parse2,
    columns: parse3,
    tabs: parse4
  };
  var PAGE_TEMPLATE = {
    name: "adventure-detail",
    description: "Detail page with breadcrumbs, image carousel and tabbed content sections",
    urls: [
      "https://wknd.site/ca/en/adventures/bali-surf-camp.html"
    ],
    blocks: [
      { name: "breadcrumbs", instances: [".breadcrumb.cmp-breadcrumb--fixed"] },
      { name: "carousel", instances: [".carousel.panelcontainer.cmp-carousel--mini"] },
      // tabs parsed before columns so tab-panel content fragments are consumed by tabs
      { name: "tabs", instances: [".tabs.panelcontainer"] },
      { name: "columns", instances: [".cmp-contentfragment"] }
    ],
    sections: [
      { id: "s1", name: "breadcrumb", selector: [".breadcrumb.cmp-breadcrumb--fixed"], style: null, blocks: ["breadcrumbs"], defaultContent: [] },
      { id: "s2", name: "carousel", selector: [".carousel.panelcontainer.cmp-carousel--mini"], style: null, blocks: ["carousel"], defaultContent: [] },
      { id: "s3", name: "title-facts", selector: ["main.cmp-layout-container--fixed > .cmp-container", ".cmp-contentfragment"], style: null, blocks: ["columns"], defaultContent: [".cmp-title__text"] },
      { id: "s4", name: "tabs", selector: [".tabs.panelcontainer"], style: null, blocks: ["tabs"], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_adventure_detail_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_adventure_detail_exports);
})();
