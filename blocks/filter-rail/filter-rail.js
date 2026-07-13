/**
 * filter-rail — faceted filter rail shared by the providers and locations
 * listings. Renders the captured facets in their static default state (single
 * selected option per <select>, plus any checkbox facet). JS filtering / facet
 * counts / option lists arrive with the Phase-3 hydration seam (data-app /
 * data-slot markers kept); no options are invented here.
 * Tier: RECONSTRUCTIVE. Each authored row = one facet (label + default value);
 * a facet whose value is a placeholder ("- Any -" / "Within N miles") renders as
 * a <select>, otherwise as a checkbox.
 *
 * Sources: providers-proposed.html / locations-proposed.html [data-section="filter-rail"]
 * Schemas: stardust/eds-schema/{providers,locations}.json#filter-rail
 *
 * Authored row contract: each row = [facet label][default value]
 */

const CHEVRON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>`;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isPlaceholder = (v) => /^-\s*Any\s*-$/i.test(v) || /^Within .*miles$/i.test(v);

export default async function decorate(block) {
  const app = block.classList.contains('locations') ? 'location-finder' : 'provider-search';
  const rows = [...block.children];

  const facets = rows.map((row) => {
    const c = [...row.querySelectorAll(':scope > div')];
    return { label: (c[0]?.textContent || '').trim(), value: (c[1]?.textContent || '').trim() };
  }).filter((f) => f.label);

  const facetHtml = facets.map((f) => {
    const id = `facet-${slug(f.label)}`;
    if (isPlaceholder(f.value)) {
      const ph = /^-\s*Any\s*-$/i.test(f.value) ? ' ds-select--placeholder' : '';
      return `
        <div class="ds-facet">
          <label class="ds-facet-name" for="${id}">${f.label}</label>
          <select class="ds-select${ph}" id="${id}" name="${slug(f.label)}" data-slot="filter-${slug(f.label)}">
            <option value="" selected>${f.value}</option>
          </select>
        </div>`;
    }
    return `
      <fieldset class="ds-facet">
        <legend class="ds-facet-name">${f.label}</legend>
        <label class="ds-check"><input type="checkbox" name="${slug(f.label)}" data-slot="filter-${slug(f.label)}">${f.value}</label>
      </fieldset>`;
  }).join('');

  const aside = document.createElement('div');
  aside.className = 'ds-wrap';
  aside.innerHTML = `
    <aside class="ds-rail" aria-labelledby="filters-h2">
      <h2 class="ds-sr-only" id="filters-h2">Filters</h2>
      <details class="ds-rail-disc" open>
        <summary>
          <span class="ds-disc-pill">Filters ${CHEVRON}</span>
        </summary>
        <form class="ds-rail-body" data-app="${app}" aria-label="Filter ${app === 'location-finder' ? 'locations' : 'providers'}">
          ${facetHtml}
        </form>
      </details>
    </aside>`;

  block.replaceChildren(aside);
}
