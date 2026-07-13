/**
 * blog-results — the blog article result cards (ds-bcard) + pagination.
 * Tier: RECONSTRUCTIVE. Authors add card units; decorate() segments them (on the
 * per-card <h3> title) and rebuilds each card, then the numbered pagination.
 * Equal-height cards preserved (grid rows stretch + actions margin-top:auto).
 * Captured default state (page 1 of 46); live search/filter/paging is the Phase-3
 * hydration seam (data-app/data-slot kept). No star rating is present on any
 * captured card, so the rating slot is not rendered.
 *
 * Source: blog-proposed.html [data-section="results-grid"] (article.ds-bcard)
 * Schema: stardust/eds-schema/blog.json#results-grid
 *
 * Authored card cell children:
 *   <img>                          article image (absolute riverview CDN URL)
 *   <p>November 19, 2025</p>       publish date (first <p> before the title)
 *   <p>Client testimonial</p>      category chip
 *   <p>+1 more</p>                 "+N more" categories note (optional)
 *   <h3><a href>Title</a></h3>     article title (links to the post)
 *   <p>At KLR…</p>                 teaser/excerpt
 *   <p>Author: Riverview Health</p> author line
 *   <p><a href>Read article</a></p> read CTA (outline button)
 * Last row (no <h3>) = pagination (current <span> + page links + Next).
 */

const NEXT_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6"/></svg>`;

const cellOf = (row) => row.querySelector(':scope > div') || row;
const t = (el) => (el ? el.textContent.trim() : '');

function buildCard(cell) {
  const kids = [...cell.children];
  const img = cell.querySelector('img');
  const h3 = cell.querySelector('h3');
  const titleA = h3?.querySelector('a') || h3;
  const title = t(titleA);
  const titleHref = titleA?.getAttribute('href') || '#';
  const h3idx = kids.indexOf(h3);

  const beforePs = kids.slice(0, h3idx === -1 ? 0 : h3idx).filter((k) => k.tagName === 'P');
  const date = t(beforePs[0]);
  const cat = t(beforePs[1]);
  const catMore = t(beforePs[2]);

  const afterPs = kids.slice(h3idx + 1).filter((k) => k.tagName === 'P');
  const author = afterPs.find((p) => /^Author:/i.test(p.textContent));
  const teaser = afterPs.find((p) => p !== author && !p.querySelector('a'));
  const readA = [...cell.querySelectorAll('a')].find((a) => /read article/i.test(a.textContent));
  const readHref = readA?.getAttribute('href') || titleHref;

  let body = '';
  if (date) body += `<p class="ds-bcard-date">${date}</p>`;
  if (cat) {
    const more = catMore ? `<span class="ds-chip-more">${catMore}</span>` : '';
    body += `<p class="ds-bcard-cats"><span class="ds-chip">${cat}</span>${more}</p>`;
  }
  body += `<h3 class="ds-bcard-title"><a href="${titleHref}" aria-label="Read article: ${title}">${title}</a></h3>`;
  if (teaser) body += `<p class="ds-bcard-teaser">${t(teaser)}</p>`;
  if (author) body += `<p class="ds-bcard-author">${t(author)}</p>`;

  const article = document.createElement('article');
  article.className = 'ds-bcard';
  article.setAttribute('data-slot', 'result-card');
  article.innerHTML = `
    <div class="ds-bcard-media">${img ? img.outerHTML : ''}</div>
    <div class="ds-bcard-body">${body}</div>
    <div class="ds-bcard-actions">
      <a class="ds-btn ds-btn--outline" href="${readHref}" aria-label="Read article: ${title}">Read article</a>
    </div>`;
  return article;
}

function buildPager(cell) {
  const items = [...cell.querySelectorAll('a, span')];
  if (!items.length) return null;
  const lis = items.map((el) => {
    const text = el.textContent.trim();
    if (el.tagName === 'SPAN') return `<li><span class="ds-page-link" aria-current="page">${text}</span></li>`;
    const isNext = /^next$/i.test(text) || el.getAttribute('rel') === 'next';
    const rel = isNext ? ' rel="next"' : '';
    return `<li><a class="ds-page-link" href="${el.getAttribute('href')}"${rel}>${text}${isNext ? ` ${NEXT_ICON}` : ''}</a></li>`;
  }).join('');
  const nav = document.createElement('nav');
  nav.className = 'ds-pagenav';
  nav.setAttribute('aria-label', 'Article pages');
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
  wrap.innerHTML = '<h2 class="ds-sr-only" id="results-h2">Articles</h2>';

  const grid = document.createElement('div');
  grid.className = 'ds-bgrid';
  grid.setAttribute('data-app', 'content-listing');
  grid.setAttribute('data-slot', 'results');
  cardRows.forEach((row) => grid.append(buildCard(cellOf(row))));
  wrap.append(grid);

  if (pagerRow) {
    const nav = buildPager(cellOf(pagerRow));
    if (nav) wrap.append(nav);
  }

  block.replaceChildren(wrap);

  // Phase-3 dynamic: live content search + type/category facets over /content-index.json
  const { loadIndex, enhanceList } = await import('/scripts/list-search.js');
  const data = await loadIndex('/content-index.json');
  if (!data) return;
  const TYPE = { blog: 'Blog', 'press-release': 'News', 'patient-story': 'Patient Stories', video: 'Video' };
  const cats = [...new Set(data.flatMap((r) => r.categories || []))].filter(Boolean).sort();
  const fmt = (ep) => new Date(ep * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  enhanceList(wrap, grid, {
    data: data.slice().sort((a, b) => (b.date || 0) - (a.date || 0)),
    noun: 'article',
    search: (r, q) => r.title.toLowerCase().includes(q),
    facets: [
      { name: 'type', label: 'All types', values: Object.values(TYPE), match: (r, v) => TYPE[r.type] === v },
      { name: 'cat', label: 'All categories', values: cats, match: (r, v) => (r.categories || []).includes(v) },
    ],
    card: (r) => {
      const el = document.createElement('article');
      el.className = 'ds-bcard';
      el.innerHTML = `${r.image ? `<a href="${r.path}" class="ds-bcard-media"><img src="${r.image}" alt="${r.title}" loading="lazy"></a>` : ''}
        <div class="ds-bcard-body">
          <p class="ds-bcard-meta">${TYPE[r.type] || r.type}${r.date ? ` · ${fmt(r.date)}` : ''}</p>
          <h3 class="ds-bcard-title"><a href="${r.path}">${r.title}</a></h3>
        </div>`;
      return el;
    },
  });
}
