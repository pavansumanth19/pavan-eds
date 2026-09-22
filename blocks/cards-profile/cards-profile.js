import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards variant (profile): a grid of contributor profile cards, each with a
 * circular photo, a name, a role subtitle and a row of social links. Scoped to
 * its own class so it does not affect the base cards block.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-profile-image';
      } else {
        div.className = 'cards-profile-body';
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }])));
  block.replaceChildren(ul);
}
