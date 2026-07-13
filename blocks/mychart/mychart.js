/**
 * mychart — MyChart split feature with a mint-plinth image.
 * Tier: TEMPLATE-SLOTTED (fixed split composition; authored values slotted by role).
 *
 * Source: stardust/eds-schema/index.json#mychart
 *   heading, intro body, second body, 2 CTAs (navy primary + outline), 1 img.
 *
 * Row contract (content/index.html):
 *   row 0 → plinth <img> (riverview CDN, absolute URL)
 *   row 1 → <h2> heading
 *   row 2 → <p> intro (lede)
 *   row 3 → <p> supporting copy
 *   row 4 → CTAs (<strong><a> primary + <em><a> outline)
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.querySelector(':scope > div') || rows[i];

  const img = cell(0)?.querySelector('img');
  const h2 = cell(1)?.querySelector('h2');
  const intro = cell(2)?.querySelector('p') || cell(2);
  const second = cell(3)?.querySelector('p') || cell(3);
  const ctaNodes = cell(4) ? [...cell(4).childNodes] : [];

  block.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const split = document.createElement('div');
  split.className = 'ds-split';

  const frame = document.createElement('div');
  frame.className = 'ds-plinth-frame';
  if (img) frame.append(img);
  split.append(frame);

  const copy = document.createElement('div');
  copy.className = 'ds-split-copy';
  if (h2) { h2.classList.add('ds-h2'); copy.append(h2); }
  if (intro) { intro.classList.add('ds-intro'); copy.append(intro); }
  if (second) copy.append(second);
  const ctas = document.createElement('div');
  ctas.className = 'ds-split-ctas';
  ctaNodes.forEach((n) => ctas.append(n.cloneNode(true)));
  copy.append(ctas);
  split.append(copy);

  wrap.append(split);
  block.append(wrap);
}
