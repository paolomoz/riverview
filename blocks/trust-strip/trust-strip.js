/**
 * trust-strip — "Accredited by" monochrome accreditor logo strip.
 * Tier: RECONSTRUCTIVE (author-editable logo list; one <li> per authored <img>).
 *
 * Source: stardust/eds-schema/index.json#trust-strip
 *   sr-only heading, "Accredited by" label body, 8 accreditor logos (local /media
 *   assets uploaded at deploy).
 *
 * Row contract (content/index.html):
 *   row 0 → <h2> screen-reader heading
 *   row 1 → <p> "Accredited by" label
 *   row 2+ → accreditor <img> tags (any arrangement; all collected in order)
 */
export default async function decorate(block) {
  const rows = [...block.children];
  let heading = null;
  let label = null;
  const logos = [];
  rows.forEach((row) => {
    const scope = row.querySelector(':scope > div') || row;
    const h2 = scope.querySelector('h2');
    const imgs = [...scope.querySelectorAll('img')];
    if (h2) heading = h2;
    if (imgs.length) logos.push(...imgs);
    else if (scope.querySelector('p') && !h2) label = scope.querySelector('p');
  });

  block.replaceChildren();

  if (heading) { heading.classList.add('ds-sr-only'); block.append(heading); }

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  if (label) { label.classList.add('ds-trust-label'); wrap.append(label); }
  const ul = document.createElement('ul');
  ul.className = 'ds-trust-logos';
  logos.forEach((img) => {
    const li = document.createElement('li');
    li.append(img);
    ul.append(li);
  });
  wrap.append(ul);
  block.append(wrap);
}
