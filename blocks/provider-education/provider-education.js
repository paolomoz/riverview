/**
 * provider-education — education & board-certification groups.
 * Tier: RECONSTRUCTIVE. Authors add group units; decorate() segments them (on the
 * per-group <h3>) and rebuilds each as a ds-edu-group card. A leading head row
 * (<h2>, no <h3>) carries the section title.
 *
 * Source: provider-kathleen-miller-md-proposed.html [data-section="education-certifications"]
 * Schema: stardust/eds-schema/provider-kathleen-miller-md.json#education-certifications
 *
 * Rows (content/provider/kathleen-miller-md.html):
 *   head row  → <h2> section title ("Education & Certifications")
 *   group rows → cell with:
 *     <h3>Group name</h3>                              e.g. "Education" / "Board Certifications"
 *     <p><strong>Label</strong>Value</p>              → dt/dd pair (label:value)
 *     <p>Plain item</p>                                → ds-cert-list <li>
 *   A group of <strong>-labelled pairs renders a definition list (ds-edu-list);
 *   a group of plain items renders a bullet-free cert list (ds-cert-list).
 */

const cellOf = (row) => row.querySelector(':scope > div') || row;

function buildGroup(cell) {
  const h3 = cell.querySelector('h3');
  const paras = [...cell.querySelectorAll('p')];
  const pairs = paras.filter((p) => p.querySelector('strong'));
  const plain = paras.filter((p) => !p.querySelector('strong'));

  const group = document.createElement('div');
  group.className = 'ds-edu-group';
  if (h3) { h3.className = ''; group.append(h3); }

  if (pairs.length) {
    const dl = document.createElement('dl');
    dl.className = 'ds-edu-list';
    pairs.forEach((p) => {
      const strong = p.querySelector('strong');
      const label = (strong.textContent || '').trim();
      const value = (p.textContent || '').replace(label, '').trim();
      const div = document.createElement('div');
      div.innerHTML = `<dt>${label}</dt><dd>${value}</dd>`;
      dl.append(div);
    });
    group.append(dl);
  }
  if (plain.length) {
    const ul = document.createElement('ul');
    ul.className = 'ds-cert-list';
    plain.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = (p.textContent || '').trim();
      ul.append(li);
    });
    group.append(ul);
  }
  return group;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const headRow = rows.find((r) => cellOf(r).querySelector('h2') && !cellOf(r).querySelector('h3'));
  const groupRows = rows.filter((r) => cellOf(r).querySelector('h3'));

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

  const grid = document.createElement('div');
  grid.className = 'ds-edu-grid';
  groupRows.forEach((row) => grid.append(buildGroup(cellOf(row))));
  wrap.append(grid);

  block.append(wrap);
}
