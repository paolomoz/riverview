/**
 * results-toolbar — refine/count/view toolbar shared by the providers and
 * locations listings, selected by a variant class:
 *   .providers  — grid toolbar: "Hide filters" | count + 2 quick-filter chips + "View on map"
 *   .locations  — flex toolbar: count + "View on map" link (opens Google Maps; no-JS fallback)
 * Tier: RECONSTRUCTIVE. Reads the authored text/links and rebuilds the toolbar.
 * The stateful ARIA (aria-pressed/aria-expanded) is a Phase-3 hydration seam
 * (data-app / data-slot markers kept); rendered here in its static default state.
 *
 * Sources: providers-proposed.html / locations-proposed.html [data-section="results-toolbar"]
 * Schemas: stardust/eds-schema/{providers,locations}.json#results-toolbar
 *
 * Authored row contract:
 *   providers: [Hide filters][377 results][Accepting new patients][Offers Virtual Visits][View on map]
 *   locations: [Viewing 14 of 43 locations][<a href=maps>View on map</a>]
 */

const FILTER_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 7h16M7 12h10M10 17h4"/></svg>`;
const MAP_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>`;
const LIST_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" hidden><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`;

const txt = (row) => (row ? (row.querySelector(':scope > div') || row).textContent.trim() : '');

export default async function decorate(block) {
  const rows = [...block.children];
  const isLocations = block.classList.contains('locations');

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';

  if (isLocations) {
    const count = txt(rows[0]);
    const link = rows[1]?.querySelector('a');
    const href = link ? link.getAttribute('href') : '#';
    const label = link ? link.textContent.trim() : 'View on map';
    wrap.innerHTML = `
      <div class="ds-toolbar">
        <p class="ds-results-count" data-app="location-finder" data-slot="results-count">${count}</p>
        <a class="ds-toolbar-act" id="map-toggle" href="${href}" target="_blank" rel="noopener" data-app="location-finder" data-slot="map-toggle" aria-controls="finder-map" aria-expanded="false" aria-label="View Riverview Health locations on a map">
          ${MAP_ICON}${LIST_ICON}<span class="ds-map-toggle-label">${label}</span>
        </a>
      </div>`;
  } else {
    const [hide, count, chip1, chip2, map] = rows.map(txt);
    wrap.innerHTML = `
      <div class="ds-toolbar">
        <div class="ds-toolbar-rail-cell">
          <button class="ds-toolbar-act ds-toolbar-filters-btn" type="button" data-app="provider-search" data-slot="toggle-filters">
            ${FILTER_ICON}${hide}
          </button>
        </div>
        <div class="ds-toolbar-main">
          <p class="ds-results-count" data-app="provider-search" data-slot="results-count">${count}</p>
          <button class="ds-chip-toggle" type="button" data-app="provider-search" data-slot="quick-filter-accepting">
            <span class="ds-chip-dot" aria-hidden="true"></span>${chip1}
          </button>
          <button class="ds-chip-toggle" type="button" data-app="provider-search" data-slot="quick-filter-virtual">
            <span class="ds-chip-dot" aria-hidden="true"></span>${chip2}
          </button>
          <button class="ds-toolbar-act ds-toolbar-map" type="button" data-app="provider-search" data-slot="view-map">
            ${MAP_ICON}${map}
          </button>
        </div>
      </div>`;
  }

  block.replaceChildren(wrap);
}
