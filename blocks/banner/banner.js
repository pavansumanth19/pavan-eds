import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the banner block
 * @param {Element} block The banner block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  row.className = 'banner-row';
  const [imageWrapper, textWrapper] = row.children;

  if (imageWrapper) {
    imageWrapper.className = 'banner-image';
    const img = imageWrapper.querySelector('img');
    if (img) {
      const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]);
      img.closest('picture')?.replaceWith(picture);
    }
  }

  if (textWrapper) {
    textWrapper.className = 'banner-text';
  }
}
