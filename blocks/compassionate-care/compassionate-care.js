/**
 * compassionate-care — 4× quick-link cards with diamond mint icons.
 * Tier: RECONSTRUCTIVE (author-editable card group; segmented on the per-card <h3>).
 *
 * Source: stardust/eds-schema/index.json#compassionate-care
 *   section head (heading + intro body), 4 cards (each: heading + body + "Learn more"
 *   .ds-link CTA), 1 foot CTA "Explore our practice locations". 0 imgs (SVG icons inlined).
 *
 * Row contract (content/index.html):
 *   head row  → <h2> + <p> intro
 *   card rows → each has an <h3>, a <p> body, a <p><a class="ds-link"> CTA
 *   foot row  → a link-only row (no <h3>) → the standing outline CTA
 *
 * The four diamond icons are decorative; inlined here by card order.
 */
const ICONS = [
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 8v6"/><path d="M9 11h6"/><path d="M10 21v-4h4v4"/></svg>',
];

export default async function decorate(block) {
  const rows = [...block.children];
  let head = null;
  let foot = null;
  const cards = [];
  rows.forEach((row) => {
    const scope = row.querySelector(':scope > div') || row;
    if (scope.querySelector('h2')) head = scope;
    else if (scope.querySelector('h3')) cards.push(scope);
    else if (scope.querySelector('a')) foot = scope;
  });

  block.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';

  if (head) {
    const headEl = document.createElement('div');
    headEl.className = 'ds-section-head';
    const h2 = head.querySelector('h2');
    if (h2) { h2.classList.add('ds-h2'); headEl.append(h2); }
    const intro = head.querySelector('p');
    if (intro) { intro.classList.add('ds-intro'); headEl.append(intro); }
    wrap.append(headEl);
  }

  const grid = document.createElement('div');
  grid.className = 'ds-quick-grid';
  cards.forEach((card, i) => {
    const article = document.createElement('article');
    article.className = 'ds-quick-card';
    const icon = document.createElement('span');
    icon.className = 'ds-quick-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = ICONS[i] || ICONS[0];
    article.append(icon);
    const h3 = card.querySelector('h3');
    if (h3) article.append(h3);
    card.querySelectorAll('p').forEach((p) => {
      const link = p.querySelector('a');
      if (link) article.append(link);
      else article.append(p);
    });
    grid.append(article);
  });
  wrap.append(grid);

  if (foot) {
    const footEl = document.createElement('div');
    footEl.className = 'ds-quick-foot';
    [...foot.childNodes].forEach((n) => footEl.append(n.cloneNode(true)));
    wrap.append(footEl);
  }

  block.append(wrap);
}
