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

  // tools/importer/import-content-landing.js
  var import_content_landing_exports = {};
  __export(import_content_landing_exports, {
    default: () => import_content_landing_default
  });

  // tools/importer/parsers/cards-profile.js
  function parse(element, { document: document2 }) {
    const image = element.querySelector(".cmp-image img, img.cmp-image__image, img");
    const name = element.querySelector(".cmp-title h3, .cmp-title__text, h1, h2, h3, h4");
    const titles = element.querySelectorAll(".cmp-title h1, .cmp-title h2, .cmp-title h3, .cmp-title h4, .cmp-title h5, .cmp-title h6");
    let role = null;
    if (titles.length > 1) {
      role = titles[titles.length - 1];
    }
    const socialLinks = Array.from(
      element.querySelectorAll(".cmp-buildingblock a.cmp-button, .buildingblock a, a.cmp-button")
    );
    if (!image && !name && socialLinks.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const bodyCell = [];
    if (name) bodyCell.push(name);
    if (role && role !== name) bodyCell.push(role);
    if (socialLinks.length > 0) {
      const links = document2.createElement("p");
      socialLinks.forEach((a, i) => {
        if (i > 0) links.append(document2.createTextNode(" "));
        links.append(a);
      });
      bodyCell.push(links);
    }
    const cells = [];
    cells.push([image || "", bodyCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-profile", cells });
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
      const sourceHosts = ["wknd.site", "www.wknd.site", "localhost"];
      element.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (!href) return;
        const isInternal = href.startsWith("/") || sourceHosts.some((h) => href.includes(`//${h}`) || href.includes(`//${h}:`));
        if (!isInternal) return;
        const cleaned = href.replace(/\.html(?=($|[?#]))/, "");
        if (cleaned !== href) a.setAttribute("href", cleaned);
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

  // tools/importer/import-content-landing.js
  var parsers = {
    "cards-profile": parse
  };
  var PAGE_TEMPLATE = {
    name: "content-landing",
    description: "Section landing page built from stacked headings and contributor grids",
    urls: [
      "https://wknd.site/ca/en/about-us.html"
    ],
    blocks: [
      { name: "cards-profile", instances: [".experiencefragment.cmp-experience-fragment--contributor"] }
    ],
    sections: [
      { id: "s1", name: "contributors", selector: ["main.cmp-layout-container--fixed > .cmp-container", ".container.responsivegrid"], style: null, blocks: ["cards-profile"], defaultContent: [".cmp-title__text", ".cmp-text"] }
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
  var import_content_landing_default = {
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
  return __toCommonJS(import_content_landing_exports);
})();
