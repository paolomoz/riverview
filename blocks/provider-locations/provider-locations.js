/**
 * provider-locations — a provider's practice locations (name, address, phone,
 * directions/details, static map).
 * Tier: RECONSTRUCTIVE. Authors add location-card units; decorate() segments them
 * (on the per-card <h3>) and rebuilds each card. A leading head row (<h2>, no <h3>)
 * carries the section title.
 *
 * Source: provider-kathleen-miller-md-proposed.html [data-section="locations"]
 * Schema: stardust/eds-schema/provider-kathleen-miller-md.json#locations
 *
 * Rows (content/provider/kathleen-miller-md.html):
 *   head row  → <h2> section title ("Locations")
 *   card rows → cell with:
 *     <h3>Location name</h3>
 *     <p>Street<br>City, ST ZIP</p>          address
 *     <p><a href="tel:…">phone</a></p>        office phone (optional)
 *     <p><a href="/location/…">View Details</a></p>   details link (optional)
 *     <img>                                   static map (absolute googleapis URL, optional)
 */

const cellOf = (row) => row.querySelector(':scope > div') || row;

function buildCard(cell) {
  const img = cell.querySelector('img');
  const h3 = cell.querySelector('h3');
  const name = (h3?.textContent || '').trim();
  const addr = [...cell.querySelectorAll('p')].find((p) => !p.querySelector('a'));
  const links = [...cell.querySelectorAll('a')];
  const telA = links.find((a) => (a.getAttribute('href') || '').startsWith('tel:'));
  const detailsA = links.find((a) => a !== telA);

  const info = document.createElement('div');
  if (h3) { h3.className = ''; info.append(h3); }
  if (addr) {
    const address = document.createElement('p');
    address.className = 'ds-loc-address';
    address.innerHTML = addr.innerHTML;
    info.append(address);
  }
  if (telA || detailsA) {
    const actions = document.createElement('div');
    actions.className = 'ds-loc-actions';
    if (telA) {
      const tel = telA.cloneNode(true);
      tel.className = 'ds-loc-phone';
      if (name && !tel.hasAttribute('aria-label')) tel.setAttribute('aria-label', `Call ${name}`);
      actions.append(tel);
    }
    if (detailsA) {
      const det = detailsA.cloneNode(true);
      det.className = 'ds-btn ds-btn--outline';
      actions.append(det);
    }
    info.append(actions);
  }

  const article = document.createElement('article');
  article.className = 'ds-loc-card';
  article.append(info);
  if (img) {
    const map = document.createElement('div');
    map.className = 'ds-loc-map';
    map.append(img);
    article.append(map);
  }
  return article;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const headRow = rows.find((r) => cellOf(r).querySelector('h2') && !cellOf(r).querySelector('h3'));
  const cardRows = rows.filter((r) => cellOf(r).querySelector('h3'));

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

  cardRows.forEach((row) => wrap.append(buildCard(cellOf(row))));
  block.append(wrap);
}
