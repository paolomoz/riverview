/**
 * provider-hero — provider identity band: portrait + name + specialty + status
 * chip + primary phone/schedule CTAs, over the navy topo/wave hero.
 * Tier: TEMPLATE-SLOTTED (bespoke fixed hero composition; authored values slotted
 * by role). Carries the page <h1>.
 *
 * Source: provider-kathleen-miller-md-proposed.html [data-section="provider-hero"] (.ds-phero)
 * Schema: stardust/eds-schema/provider-kathleen-miller-md.json#provider-hero
 *
 * Row contract (content/provider/kathleen-miller-md.html):
 *   row 0 → portrait <img> (riverview CDN, absolute URL; omit → collapses to no-photo)
 *   row 1 → <h1> provider name
 *   row 2 → <p> specialty
 *   row 3 → <p> status chip (e.g. "Not currently accepting new patients"; optional)
 *   row 4 → CTAs: first <a> → mint (primary), second <a> → outline-light
 * Signature elements (inlined, decorative, aria-hidden): topo SVG texture + wave mask.
 */

const TOPO_SVG = `<svg class="ds-topo" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1.5"><path d="M-60 90 C 220 30, 460 150, 740 100 S 1230 40, 1500 110"/><path d="M-60 190 C 240 130, 480 250, 760 200 S 1250 140, 1500 210"/><path d="M-60 290 C 200 230, 440 350, 720 300 S 1210 240, 1500 310"/><path d="M-60 390 C 260 330, 500 450, 780 400 S 1270 340, 1500 410"/><path d="M-60 490 C 220 430, 460 550, 740 500 S 1230 440, 1500 510"/></g></svg>`;
const WAVE_SVG = `<svg class="ds-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path fill="#ffffff" d="M0,58 C170,94 350,16 560,32 C780,49 930,98 1130,74 C1275,57 1375,24 1440,38 L1440,100 L0,100 Z"/></svg>`;

export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.querySelector(':scope > div') || rows[i];

  const img = cell(0)?.querySelector('img');
  const h1 = cell(1)?.querySelector('h1') || cell(1);
  const specialty = cell(2)?.querySelector('p') || cell(2);
  const status = cell(3)?.querySelector('p') || cell(3);
  const ctaNodes = cell(4) ? [...cell(4).querySelectorAll('a')] : [];
  const name = (h1?.textContent || '').trim();

  block.replaceChildren();
  block.insertAdjacentHTML('beforeend', TOPO_SVG);

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const grid = document.createElement('div');
  grid.className = 'ds-phero-grid';

  const copy = document.createElement('div');
  copy.className = 'ds-phero-copy';
  if (h1) copy.append(h1);
  if (specialty && (specialty.textContent || '').trim()) {
    specialty.className = 'ds-specialty';
    copy.append(specialty);
  }
  if (status && (status.textContent || '').trim()) {
    status.className = 'ds-status-chip';
    copy.append(status);
  }
  if (ctaNodes.length) {
    const ctas = document.createElement('div');
    ctas.className = 'ds-phero-ctas';
    ctaNodes.forEach((a, i) => {
      const btn = a.cloneNode(true);
      btn.className = i === 0 ? 'ds-btn ds-btn--mint' : 'ds-btn ds-btn--outline-light';
      if ((btn.getAttribute('href') || '').startsWith('tel:') && name && !btn.hasAttribute('aria-label')) {
        btn.setAttribute('aria-label', `Call ${name}’s office`);
      }
      ctas.append(btn);
    });
    copy.append(ctas);
  }
  grid.append(copy);

  if (img) {
    const figure = document.createElement('figure');
    figure.className = 'ds-phero-portrait';
    const frame = document.createElement('div');
    frame.className = 'ds-plinth-frame';
    frame.append(img);
    figure.append(frame);
    grid.append(figure);
  } else {
    block.classList.add('ds-phero--no-photo');
  }

  wrap.append(grid);
  block.append(wrap);
  block.insertAdjacentHTML('beforeend', WAVE_SVG);
}
