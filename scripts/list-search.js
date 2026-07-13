/* list-search.js — shared client enhancer for the dynamic listing/search blocks.
   Fetches a deployed index sheet and takes over a block with live search + facet
   select(s) + pagination. Progressive enhancement: on any fetch/parse failure the
   caller's static SSR cards stand. Used by provider/location/content/site-search. */

export async function loadIndex(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    return Array.isArray(j.data) ? j.data : null;
  } catch { return null; }
}

/**
 * enhanceList(wrap, staticGrid, opts)
 *  opts.data        : array of index rows
 *  opts.perPage     : page size (default 12)
 *  opts.search      : (row, q) => bool         name/title match
 *  opts.facets      : [{ name, label, values, match(row,val) }]
 *  opts.card        : (row) => HTMLElement
 *  opts.noun        : "provider" | "location" | "result" …
 */
export function enhanceList(wrap, staticGrid, opts) {
  const { data, perPage = 12, search, facets = [], card, noun = 'result' } = opts;
  if (!Array.isArray(data) || !data.length) return;

  const form = document.createElement('form');
  form.className = 'ds-lfilter';
  form.setAttribute('data-app', 'list-search');
  const facetHtml = facets.map((f) => `<label class="ds-lfilter-facet"><span class="ds-sr-only">${f.label}</span>
      <select name="${f.name}"><option value="">${f.label}</option>${f.values.map((v) => `<option value="${v}">${v}</option>`).join('')}</select></label>`).join('');
  form.innerHTML = `<label class="ds-lfilter-search"><span class="ds-sr-only">Search</span>
      <input type="search" name="q" placeholder="Search…" autocomplete="off"></label>
    ${facetHtml}
    <p class="ds-lfilter-count" role="status" aria-live="polite"></p>`;
  wrap.insertBefore(form, staticGrid);

  const grid = document.createElement('div');
  grid.className = staticGrid.className;
  grid.setAttribute('data-slot', 'results');
  staticGrid.replaceWith(grid);
  const pager = document.createElement('nav');
  pager.className = 'ds-pager';
  pager.setAttribute('aria-label', 'Result pages');
  grid.after(pager);

  const state = { q: '', page: 1, facet: {} };
  const countEl = form.querySelector('.ds-lfilter-count');

  const filtered = () => data.filter((row) => {
    if (state.q && search && !search(row, state.q.trim().toLowerCase())) return false;
    for (const f of facets) { const v = state.facet[f.name]; if (v && !f.match(row, v)) return false; }
    return true;
  });

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / perPage));
    state.page = Math.min(state.page, pages);
    grid.replaceChildren(...list.slice((state.page - 1) * perPage, state.page * perPage).map(card));
    countEl.textContent = `${list.length} ${noun}${list.length === 1 ? '' : 's'}`;
    pager.replaceChildren();
    if (pages > 1) {
      for (let i = 1; i <= pages && i <= 8; i += 1) {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = i; b.className = i === state.page ? 'is-current' : '';
        b.addEventListener('click', () => { state.page = i; render(); grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        pager.append(b);
      }
    }
  }
  form.querySelector('[name=q]').addEventListener('input', (e) => { state.q = e.target.value; state.page = 1; render(); });
  facets.forEach((f) => form.querySelector(`[name=${f.name}]`).addEventListener('change', (e) => { state.facet[f.name] = e.target.value; state.page = 1; render(); }));
  form.addEventListener('submit', (e) => e.preventDefault());
  render();
}
