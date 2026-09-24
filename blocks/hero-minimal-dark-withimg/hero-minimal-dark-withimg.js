/**
 * Hero variant (minimal-dark-withimg): a section heading followed by a gallery
 * of image cards (e.g. "Members Only" teaser grid). Scoped to its own class so
 * it does not affect the base hero block.
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // First row with only a heading (and no image) is treated as the section title.
  const headingRow = rows.find((row) => row.querySelector('h1, h2, h3, h4, h5, h6')
    && !row.querySelector('picture, img'));
  if (headingRow) {
    headingRow.classList.add('hero-minimal-dark-withimg-title');
  }

  // Remaining rows that contain imagery become gallery items.
  const gallery = document.createElement('div');
  gallery.className = 'hero-minimal-dark-withimg-gallery';

  rows.forEach((row) => {
    if (row === headingRow) return;
    if (!row.querySelector('picture, img')) return;
    row.classList.add('hero-minimal-dark-withimg-item');
    gallery.append(row);
  });

  if (gallery.children.length) {
    block.append(gallery);
  }
}
