/* eslint-disable */
/* global WebImporter */
/**
 * Adventure-detail metadata transformer.
 *
 * Surfaces the adventure's Activity (e.g. "Surfing") as page metadata so it
 * lands in the query index. The dynamic adventures listing then filters its
 * category tabs (Climbing/Cycling/Skiing/Surfing/Travel) by the indexed
 * activity — without per-page authoring.
 *
 * Runs in afterTransform AFTER WebImporter.rules.createMetadata has appended the
 * Metadata block to <main>. It reads the Activity from the parsed columns block
 * and appends an "activity" row to that Metadata block, which EDS renders as
 * <meta name="activity"> in the page head (and thus into the query index).
 */
export default function transform(hookName, element, payload) {
  if (hookName !== 'adventureMeta') return;
  const { document } = payload;

  // Activity lives in a "Activity" / value cell-pair in the parsed columns block.
  let activity = '';
  [...element.querySelectorAll('div, td')].forEach((cell) => {
    if (!activity && /^activity$/i.test(cell.textContent.trim())) {
      const value = cell.nextElementSibling;
      if (value) activity = value.textContent.trim();
    }
  });
  if (!activity) return;

  // createMetadata appends a two-column <table> whose first row's first cell
  // text is "Metadata". Use the DOM table API (rows/cells) to find it robustly.
  const table = [...element.querySelectorAll('table')].find((t) => t.rows
    && t.rows[0] && t.rows[0].cells[0]
    && t.rows[0].cells[0].textContent.trim().toLowerCase() === 'metadata');
  if (!table) return;

  const tbody = table.tBodies[0] || table;
  const tr = document.createElement('tr');
  const k = document.createElement('td');
  k.textContent = 'activity';
  const v = document.createElement('td');
  v.textContent = activity;
  tr.append(k, v);
  tbody.append(tr);
}
