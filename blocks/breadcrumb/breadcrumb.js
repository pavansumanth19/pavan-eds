/**
 * humanizes a url path segment into a readable label
 * @param {string} segment url path segment, e.g. "hiking-trips"
 * @returns {string} human readable label, e.g. "Hiking Trips"
 */
function humanize(segment) {
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 *
 * @param {HTMLElement} $block The main element
 */
export default function decorate($block) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const $ul = document.createElement('ul');
  $block.append($ul);
  let path = '';
  segments.forEach((segment, i) => {
    path += `/${segment}`;
    const isLast = i === segments.length - 1;
    const $li = document.createElement('li');
    $ul.append($li);
    let $wrap = $li;
    if (!isLast) {
      $wrap = document.createElement('a');
      $wrap.href = path;
      $li.append($wrap);
    }
    const $span = document.createElement('span');
    $span.textContent = humanize(segment);
    $wrap.append($span);
  });
}
