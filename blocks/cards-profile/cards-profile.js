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

  // Tag social links by platform (from their text or href) so CSS can swap the
  // text label for the matching SVG icon, matching the source's icon glyphs.
  ul.querySelectorAll('.cards-profile-body a').forEach((a) => {
    const hint = `${a.textContent} ${a.getAttribute('href') || ''}`.toLowerCase();
    if (hint.includes('facebook')) a.classList.add('social-facebook');
    else if (hint.includes('twitter')) a.classList.add('social-twitter');
    else if (hint.includes('insta')) a.classList.add('social-instagram');
    a.setAttribute('aria-label', a.textContent.trim());
  });

  block.replaceChildren(ul);
}
