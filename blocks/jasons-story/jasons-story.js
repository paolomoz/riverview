/**
 * jasons-story — navy patient-story band (topo contours + wave-top), quote + image.
 * Tier: TEMPLATE-SLOTTED (fixed split composition; authored values slotted by role).
 *
 * Source: stardust/eds-schema/index.json#jasons-story
 *   heading, story-quote body, 2 CTAs (light-outline "View full story" + .ds-link
 *   "Read our patient stories"), 1 img.
 *
 * Row contract (content/index.html):
 *   row 0 → <h2> heading
 *   row 1 → <p> quote
 *   row 2 → CTAs (<em><a> light-outline + <a class="ds-link">)
 *   row 3 → story <img> (riverview CDN, absolute URL)
 *
 * Decorative wave-top + topographic contour SVGs are inlined (rendered visible;
 * they carry no content and no JS-toggled reveal).
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.querySelector(':scope > div') || rows[i];

  const h2 = cell(0)?.querySelector('h2');
  const quote = cell(1)?.querySelector('p') || cell(1);
  const ctaNodes = cell(2) ? [...cell(2).childNodes] : [];
  const img = cell(3)?.querySelector('img');

  block.replaceChildren();

  const waveTop = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  waveTop.setAttribute('class', 'ds-wave-top');
  waveTop.setAttribute('viewBox', '0 0 1440 100');
  waveTop.setAttribute('preserveAspectRatio', 'none');
  waveTop.setAttribute('aria-hidden', 'true');
  waveTop.setAttribute('focusable', 'false');
  waveTop.innerHTML = '<path fill="#ffffff" d="M0,44 C190,84 380,20 590,36 C800,52 960,96 1150,70 C1290,52 1385,26 1440,40 L1440,100 L0,100 Z"/>';
  block.append(waveTop);

  const topo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  topo.setAttribute('class', 'ds-topo');
  topo.setAttribute('viewBox', '0 0 1440 600');
  topo.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  topo.setAttribute('aria-hidden', 'true');
  topo.setAttribute('focusable', 'false');
  topo.innerHTML = '<g fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1.5">'
    + '<path d="M-60 90 C 220 30, 460 150, 740 100 S 1230 40, 1500 110"/>'
    + '<path d="M-60 190 C 240 130, 480 250, 760 200 S 1250 140, 1500 210"/>'
    + '<path d="M-60 290 C 200 230, 440 350, 720 300 S 1210 240, 1500 310"/>'
    + '<path d="M-60 390 C 260 330, 500 450, 780 400 S 1270 340, 1500 410"/>'
    + '<path d="M-60 490 C 220 430, 460 550, 740 500 S 1230 440, 1500 510"/>'
    + '</g>';
  block.append(topo);

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const inner = document.createElement('div');
  inner.className = 'ds-story-inner';
  const split = document.createElement('div');
  split.className = 'ds-split';

  const copy = document.createElement('div');
  copy.className = 'ds-story-copy';
  if (h2) { h2.classList.add('ds-h2'); copy.append(h2); }
  if (quote) { quote.classList.add('ds-story-quote'); copy.append(quote); }
  const ctas = document.createElement('div');
  ctas.className = 'ds-story-ctas';
  ctaNodes.forEach((n) => ctas.append(n.cloneNode(true)));
  copy.append(ctas);
  split.append(copy);

  const frame = document.createElement('div');
  frame.className = 'ds-story-frame';
  if (img) frame.append(img);
  split.append(frame);

  inner.append(split);
  wrap.append(inner);
  block.append(wrap);
}
