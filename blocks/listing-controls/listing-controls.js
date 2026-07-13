/**
 * listing-controls — the blog listing's search + filter controls on white, below
 * the hero band (verbatim captured IA): a keyword search field, three facet
 * selects (Categories / Tags / Authors) in their default "- Any -" state, and the
 * "Viewing N of M items" count. Option lists + live filtering are the Phase-3
 * hydration seam (data-app / data-slot markers kept); no options invented.
 * Tier: RECONSTRUCTIVE.
 *
 * Source: blog-proposed.html [data-section="listing-controls"] (section.ds-controls)
 * Schema: stardust/eds-schema/blog.json#listing-controls
 *
 * Authored row contract:
 *   row0            single cell → keyword search field label ("Search")
 *   facet rows      [facet label][default value]  → a <select>
 *   last row        single cell "Viewing N of M items" → the count line
 */

const SEARCH_ICON = `<svg class="ds-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/></svg>`;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default async function decorate(block) {
  const rows = [...block.children];
  let searchLabel = 'Search';
  let viewing = '';
  const facets = [];

  rows.forEach((row) => {
    const c = [...row.querySelectorAll(':scope > div')];
    const t0 = (c[0]?.textContent || '').trim();
    if (c.length >= 2) {
      facets.push({ label: t0, value: (c[1]?.textContent || '').trim() });
    } else if (/^Viewing\b/i.test(t0)) {
      viewing = t0;
    } else if (t0) {
      searchLabel = t0;
    }
  });

  const facetHtml = facets.map((f) => {
    const id = `facet-${slug(f.label)}`;
    return `
        <div>
          <label class="ds-ctrl-label" for="${id}">${f.label}</label>
          <select class="ds-select ds-select--placeholder" id="${id}" name="${slug(f.label)}" data-slot="filter-${slug(f.label)}">
            <option selected value="">${f.value}</option>
          </select>
        </div>`;
  }).join('');

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  wrap.innerHTML = `
    <h2 class="ds-sr-only" id="controls-h2">Search and filter</h2>
    <form class="ds-controls-form" role="search" action="/blog" method="get" data-app="content-listing" aria-label="Search and filter articles">
      <div>
        <label class="ds-ctrl-label" for="blog-keyword">${searchLabel}</label>
        <div class="ds-input-affix">
          ${SEARCH_ICON}
          <input class="ds-input" id="blog-keyword" name="keyword" type="search" placeholder="Search by keyword" data-slot="search-keyword" autocomplete="off">
        </div>
      </div>
      <div class="ds-ctrl-facets">${facetHtml}</div>
    </form>
    <p class="ds-viewing" data-app="content-listing" data-slot="results-count">${viewing}</p>`;

  block.replaceChildren(wrap);
}
