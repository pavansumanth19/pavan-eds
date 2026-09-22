/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-profile. Base block: cards.
 * Source: WKND contributor experience fragments (.experiencefragment.cmp-experience-fragment--contributor).
 * Each parse() call receives ONE contributor element and produces a single card row.
 * Structure (2 columns): image cell | body cell (name heading + role subtitle + social links).
 * Generated: 2026-09-22
 */
export default function parse(element, { document }) {
  // Circular profile photo (image cell)
  const image = element.querySelector('.cmp-image img, img.cmp-image__image, img');

  // Name — rendered as a title (h3) in the source
  const name = element.querySelector('.cmp-title h3, .cmp-title__text, h1, h2, h3, h4');

  // Role subtitle — a second title (h5) in the source
  const titles = element.querySelectorAll('.cmp-title h1, .cmp-title h2, .cmp-title h3, .cmp-title h4, .cmp-title h5, .cmp-title h6');
  let role = null;
  if (titles.length > 1) {
    role = titles[titles.length - 1];
  }

  // Row of social links
  const socialLinks = Array.from(
    element.querySelectorAll('.cmp-buildingblock a.cmp-button, .buildingblock a, a.cmp-button'),
  );

  // Empty-block guard: nothing meaningful to build a card from
  if (!image && !name && socialLinks.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Build the body cell (name + role + social links)
  const bodyCell = [];
  if (name) bodyCell.push(name);
  if (role && role !== name) bodyCell.push(role);
  if (socialLinks.length > 0) {
    const links = document.createElement('p');
    socialLinks.forEach((a, i) => {
      if (i > 0) links.append(document.createTextNode(' '));
      links.append(a);
    });
    bodyCell.push(links);
  }

  // 2-column cards row: image cell | body cell
  const cells = [];
  cells.push([image || '', bodyCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-profile', cells });
  element.replaceWith(block);
}
