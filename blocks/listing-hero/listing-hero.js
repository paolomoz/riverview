/**
 * listing-hero — ONE navy topo hero block serving the three listing pages via a
 * variant class on the block:
 *   .search-hero  (providers) — h1 + provider search form (name + location + Search)
 *   .finder-hero  (locations) — h1 + lede + location search form + two quick links
 *   (no variant)  (blog)      — h1 only
 * Tier: TEMPLATE-SLOTTED. Holds the fixed composition (topo + wave SVGs, the
 * search field(s) + submit, the "Use my location" affordance, quick links) and
 * slots the authored values (h1, lede, field labels, quick-link CTAs).
 *
 * Sources:
 *   providers-proposed.html  section.ds-shero  [data-section="search-hero"]
 *   locations-proposed.html  section.ds-shero  [data-section="finder-hero"]
 *   blog-proposed.html       section.ds-shero  [data-section="listing-hero"]
 * Schemas: stardust/eds-schema/{providers,locations,blog}.json#(search|finder|listing)-hero
 *
 * Authored row contract (each cell = one <div>):
 *   search-hero: row0 <h1>; row1 [label1][label2]
 *   finder-hero: row0 <h1>; row1 lede; row2 [label1][label2]; row3 [<a>][<a>]
 *   blog:        row0 <h1>
 * The "Use my location" + "Search" strings are fixed chrome, authored here.
 */

const TOPO = `<svg class="ds-topo" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1.5"><path d="M-60 90 C 220 30, 460 150, 740 100 S 1230 40, 1500 110"/><path d="M-60 190 C 240 130, 480 250, 760 200 S 1250 140, 1500 210"/><path d="M-60 290 C 200 230, 440 350, 720 300 S 1210 240, 1500 310"/><path d="M-60 390 C 260 330, 500 450, 780 400 S 1270 340, 1500 410"/><path d="M-60 490 C 220 430, 460 550, 740 500 S 1230 440, 1500 510"/></g></svg>`;
const WAVE = `<svg class="ds-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path fill="#ffffff" d="M0,58 C170,94 350,16 560,32 C780,49 930,98 1130,74 C1275,57 1375,24 1440,38 L1440,100 L0,100 Z"/></svg>`;
const SEARCH_ICON = `<svg class="ds-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/></svg>`;
const PIN_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>`;

const txt = (el) => (el ? el.textContent.trim() : '');

export default async function decorate(block) {
  const rows = [...block.children];
  const cells = (row) => (row ? [...row.querySelectorAll(':scope > div')] : []);
  const isFinder = block.classList.contains('finder-hero');
  const isSearch = block.classList.contains('search-hero');

  const h1 = (rows[0]?.querySelector('h1, h2, h3')?.textContent || txt(rows[0]) || '').trim();

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const inner = document.createElement('div');
  inner.className = 'ds-shero-inner';
  inner.innerHTML = `<h1>${h1}</h1>`;

  if (isSearch || isFinder) {
    const labelRow = isFinder ? cells(rows[2]) : cells(rows[1]);
    const label1 = txt(labelRow[0]);
    const label2 = txt(labelRow[1]);
    const lede = isFinder ? txt(rows[1]) : '';
    const app = isFinder ? 'location-finder' : 'provider-search';
    const action = isFinder ? '/locations' : '/providers';
    const nameId = isFinder ? 'location-query' : 'provider-query';
    const geoId = isFinder ? 'location-geo' : 'provider-location';
    const namePlaceholder = isFinder ? ` placeholder="Location Name"` : '';
    const geoPlaceholder = isFinder ? '' : ` placeholder="Address, City or ZIP"`;

    if (lede) inner.insertAdjacentHTML('beforeend', `<p class="ds-shero-lede">${lede}</p>`);

    inner.insertAdjacentHTML('beforeend', `
      <form class="ds-shero-form" role="search" action="${action}" method="get" data-app="${app}" aria-label="${isFinder ? 'Location' : 'Provider'} search">
        <div>
          <label class="ds-field-label" for="${nameId}">${label1}</label>
          <div class="ds-input-affix">
            ${SEARCH_ICON}
            <input class="ds-input" id="${nameId}" name="query" type="search"${namePlaceholder} data-slot="search-name" autocomplete="off">
          </div>
        </div>
        <div>
          <div class="ds-field-label-row">
            <label class="ds-field-label" for="${geoId}">${label2}</label>
            <button class="ds-use-loc" type="button" data-app="${app}" data-slot="use-location">
              ${PIN_ICON}
              Use my location
            </button>
          </div>
          <input class="ds-input" id="${geoId}" name="location" type="text"${geoPlaceholder} data-slot="search-location" autocomplete="off">
        </div>
        <button class="ds-btn ds-btn--mint ds-shero-submit" type="submit" data-slot="search-submit">Search</button>
      </form>`);

    if (isFinder) {
      const quick = cells(rows[3]).map((c) => c.querySelector('a')).filter(Boolean);
      if (quick.length) {
        const links = quick.map((a, i) => `<a class="ds-btn ds-btn--outline-light" href="${a.getAttribute('href')}" data-app="${app}" data-slot="${i === 0 ? 'quick-near-me' : 'quick-clinics'}">${a.textContent.trim()}</a>`).join('');
        inner.insertAdjacentHTML('beforeend', `<div class="ds-shero-quick">${links}</div>`);
      }
    }
  }

  wrap.append(inner);
  block.replaceChildren();
  block.insertAdjacentHTML('beforeend', TOPO);
  block.append(wrap);
  block.insertAdjacentHTML('beforeend', WAVE);
}
