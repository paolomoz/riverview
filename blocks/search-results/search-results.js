/**
 * search-results — federated result list (verbatim results) + pagination.
 * Tier: RECONSTRUCTIVE. Authors add result units; decorate() segments them and
 * rebuilds the federated list + count + pagination. The result set + count +
 * page links are captured verbatim (site-search binds the live index at EDS).
 *
 * Source: stardust/prototypes/search-results-proposed.html (section.ds-searchmain)
 * Schema: stardust/eds-schema/search-results.json#search-results
 *
 * Authored row contract:
 *   0        count line — <p>24 results</p>
 *   1..n-1   result — cell = <h3><a href>Title</a></h3> [<p>snippet</p>] <p>url</p>
 *            (a result title is a CTA, not a heading — the <h3> wraps only the link)
 *   last     pagination — cell = <span>1</span> + <a>2..6</a> + <a rel="next">Next</a>
 */

const NEXT_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6"/></svg>`;

export default async function decorate(block) {
  const rows = [...block.children];
  const cellOf = (row) => (row ? row.querySelector(':scope > div') || row : null);
  const countCell = cellOf(rows[0]);
  const pagerCell = cellOf(rows[rows.length - 1]);
  const resultCells = rows.slice(1, -1).map(cellOf).filter(Boolean);

  const countText = (countCell?.textContent || '').trim();

  const list = document.createElement('ul');
  list.className = 'ds-results';
  list.setAttribute('data-slot', 'results');
  resultCells.forEach((cell) => {
    const link = cell.querySelector('h3 a, a');
    if (!link) return;
    const ps = [...cell.querySelectorAll(':scope > p')];
    const urlP = ps[ps.length - 1];
    const snippetP = ps.length > 1 ? ps[0] : null;
    const li = document.createElement('li');
    li.className = 'ds-result';
    li.setAttribute('data-slot', 'result');
    li.innerHTML = `<h3 class="ds-result-title"><a href="${link.getAttribute('href')}">${link.textContent.trim()}</a></h3>`;
    if (snippetP) { const p = document.createElement('p'); p.className = 'ds-result-snippet'; p.innerHTML = snippetP.innerHTML; li.append(p); }
    if (urlP) { const p = document.createElement('p'); p.className = 'ds-result-url'; p.textContent = urlP.textContent.trim(); li.append(p); }
    list.append(li);
  });

  // pagination — preserve authored order of spans (current) + anchors (pages/next)
  const pagerItems = [...(pagerCell?.querySelectorAll('a, span') || [])];
  const pagerLis = pagerItems.map((el) => {
    const text = el.textContent.trim();
    if (el.tagName === 'A') {
      const isNext = /^next$/i.test(text) || el.getAttribute('rel') === 'next';
      const rel = isNext ? ' rel="next"' : '';
      return `<li><a class="ds-page-link" href="${el.getAttribute('href')}"${rel}>${text}${isNext ? ` ${NEXT_ICON}` : ''}</a></li>`;
    }
    return `<li><span class="ds-page-link" aria-current="page">${text}</span></li>`;
  }).join('');

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  wrap.innerHTML = `
    <h2 class="ds-sr-only" id="results-h2">Search results</h2>
    <p class="ds-result-count" data-slot="results-count">${countText}</p>`;
  wrap.append(list);
  if (pagerLis) {
    const nav = document.createElement('nav');
    nav.className = 'ds-pagenav';
    nav.setAttribute('aria-label', 'Search result pages');
    nav.setAttribute('data-slot', 'pagination');
    nav.innerHTML = `<ul>${pagerLis}</ul>`;
    wrap.append(nav);
  }

  block.replaceChildren(wrap);

  // Phase-3 dynamic: federated live search across provider/location/content indexes,
  // wired to the site-search-hero input (and the ?keys= query param).
  const { loadIndex } = await import('/scripts/list-search.js');
  const [prov, loc, cont] = await Promise.all([
    loadIndex('/provider-index.json'), loadIndex('/location-index.json'), loadIndex('/content-index.json'),
  ]);
  if (!prov && !loc && !cont) return;
  const TYPE = { blog: 'Article', 'press-release': 'News', 'patient-story': 'Patient Story', video: 'Video' };
  const corpus = [
    ...(prov || []).map((r) => ({ title: r.name, path: r.path, kind: 'Provider', extra: r.specialty || '' })),
    ...(loc || []).map((r) => ({ title: r.title, path: r.path, kind: 'Location', extra: r.city || '' })),
    ...(cont || []).map((r) => ({ title: r.title, path: r.path, kind: TYPE[r.type] || 'Page', extra: '' })),
  ];
  const countEl = wrap.querySelector('.ds-result-count');
  const nav = wrap.querySelector('.ds-pagenav');
  function run(q) {
    const query = q.trim().toLowerCase();
    if (!query) return; // empty → keep captured default state
    const hits = corpus.filter((r) => r.title && (r.title.toLowerCase().includes(query) || r.extra.toLowerCase().includes(query))).slice(0, 50);
    countEl.textContent = `${hits.length} result${hits.length === 1 ? '' : 's'} for “${q.trim()}”`;
    list.replaceChildren(...hits.map((r) => {
      const li = document.createElement('li');
      li.className = 'ds-result';
      li.innerHTML = `<h3 class="ds-result-title"><a href="${r.path}">${r.title}</a></h3>
        <p class="ds-result-snippet">${r.kind}${r.extra ? ` · ${r.extra}` : ''}</p>
        <p class="ds-result-url">riverview.org${r.path}</p>`;
      return li;
    }));
    if (nav) nav.hidden = true;
  }
  const input = document.querySelector('.site-search-hero input[type="search"], .site-search-hero input[name="keys"], input[name="keys"]');
  if (input) {
    let t;
    input.addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => run(e.target.value), 180); });
    const form = input.closest('form');
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); });
  }
  const keys = new URLSearchParams(window.location.search).get('keys');
  if (keys) { if (input) input.value = keys; run(keys); }
}
