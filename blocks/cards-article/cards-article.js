import decorate from '../cards/cards.js';

/**
 * cards-article variant — white 4-up article/adventure teaser grid. Delegates
 * to the base cards decorator (adding the base `cards` class so its list/card
 * transform and CSS apply), then keeps its own `cards-article` class for
 * variant styling.
 */
export default function decorateVariant(block) {
  block.classList.add('cards');
  decorate(block);
}
