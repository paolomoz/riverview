/**
 * press-releases — 3× press cards (image, date, title, .ds-link) + a foot CTA.
 * Tier: RECONSTRUCTIVE (author-editable card group; segmented on the per-card <h3>).
 *
 * Source: stardust/eds-schema/index.json#press-releases
 *   section head (heading), 3 cards (each: date body + heading title + .ds-link CTA
 *   + img), foot CTA "View all press releases", 3 imgs.
 *
 * Row contract (content/index.html):
 *   head row  → <h2>
 *   card rows → <img>, a date <p> (wrap a <time> to keep the machine date), an <h3>
 *               title, a <p><a class="ds-link"> CTA
 *   foot row  → a link-only row (no <h3>) → the standing outline CTA
 */
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
    wrap.append(headEl);
  }

  const list = document.createElement('div');
  list.className = 'ds-press-list';
  cards.forEach((card) => {
    const article = document.createElement('article');
    article.className = 'ds-press-card';
    const img = card.querySelector('img');
    if (img) article.append(img);
    const col = document.createElement('div');
    const date = card.querySelector('p');
    if (date) { date.classList.add('ds-press-date'); col.append(date); }
    const h3 = card.querySelector('h3');
    if (h3) col.append(h3);
    const link = card.querySelector('a.ds-link') || card.querySelector('a');
    if (link) col.append(link);
    article.append(col);
    list.append(article);
  });
  wrap.append(list);

  if (foot) {
    const footEl = document.createElement('div');
    footEl.className = 'ds-press-foot';
    [...foot.childNodes].forEach((n) => footEl.append(n.cloneNode(true)));
    wrap.append(footEl);
  }

  block.append(wrap);
}
