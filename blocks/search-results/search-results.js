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
}
