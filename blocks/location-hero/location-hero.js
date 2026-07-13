/**
 * location-hero — location identity band: back link + name + address +
 * affiliation + call/directions CTAs, over the navy topo/wave hero.
 * Tier: TEMPLATE-SLOTTED (bespoke fixed hero composition; authored values slotted
 * by role). Carries the page <h1>.
 *
 * Source: location-riverview-health-physicians-obgyn-proposed.html [data-section="location-hero"] (.ds-lhero)
 * Schema: stardust/eds-schema/location-riverview-health-physicians-obgyn.json#location-hero
 *
 * Row contract (content/location/riverview-health-physicians-obgyn.html):
 *   row 0 → back link <a> ("View all locations")
 *   row 1 → <h1> location name
 *   row 2 → address <p>/<address>
 *   row 3 → <p> affiliation line (optional; e.g. "A Riverview Health facility")
 *   row 4 → CTAs (each <a> → outline-light: call, get directions)
 * Signature elements (inlined, decorative, aria-hidden): topo SVG texture + wave mask.
 */

const TOPO_SVG = `<svg class="ds-topo" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1.5"><path d="M-60 90 C 220 30, 460 150, 740 100 S 1230 40, 1500 110"/><path d="M-60 190 C 240 130, 480 250, 760 200 S 1250 140, 1500 210"/><path d="M-60 290 C 200 230, 440 350, 720 300 S 1210 240, 1500 310"/><path d="M-60 390 C 260 330, 500 450, 780 400 S 1270 340, 1500 410"/><path d="M-60 490 C 220 430, 460 550, 740 500 S 1230 440, 1500 510"/></g></svg>`;
const WAVE_SVG = `<svg class="ds-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path fill="#ffffff" d="M0,58 C170,94 350,16 560,32 C780,49 930,98 1130,74 C1275,57 1375,24 1440,38 L1440,100 L0,100 Z"/></svg>`;
const BACK_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>`;

export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.querySelector(':scope > div') || rows[i];

  const backA = cell(0)?.querySelector('a');
  const h1 = cell(1)?.querySelector('h1') || cell(1);
  const addrCell = cell(2);
  const affil = cell(3)?.querySelector('p') || cell(3);
  const ctaNodes = cell(4) ? [...cell(4).querySelectorAll('a')] : [];

  block.replaceChildren();
  block.insertAdjacentHTML('beforeend', TOPO_SVG);

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const copy = document.createElement('div');
  copy.className = 'ds-lhero-copy';

  if (backA) {
    const back = backA.cloneNode(true);
    back.className = 'ds-back';
    back.insertAdjacentHTML('afterbegin', BACK_ICON);
    copy.append(back);
  }
  if (h1) copy.append(h1);
  if (addrCell) {
    const address = document.createElement('address');
    address.className = 'ds-lhero-address';
    address.innerHTML = (addrCell.querySelector('p, address') || addrCell).innerHTML;
    copy.append(address);
  }
  if (affil && (affil.textContent || '').trim()) {
    affil.className = 'ds-affil';
    copy.append(affil);
  }
  if (ctaNodes.length) {
    const ctas = document.createElement('div');
    ctas.className = 'ds-lhero-ctas';
    ctaNodes.forEach((a) => {
      const btn = a.cloneNode(true);
      btn.className = 'ds-btn ds-btn--outline-light';
      ctas.append(btn);
    });
    copy.append(ctas);
  }

  wrap.append(copy);
  block.append(wrap);
  block.insertAdjacentHTML('beforeend', WAVE_SVG);
}
