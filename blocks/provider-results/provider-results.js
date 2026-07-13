/**
 * provider-results — the provider directory result cards (ds-pcard) + pagination.
 * Tier: RECONSTRUCTIVE. Authors add card units; decorate() segments them (on the
 * per-card <h3> name) and rebuilds each card, then the numbered pagination.
 * Equal-height cards preserved (grid align-items:stretch + actions margin-top:auto).
 * The result set / count / paging is the captured default state (page 1 of 377);
 * live search + pagination is the Phase-3 hydration seam (data-app/data-slot kept).
 *
 * Source: providers-proposed.html [data-section="results-grid"] (article.ds-pcard)
 * Schema: stardust/eds-schema/providers.json#results-grid
 *
 * Authored card cell children (order-free; classified by tag/pattern):
 *   <img>                              provider portrait (absolute riverview CDN URL)
 *   <h3><a href>Name</a></h3>          provider name (links to detail page)
 *   <p>Specialty</p>                   specialty (plain <p>, no link/strong)
 *   <p>4.9 (134)</p>                   rating (optional; "score (count)")
 *   <p><strong>Place</strong>Addr</p>  location name (strong) + address
 *   <p>Show 1 more location</p>        more-locations note (optional)
 *   <p><a href>Schedule an Appointment</a></p>   book CTA (optional)
 *   <p><a href="tel:…">phone</a></p>            office phone (optional)
 *   <p><a href>View details</a></p>             details link
 *   <p>Not accepting new patients</p>           status (optional; when no book CTA)
 * Primary action slot: Schedule CTA → navy button; else "Not accepting" → disabled
 *   status pill; else a captured phone → outline phone button.
 * Last row (no <h3>) = pagination (numbered links + Next).
 */

const PHONE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const NEXT_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6"/></svg>`;
const RATING_RE = /^(\d+(?:\.\d+)?)\s*\((\d+)\)$/;

const cellOf = (row) => row.querySelector(':scope > div') || row;

function buildRating(scoreText, count) {
  const score = parseFloat(scoreText);
  const width = Math.round((score / 5) * 100);
  return `<p class="ds-pcard-rating" role="img" aria-label="${scoreText} out of 5 (${count} ratings)"><span class="ds-stars" aria-hidden="true"><span class="ds-stars-fill" style="width:${width}%"></span></span><span class="ds-stars-text">${scoreText} (${count})</span></p>`;
}

function buildCard(cell) {
  const img = cell.querySelector('img');
  const nameA = cell.querySelector('h3 a') || cell.querySelector('h3');
  const name = (nameA?.textContent || '').trim();
  const nameHref = nameA?.getAttribute('href') || '#';

  const links = [...cell.querySelectorAll('a')];
  const scheduleA = links.find((a) => /schedule an appointment/i.test(a.textContent));
  const telA = links.find((a) => (a.getAttribute('href') || '').startsWith('tel:'));
  const detailsA = links.find((a) => /view details/i.test(a.textContent));

  const textPs = [...cell.querySelectorAll('p')].filter((p) => !p.querySelector('a'));
  const place = textPs.find((p) => p.querySelector('strong'));
  const rating = textPs.find((p) => RATING_RE.test(p.textContent.trim()));
  const morelocs = textPs.find((p) => /more location/i.test(p.textContent));
  const status = textPs.find((p) => /not accepting/i.test(p.textContent));
  const spec = textPs.find((p) => p !== place && p !== rating && p !== morelocs && p !== status);

  // info column
  let info = `<h3 class="ds-pcard-name"><a href="${nameHref}" aria-label="View details for ${name}">${name}</a></h3>`;
  if (spec) info += `<p class="ds-pcard-spec">${spec.textContent.trim()}</p>`;
  if (rating) {
    const m = rating.textContent.trim().match(RATING_RE);
    info += buildRating(m[1], m[2]);
  }
  if (place) {
    const strong = place.querySelector('strong');
    const placeName = strong.textContent.trim();
    const addr = place.textContent.replace(placeName, '').trim();
    info += `<p class="ds-pcard-place"><strong>${placeName}</strong><span class="ds-pcard-addr">${addr}</span></p>`;
  }
  if (morelocs) info += `<p class="ds-pcard-morelocs">${morelocs.textContent.trim()}</p>`;

  // action slot
  const telIsPrimary = !scheduleA && !status && telA;
  let primary;
  if (scheduleA) {
    primary = `<a class="ds-btn ds-btn--primary" href="${scheduleA.getAttribute('href')}">Schedule an Appointment</a>`;
  } else if (status) {
    primary = `<span class="ds-btn ds-btn--disabled" role="status">${status.textContent.trim()}</span>`;
  } else if (telA) {
    primary = `<a class="ds-btn ds-btn--outline" href="${telA.getAttribute('href')}" aria-label="Call ${name}’s office">${PHONE_ICON}${telA.textContent.trim()}</a>`;
  } else {
    primary = '';
  }

  let subacts = '';
  if (telA && !telIsPrimary) {
    subacts += `<a class="ds-pcard-tel" href="${telA.getAttribute('href')}" aria-label="Call ${name}’s office">${telA.textContent.trim()}</a>`;
  }
  if (detailsA) {
    subacts += `<a class="ds-link ds-pcard-details" href="${detailsA.getAttribute('href')}" aria-label="View details for ${name}">View details</a>`;
  }

  const article = document.createElement('article');
  article.className = 'ds-pcard';
  article.setAttribute('data-slot', 'result-card');
  article.innerHTML = `
    <div class="ds-pcard-top">
      <div class="ds-pcard-media">${img ? img.outerHTML : ''}</div>
      <div class="ds-pcard-info">${info}</div>
    </div>
    <div class="ds-pcard-actions">${primary}<div class="ds-pcard-subacts">${subacts}</div></div>`;
  return article;
}

function buildPager(cell, label) {
  const items = [...cell.querySelectorAll('a, span')];
  if (!items.length) return null;
  const lis = items.map((el) => {
    const t = el.textContent.trim();
    if (el.tagName === 'SPAN') return `<li><span class="ds-page-link" aria-current="page">${t}</span></li>`;
    const isNext = /^next$/i.test(t) || el.getAttribute('rel') === 'next';
    const current = el.hasAttribute('aria-current') ? ' aria-current="page"' : '';
    const rel = isNext ? ' rel="next"' : '';
    return `<li><a class="ds-page-link" href="${el.getAttribute('href')}"${rel}${current}>${t}${isNext ? ` ${NEXT_ICON}` : ''}</a></li>`;
  }).join('');
  const nav = document.createElement('nav');
  nav.className = 'ds-pagenav';
  nav.setAttribute('aria-label', label);
  nav.setAttribute('data-slot', 'pagination');
  nav.innerHTML = `<ul>${lis}</ul>`;
  return nav;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const cardRows = rows.filter((r) => cellOf(r).querySelector('h3'));
  const pagerRow = rows.find((r) => !cellOf(r).querySelector('h3') && cellOf(r).querySelector('a, span'));

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  wrap.innerHTML = '<h2 class="ds-sr-only" id="results-h2">Search results</h2>';

  const grid = document.createElement('div');
  grid.className = 'ds-cards';
  grid.setAttribute('data-slot', 'results');
  cardRows.forEach((row) => grid.append(buildCard(cellOf(row))));
  wrap.append(grid);

  if (pagerRow) {
    const nav = buildPager(cellOf(pagerRow), 'Search results pages');
    if (nav) wrap.append(nav);
  }

  block.replaceChildren(wrap);

  // Phase-3 dynamic: fetch the provider index and take over with live
  // search / specialty filter / accepting toggle / pagination. Progressive
  // enhancement — if the index isn't reachable, the static cards above stand.
  enhanceDynamic(wrap, grid);
}

const PER_PAGE = 12;
function cardFromIndex(p) {
  const el = document.createElement('article');
  el.className = 'ds-pcard';
  const action = p.accepting
    ? '<a class="ds-btn ds-btn--primary" href="/schedule-appointment">Schedule an Appointment</a>'
    : '<span class="ds-btn ds-btn--disabled" aria-disabled="true">Not accepting new patients</span>';
  el.innerHTML = `
    <div class="ds-pcard-top">
      ${p.image ? `<img class="ds-pcard-photo" src="${p.image}" alt="${p.name}" width="130" height="176" loading="lazy">` : ''}
      <h3 class="ds-pcard-name"><a href="${p.path}">${p.name}</a></h3>
      ${p.specialty ? `<p class="ds-pcard-spec">${p.specialty}</p>` : ''}
      ${p.locations && p.locations[0] ? `<p class="ds-pcard-loc">${p.locations[0]}</p>` : ''}
      ${p.phone ? `<p class="ds-pcard-phone"><a href="tel:${p.phone.replace(/[^\d]/g, '')}">${p.phone}</a></p>` : ''}
    </div>
    <div class="ds-pcard-actions">${action}<a class="ds-link" href="${p.path}">View details</a></div>`;
  return el;
}

async function enhanceDynamic(wrap, staticGrid) {
  let idx;
  try {
    const res = await fetch('/provider-index.json');
    if (!res.ok) return;
    idx = (await res.json()).data || [];
  } catch { return; }
  if (!Array.isArray(idx) || !idx.length) return;

  const specs = [...new Set(idx.map((p) => p.specialty).filter(Boolean))].sort();
  const controls = document.createElement('form');
  controls.className = 'ds-pfilter';
  controls.setAttribute('data-app', 'provider-search');
  controls.innerHTML = `
    <label class="ds-pfilter-search"><span class="ds-sr-only">Search providers by name</span>
      <input type="search" name="q" placeholder="Search by name…" autocomplete="off"></label>
    <label class="ds-pfilter-spec"><span class="ds-sr-only">Filter by specialty</span>
      <select name="spec"><option value="">All specialties</option>${specs.map((s) => `<option value="${s}">${s}</option>`).join('')}</select></label>
    <label class="ds-pfilter-accept"><input type="checkbox" name="accepting"> Accepting new patients</label>
    <p class="ds-pfilter-count" role="status" aria-live="polite"></p>`;
  wrap.insertBefore(controls, staticGrid);

  const grid = document.createElement('div');
  grid.className = 'ds-cards';
  grid.setAttribute('data-slot', 'results');
  staticGrid.replaceWith(grid);
  const pager = document.createElement('nav');
  pager.className = 'ds-pager';
  pager.setAttribute('aria-label', 'Search results pages');
  grid.after(pager);

  const state = { q: '', spec: '', accepting: false, page: 1 };
  const countEl = controls.querySelector('.ds-pfilter-count');

  function filtered() {
    const q = state.q.trim().toLowerCase();
    return idx.filter((p) => (!q || p.name.toLowerCase().includes(q))
      && (!state.spec || p.specialty === state.spec || (p.specialties || []).includes(state.spec))
      && (!state.accepting || p.accepting));
  }
  function renderPage() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);
    grid.replaceChildren(...slice.map(cardFromIndex));
    countEl.textContent = `${list.length} provider${list.length === 1 ? '' : 's'}`;
    pager.replaceChildren();
    if (pages > 1) {
      for (let i = 1; i <= pages && i <= 8; i += 1) {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = i; b.className = i === state.page ? 'is-current' : '';
        b.addEventListener('click', () => { state.page = i; renderPage(); grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        pager.append(b);
      }
    }
  }
  controls.querySelector('[name=q]').addEventListener('input', (e) => { state.q = e.target.value; state.page = 1; renderPage(); });
  controls.querySelector('[name=spec]').addEventListener('change', (e) => { state.spec = e.target.value; state.page = 1; renderPage(); });
  controls.querySelector('[name=accepting]').addEventListener('change', (e) => { state.accepting = e.target.checked; state.page = 1; renderPage(); });
  controls.addEventListener('submit', (e) => e.preventDefault());
  renderPage();
}
