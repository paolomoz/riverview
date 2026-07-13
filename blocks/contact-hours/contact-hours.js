/**
 * contact-hours — location contact + hours card with a functional keyless Google
 * Maps embed (no API key / no billing) and a static-map <noscript> fallback.
 * Tier: RECONSTRUCTIVE. Authors add contact fields defensively; decorate()
 * classifies each row (Contact heading, address, labelled Phone/Fax field, Hours
 * block) and rebuilds the two-up card.
 *
 * Source: location-riverview-health-physicians-obgyn-proposed.html [data-section="contact-hours"]
 * Schema: stardust/eds-schema/location-riverview-health-physicians-obgyn.json#contact-hours
 *
 * Rows (content/location/riverview-health-physicians-obgyn.html):
 *   head row     → cell with <h2> ("Contact")
 *   address row  → single cell with the address <p> (Street<br>City, ST ZIP)
 *   field rows   → two cells: <label> + <value> (value may hold a tel <a>) → Phone / Fax
 *   hours row    → single cell with <h3>Hours</h3> + a <table> (rendered verbatim)
 *   map row      → single cell with the map embed <a> (href = keyless maps.google.com
 *                  …&output=embed URL) → rebuilt as an <iframe>; optional <img> = static
 *                  fallback (rendered inside <noscript>).
 * The map iframe is reproduced EXACTLY as the captured public keyless embed
 * (output=embed, no key/billing); <noscript> falls back to the captured static image.
 */

const cellsOf = (row) => [...row.querySelectorAll(':scope > div')];

export default async function decorate(block) {
  const rows = [...block.children];

  let h2 = null;
  let addressCell = null;
  const fields = [];
  let hoursCell = null;
  let mapEmbed = '';
  let mapStatic = '';

  rows.forEach((row) => {
    const cells = cellsOf(row);
    const first = cells[0] || row;
    const mapLink = first.querySelector('a[href*="output=embed"]');
    const staticImg = first.querySelector('img');
    if (first.querySelector('h2')) {
      h2 = first.querySelector('h2');
    } else if (mapLink) {
      mapEmbed = mapLink.getAttribute('href') || '';
      if (staticImg) mapStatic = staticImg.outerHTML;
    } else if (first.querySelector('table')) {
      hoursCell = first;
    } else if (cells.length >= 2) {
      fields.push({ label: (cells[0].textContent || '').trim(), value: cells[1] });
    } else {
      addressCell = first;
    }
  });

  block.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const card = document.createElement('div');
  card.className = 'ds-contact-card';

  const body = document.createElement('div');
  body.className = 'ds-contact-body';
  if (h2) { h2.classList.add('ds-h2'); body.append(h2); }
  if (addressCell) {
    const address = document.createElement('address');
    address.className = 'ds-contact-address';
    address.innerHTML = (addressCell.querySelector('p, address') || addressCell).innerHTML;
    body.append(address);
  }
  fields.forEach(({ label, value }) => {
    const group = document.createElement('div');
    const lbl = document.createElement('p');
    lbl.className = 'ds-contact-label';
    lbl.textContent = label;
    group.append(lbl);
    const link = value.querySelector('a');
    if (link) {
      const a = link.cloneNode(true);
      a.className = 'ds-loc-phone';
      group.append(a);
    } else {
      const span = document.createElement('p');
      span.textContent = (value.textContent || '').trim();
      group.append(span);
    }
    body.append(group);
  });
  if (hoursCell) {
    const hours = document.createElement('div');
    hours.className = 'ds-hours';
    hours.innerHTML = hoursCell.innerHTML;
    hours.querySelector('h3, h2')?.classList.add('ds-h2');
    body.append(hours);
  }
  card.append(body);

  if (mapEmbed) {
    const map = document.createElement('div');
    map.className = 'ds-loc-map';
    const title = h2 ? `Map of ${document.title || 'this location'}` : 'Map of this location';
    const iframe = document.createElement('iframe');
    iframe.className = 'ds-loc-map-frame';
    iframe.setAttribute('title', title);
    iframe.setAttribute('src', mapEmbed);
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    map.append(iframe);
    if (mapStatic) map.insertAdjacentHTML('beforeend', `<noscript>${mapStatic}</noscript>`);
    card.append(map);
  }

  wrap.append(card);
  block.append(wrap);
}
