/**
 * location-results — the locations directory result cards (ds-lcard), preceded by
 * the in-page map view (a keyless Google Maps embed, hidden in its captured default
 * state; the iframe src is set on first open by the toolbar's "View on map" toggle —
 * a Phase-3 hydration seam, so the embed is authored with data-src and stays inert).
 * Tier: RECONSTRUCTIVE. Authors add card units; decorate() segments them (on the
 * per-card <h3>) and rebuilds each card.
 *
 * Source: locations-proposed.html [data-section="results-grid"] (article.ds-lcard)
 * Schema: stardust/eds-schema/locations.json#results-grid
 *
 * Authored card cell children:
 *   <img>                          location photo (absolute riverview CDN URL)
 *   <p>Type</p>                    location-type chip (optional; omitted → none)
 *   <p>+ 1</p>                      "+ N" more-types note (optional, follows the type)
 *   <h3><a href>Name</a></h3>      location name (links to detail page)
 *   <p>Address</p>                 street address (no link)
 *   <p><a href>View details</a></p>  details CTA (outline button)
 */

const MAP_EMBED = 'https://maps.google.com/maps?ll=40.05,-86.05&z=10&q=Riverview+Health&output=embed';

const cellOf = (row) => row.querySelector(':scope > div') || row;

function buildCard(cell) {
  const kids = [...cell.children];
  const img = cell.querySelector('img');
  const h3 = cell.querySelector('h3');
  const nameA = h3?.querySelector('a') || h3;
  const name = (nameA?.textContent || '').trim();
  const nameHref = nameA?.getAttribute('href') || '#';
  const h3idx = kids.indexOf(h3);

  const typeParts = kids.slice(0, h3idx === -1 ? kids.length : h3idx)
    .filter((k) => k.tagName === 'P' && !k.querySelector('a'))
    .map((p) => p.textContent.trim())
    .filter(Boolean);

  const afterPs = kids.slice(h3idx + 1).filter((k) => k.tagName === 'P' && !k.querySelector('a'));
  const addr = (afterPs[0]?.textContent || '').trim();
  const detailsA = [...cell.querySelectorAll('a')].find((a) => /view details/i.test(a.textContent));
  const detailsHref = detailsA?.getAttribute('href') || nameHref;

  let body = '';
  if (typeParts.length) {
    const more = typeParts[1] ? `<span class="ds-chip-more">${typeParts[1]}</span>` : '';
    body += `<p class="ds-lcard-type"><span class="ds-chip">${typeParts[0]}</span>${more}</p>`;
  }
  body += `<h3 class="ds-lcard-name"><a href="${nameHref}" aria-label="View details for ${name}">${name}</a></h3>`;
  if (addr) body += `<p class="ds-lcard-addr">${addr}</p>`;

  const article = document.createElement('article');
  article.className = 'ds-lcard';
  article.setAttribute('data-slot', 'result-card');
  article.innerHTML = `
    <div class="ds-lcard-media">${img ? img.outerHTML : ''}</div>
    <div class="ds-lcard-body">${body}</div>
    <div class="ds-lcard-actions">
      <a class="ds-btn ds-btn--outline" href="${detailsHref}" aria-label="View details for ${name}">View details</a>
    </div>`;
  return article;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const cardRows = rows.filter((r) => cellOf(r).querySelector('h3'));

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  wrap.innerHTML = `
    <h2 class="ds-sr-only" id="results-h2">Locations</h2>
    <div id="finder-map" class="ds-finder-map" data-app="location-finder" data-slot="map-view" hidden>
      <iframe class="ds-finder-map-frame" title="Map of Riverview Health locations across Hamilton County, Indiana" data-src="${MAP_EMBED}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>`;

  const grid = document.createElement('div');
  grid.className = 'ds-cards';
  grid.setAttribute('data-app', 'location-finder');
  grid.setAttribute('data-slot', 'results');
  cardRows.forEach((row) => grid.append(buildCard(cellOf(row))));
  wrap.append(grid);

  block.replaceChildren(wrap);

  // Phase-3 dynamic: live location search + city facet over /location-index.json
  const { loadIndex, enhanceList } = await import('/scripts/list-search.js');
  const data = await loadIndex('/location-index.json');
  if (!data) return;
  const cities = [...new Set(data.map((r) => r.city).filter(Boolean))].sort();
  enhanceList(wrap, grid, {
    data: data.slice().sort((a, b) => a.title.localeCompare(b.title)),
    noun: 'location',
    perPage: 18,
    search: (r, q) => r.title.toLowerCase().includes(q) || (r.city || '').toLowerCase().includes(q),
    facets: [{ name: 'city', label: 'All cities', values: cities, match: (r, v) => r.city === v }],
    card: (r) => {
      const el = document.createElement('article');
      el.className = 'ds-lcard';
      const dir = (r.lat && r.lng) ? `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}` : '';
      el.innerHTML = `<div class="ds-lcard-body">
        <h3 class="ds-lcard-name"><a href="${r.path}">${r.title}</a></h3>
        ${r.city ? `<p class="ds-lcard-city">${r.city}, IN</p>` : ''}
        ${r.phone ? `<p class="ds-lcard-phone"><a href="tel:${r.phone.replace(/[^\d]/g, '')}">${r.phone}</a></p>` : ''}
        <div class="ds-lcard-actions"><a class="ds-link" href="${r.path}">View details</a>${dir ? `<a class="ds-link" href="${dir}">Get directions</a>` : ''}</div>
      </div>`;
      return el;
    },
  });
}
