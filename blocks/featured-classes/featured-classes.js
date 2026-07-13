/**
 * featured-classes — 3× class cards on a mint-wash band.
 * Tier: RECONSTRUCTIVE (author-editable card group; segmented on the per-card <h3>).
 *
 * Source: stardust/eds-schema/index.json#featured-classes
 *   section head (heading only), 3 cards (each: img + heading + body + "Register for
 *   Class" outline CTA), 3 imgs.
 *
 * Row contract (content/index.html):
 *   head row  → <h2>
 *   card rows → each has an <img>, an <h3>, a <p> body, a <p><em><a> outline CTA
 */
export default async function decorate(block) {
  const rows = [...block.children];
  let head = null;
  const cards = [];
  rows.forEach((row) => {
    const scope = row.querySelector(':scope > div') || row;
    if (scope.querySelector('h2')) head = scope;
    else if (scope.querySelector('h3')) cards.push(scope);
  });

  block.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';

  if (head) {
    const headEl = document.createElement('div');
    headEl.className = 'ds-section-head';
    const h2 = head.querySelector('h2');
    if (h2) { h2.classList.add('ds-h2'); headEl.append(h2); }
    wrap.append(headEl);
  }

  const grid = document.createElement('div');
  grid.className = 'ds-class-grid';
  cards.forEach((card) => {
    const article = document.createElement('article');
    article.className = 'ds-class-card';
    const img = card.querySelector('img');
    if (img) article.append(img);
    const body = document.createElement('div');
    body.className = 'ds-class-body';
    const h3 = card.querySelector('h3');
    if (h3) body.append(h3);
    card.querySelectorAll('p').forEach((p) => {
      if (p.querySelector('a')) {
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
