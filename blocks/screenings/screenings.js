/**
 * screenings — 3× screening cards (one mint variant, one with a price display).
 * Tier: RECONSTRUCTIVE (author-editable card group; non-uniform units segmented
 * on the per-card <h3>; a card WITHOUT an image renders the mint variant).
 *
 * Source: stardust/eds-schema/index.json#screenings
 *   section head (heading + intro), lead outline CTA "Take charge…", 3 cards
 *   (CT Heart scan w/ $49 price + img; Colonoscopy + img; Mammograms mint, no img),
 *   2 imgs.
 *
 * Row contract (content/index.html):
 *   head row   → <h2> + <p> intro
 *   lead row   → a link-only row (no <h3>) → centered outline CTA above the grid
 *   card rows  → <h3>, an optional price <p> starting with "$" (rendered as the
 *                .ds-price sub-line inside the <h3>), a <p> body, a <p><em><a> CTA,
 *                and an optional <img> (a card with no img → mint variant)
 */
export default async function decorate(block) {
  const rows = [...block.children];
  let head = null;
  let lead = null;
  const cards = [];
  rows.forEach((row) => {
    const scope = row.querySelector(':scope > div') || row;
    if (scope.querySelector('h2')) head = scope;
    else if (scope.querySelector('h3')) cards.push(scope);
    else if (scope.querySelector('a')) lead = scope;
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

  if (lead) {
    const p = document.createElement('p');
    p.className = 'ds-screen-cta';
    [...lead.childNodes].forEach((n) => {
      if (n.nodeName === 'P') [...n.childNodes].forEach((c) => p.append(c.cloneNode(true)));
      else p.append(n.cloneNode(true));
    });
    wrap.append(p);
  }

  const grid = document.createElement('div');
  grid.className = 'ds-screen-grid';
  cards.forEach((card) => {
    const img = card.querySelector('img');
    const article = document.createElement('article');
    article.className = img ? 'ds-screen-card' : 'ds-screen-card ds-screen-card--mint';
    if (img) article.append(img);
    const body = document.createElement('div');
    body.className = 'ds-screen-body';
    const h3 = card.querySelector('h3');
    if (h3) body.append(h3);
    card.querySelectorAll('p').forEach((p) => {
      const txt = p.textContent.trim();
      if (/^\$/.test(txt) && h3) {
        const price = document.createElement('span');
        price.className = 'ds-price';
        price.textContent = txt;
        h3.append(' ');
        h3.append(price);
      } else if (p.querySelector('a')) {
        [...p.childNodes].forEach((n) => body.append(n.cloneNode(true)));
      } else {
        body.append(p);
      }
    });
    article.append(body);
    grid.append(article);
  });
  wrap.append(grid);
  block.append(wrap);
}
