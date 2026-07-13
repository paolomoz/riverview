/**
 * site-search-hero — federated site-search hero (navy topo band + wave).
 * Tier: TEMPLATE-SLOTTED. Holds the fixed composition (topo + wave SVGs, the
 * search field + submit, the scope tab set) and slots the authored values: the
 * page <h1> and the captured scope facets with their counts.
 *
 * Source: stardust/prototypes/search-results-proposed.html  (section.ds-shero)
 * Schema: stardust/eds-schema/search-results.json#search-hero
 *
 * Authored row contract:
 *   0        <h1>Search Results</h1>            (the single page H1)
 *   1..n     scope facet — cell0 = label, cell1 = count. The FIRST facet is the
 *            active scope (aria-pressed="true"). All counts are captured verbatim.
 *
 * The search field + submit + legend are functional chrome (rebuilt here). The
 * form does not navigate (static render); the scope tabs single-select via JS.
 */

const TOPO = `<svg class="ds-topo" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1.5"><path d="M-60 90 C 220 30, 460 150, 740 100 S 1230 40, 1500 110"/><path d="M-60 190 C 240 130, 480 250, 760 200 S 1250 140, 1500 210"/><path d="M-60 290 C 200 230, 440 350, 720 300 S 1210 240, 1500 310"/><path d="M-60 390 C 260 330, 500 450, 780 400 S 1270 340, 1500 410"/><path d="M-60 490 C 220 430, 460 550, 740 500 S 1230 440, 1500 510"/></g></svg>`;
const WAVE = `<svg class="ds-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path fill="#ffffff" d="M0,58 C170,94 350,16 560,32 C780,49 930,98 1130,74 C1275,57 1375,24 1440,38 L1440,100 L0,100 Z"/></svg>`;
const SEARCH_ICON = `<svg class="ds-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/></svg>`;

export default async function decorate(block) {
  const rows = [...block.children];
  const cells = (row) => [...row.querySelectorAll(':scope > div')];

  const h1Text = (rows[0]?.querySelector('h1, h2, h3')?.textContent
    || rows[0]?.textContent || 'Search Results').trim();

  const scopes = rows.slice(1).map((row) => {
    const c = cells(row);
    return { label: (c[0]?.textContent || '').trim(), count: (c[1]?.textContent || '').trim() };
  }).filter((s) => s.label);

  const scopeBtns = scopes.map((s, i) => `<button class="ds-scope" type="button" aria-pressed="${i === 0 ? 'true' : 'false'}">${s.label} <span class="ds-scope-count">${s.count}</span></button>`).join('');

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  wrap.innerHTML = `
    <div class="ds-shero-inner">
      <h1>${h1Text}</h1>
      <form class="ds-search" role="search" action="/search-results" method="get" aria-label="Search the site">
        <label class="ds-search-label" for="site-search-input">Search</label>
        <div class="ds-searchbar">
          <div class="ds-search-field">
            ${SEARCH_ICON}
            <input class="ds-input" id="site-search-input" name="keys" type="search" placeholder="Search the site&hellip;" autocomplete="off">
          </div>
          <button class="ds-search-submit" type="submit">Search</button>
        </div>
        <fieldset class="ds-scopes-set">
          <legend class="ds-scopes-legend">Filter results by type</legend>
          <div class="ds-scopes" role="group" aria-label="Filter results by type">${scopeBtns}</div>
        </fieldset>
      </form>
    </div>`;

  block.innerHTML = TOPO;
  block.append(wrap);
  block.insertAdjacentHTML('beforeend', WAVE);

  // scope selector: single-select toggle (static render — no navigation)
  const btns = [...block.querySelectorAll('.ds-scope')];
  btns.forEach((btn) => btn.addEventListener('click', () => {
    btns.forEach((o) => o.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', 'true');
  }));
}
