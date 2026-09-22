import decorate from '../columns/columns.js';

/**
 * columns-featured variant — grey "featured article" promo card with image on
 * one side and eyebrow + heading + paragraph + CTA on the other. Delegates to
 * the base columns decorator (adding the base `columns` class so its column /
 * image-column transform and CSS apply), then keeps its own `columns-featured`
 * class for variant styling.
 */
export default function decorateVariant(block) {
  block.classList.add('columns');
  decorate(block);
}
