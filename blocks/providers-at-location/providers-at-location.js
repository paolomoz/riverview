/**
 * providers-at-location — "Providers at This Location" mini provider cards +
 * an optional "View More" CTA.
 * Tier: RECONSTRUCTIVE. Authors add card units; decorate() segments them (on the
 * per-card <h3>) and rebuilds each. Cards are EQUAL-HEIGHT: the grid stretches,
 * each <li> is a flex column, .ds-mini takes flex:1 and its actions sit at
 * margin-top:auto so 1-line and 2-line names keep the same card height.
 *
 * Source: location-riverview-health-physicians-obgyn-proposed.html [data-section="providers-at-location"]
 * Schema: stardust/eds-schema/location-riverview-health-physicians-obgyn.json#providers-at-location
 *
 * Rows (content/location/riverview-health-physicians-obgyn.html):
 *   head row → <h2> section title ("Providers at This Location")
 *   card rows → cell with:
 *     <img>                                  portrait (absolute riverview CDN URL)
 *     <h3><a href>Name</a></h3>              provider name (links to detail page)
 *     <p>Specialty</p>                        specialty
 *     <p><a href="tel:…">phone</a></p>        per-provider office phone
 *     <p><a href="…">View details</a></p>     details link
 *   more row → cell with a lone <a> (no <h3>/<img>) → "View More" outline button
 */

const PHONE_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

const cellOf = (row) => row.querySelector(':scope > div') || row;

function buildCard(cell) {
  const img = cell.querySelector('img');
  const nameA = cell.querySelector('h3 a') || cell.querySelector('h3');
  const name = (nameA?.textContent || '').trim();
  const nameHref = nameA?.getAttribute('href') || '#';
  const spec = [...cell.querySelectorAll('p')].find((p) => !p.querySelector('a'));
  const links = [...cell.querySelectorAll('a')].filter((a) => a !== (cell.querySelector('h3 a')));
  const telA = links.find((a) => (a.getAttribute('href') || '').startsWith('tel:'));
  const detailsA = links.find((a) => /view details/i.test(a.textContent));

  let phone = '';
  if (telA) {
    const num = (telA.textContent || '').trim();
    phone = `<a class="ds-mini-phone" href="${telA.getAttribute('href')}" aria-label="Call ${name}’s office at ${num}">${PHONE_ICON}${num}</a>`;
  }
  const details = detailsA
    ? `<a class="ds-link ds-mini-details" href="${detailsA.getAttribute('href')}" aria-label="View details for ${name}">View details</a>`
    : '';

  const li = document.createElement('li');
  li.innerHTML = `
    <article class="ds-mini">
      <div class="ds-mini-media">${img ? img.outerHTML : ''}</div>
      <div class="ds-mini-body">
        <h3 class="ds-mini-name"><a href="${nameHref}">${name}</a></h3>
        ${spec ? `<p class="ds-mini-spec">${(spec.textContent || '').trim()}</p>` : ''}
        <div class="ds-mini-actions">${phone}${details}</div>
      </div>
    </article>`;
  return li;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const headRow = rows.find((r) => cellOf(r).querySelector('h2'));
  const cardRows = rows.filter((r) => cellOf(r).querySelector('h3'));
  const moreRow = rows.find((r) => {
    const c = cellOf(r);
    return !c.querySelector('h2') && !c.querySelector('h3') && !c.querySelector('img') && c.querySelector('a');
  });

  block.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';

  if (headRow) {
    const h2 = cellOf(headRow).querySelector('h2');
    const head = document.createElement('div');
    head.className = 'ds-section-head';
    h2.classList.add('ds-h2');
    head.append(h2);
    wrap.append(head);
  }

  const grid = document.createElement('ul');
  grid.className = 'ds-mini-grid';
  cardRows.forEach((row) => grid.append(buildCard(cellOf(row))));
  wrap.append(grid);

  if (moreRow) {
    const moreA = cellOf(moreRow).querySelector('a');
    const more = document.createElement('div');
    more.className = 'ds-prov-more';
    const btn = moreA.cloneNode(true);
    btn.className = 'ds-btn ds-btn--outline';
    more.append(btn);
    wrap.append(more);
  }

  block.append(wrap);
}
