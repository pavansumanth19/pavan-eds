import decorate from '../carousel/carousel.js';

/**
 * carousel-hero variant — full-bleed hero carousel. Delegates to the base
 * carousel decorator (adding the base `carousel` class so its slide logic and
 * CSS apply), then keeps its own `carousel-hero` class for variant styling.
 */
export default async function decorateVariant(block) {
  block.classList.add('carousel');
  await decorate(block);
}
