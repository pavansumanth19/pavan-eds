/**
 * hero-banner variant — full-width banner with a background image and an
 * overlaid light content card (heading + paragraph + single CTA).
 * Content contract: first row is the image, second row is the content.
 */
export default function decorate(block) {
  const rows = [...block.children];

  rows.forEach((row) => {
    if (row.querySelector('picture, img')) {
      row.classList.add('hero-banner-image');
    } else {
      row.classList.add('hero-banner-content');
    }
  });
}
