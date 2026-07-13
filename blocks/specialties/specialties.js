/**
 * specialties — a location's specialties/services as non-interactive label chips
 * (approved label grammar — NOT pills/buttons).
 * Tier: RECONSTRUCTIVE. Authors add one term per list item; decorate() rebuilds
 * the chip list. A leading head row (<h2>, no list item) carries the section title.
 *
 * Source: location-riverview-health-physicians-obgyn-proposed.html [data-section="specialties"]
 * Schema: stardust/eds-schema/location-riverview-health-physicians-obgyn.json#specialties
 *
 * Rows (content/location/riverview-health-physicians-obgyn.html):
 *   head row → <h2> section title ("Specialties")
 *   term row → cell with a <ul>/<ol> of terms, or one <p>/<li> per term
 */

const cellOf = (row) => row.querySelector(':scope > div') || row;

export default async function decorate(block) {
  const rows = [...block.children];
  const headRow = rows.find((r) => cellOf(r).querySelector('h2'));

  const terms = [];
  rows.forEach((row) => {
    if (row === headRow) return;
    const cell = cellOf(row);
    const items = [...cell.querySelectorAll('li')];
    if (items.length) {
      items.forEach((li) => { const t = (li.textContent || '').trim(); if (t) terms.push(t); });
    } else {
      [...cell.querySelectorAll('p')].forEach((p) => { const t = (p.textContent || '').trim(); if (t) terms.push(t); });
    }
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

  const list = document.createElement('ul');
  list.className = 'ds-spec-list';
  terms.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    list.append(li);
  });
  wrap.append(list);

  block.append(wrap);
}
