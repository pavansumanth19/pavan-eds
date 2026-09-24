const PAGE_SIZE = 10;
const COLUMNS = ['Name', 'Department', 'Experience', 'City'];

let placeholders;

/**
 * Fetches and caches the site's placeholders sheet.
 * @returns {Promise<Object>} Key/value map of placeholders
 */
async function fetchPlaceholders() {
  if (!placeholders) {
    placeholders = {};
    const resp = await fetch('/placeholders.json');
    if (resp.ok) {
      const json = await resp.json();
      json.data.forEach(({ Key, Value }) => {
        if (Key) placeholders[Key] = Value;
      });
    }
  }
  return placeholders;
}

/**
 * Appends a page of employee rows to a table body.
 * @param {Element} tbody The table body to append rows to
 * @param {Array} employees The employees to render
 */
function renderRows(tbody, employees) {
  employees.forEach((employee) => {
    const row = document.createElement('tr');
    COLUMNS.forEach((column) => {
      const cell = document.createElement('td');
      cell.textContent = employee[column] || '';
      row.append(cell);
    });
    tbody.append(row);
  });
}

export default async function decorate(block) {
  const resp = await fetch('/employees.json');
  if (!resp.ok) return;
  const { data: employees } = await resp.json();

  block.textContent = '';

  const table = document.createElement('table');
  table.innerHTML = `<thead><tr>${COLUMNS.map((column) => `<th>${column}</th>`).join('')}</tr></thead>`;
  const tbody = document.createElement('tbody');
  table.append(tbody);

  const loadMoreButton = document.createElement('button');
  loadMoreButton.type = 'button';
  loadMoreButton.className = 'button primary employee-list-load-more';
  const { loadMore = 'Load more' } = await fetchPlaceholders();
  loadMoreButton.textContent = loadMore;

  let rendered = 0;
  const showNextPage = () => {
    renderRows(tbody, employees.slice(rendered, rendered + PAGE_SIZE));
    rendered += PAGE_SIZE;
    if (rendered >= employees.length) loadMoreButton.remove();
  };
  loadMoreButton.addEventListener('click', showNextPage);

  block.append(table, loadMoreButton);
  showNextPage();
}
