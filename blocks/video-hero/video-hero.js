/**
 * video-hero — video-detail article hero (navy wave band + topo).
 * Tier: TEMPLATE-SLOTTED. Holds the fixed composition (topo + wave SVGs,
 * breadcrumb + h1 layout) and slots the authored breadcrumb trail and page <h1>.
 * This breadcrumb renders explicit "/" separators (per the prototype's
 * .ds-breadcrumb), unlike the CSS-separator .ds-crumbs used on contact/event.
 *
 * Source: stardust/prototypes/video-courtney-cox-cole-infusion-center-proposed.html (section.ds-ahero)
 * Schema: stardust/eds-schema/video-courtney-cox-cole-infusion-center.json#video-hero
 *
 * Authored row contract:
 *   0        <h1>…</h1>                         (the single page H1)
 *   1..n     breadcrumb crumb — cell0 = label, cell1 = href. A crumb with an
 *            empty href is the current page (rendered as aria-current span).
 */

const TOPO = `<svg class="ds-topo" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1.5"><path d="M-60 90 C 220 30, 460 150, 740 100 S 1230 40, 1500 110"/><path d="M-60 190 C 240 130, 480 250, 760 200 S 1250 140, 1500 210"/><path d="M-60 290 C 200 230, 440 350, 720 300 S 1210 240, 1500 310"/><path d="M-60 390 C 260 330, 500 450, 780 400 S 1270 340, 1500 410"/><path d="M-60 490 C 220 430, 460 550, 740 500 S 1230 440, 1500 510"/></g></svg>`;
const WAVE = `<svg class="ds-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path fill="#ffffff" d="M0,58 C170,94 350,16 560,32 C780,49 930,98 1130,74 C1275,57 1375,24 1440,38 L1440,100 L0,100 Z"/></svg>`;

export default async function decorate(block) {
  const rows = [...block.children];
  const cells = (row) => [...row.querySelectorAll(':scope > div')];

  const h1Text = (rows[0]?.querySelector('h1, h2, h3')?.textContent
    || rows[0]?.textContent || '').trim();

  const crumbs = rows.slice(1).map((row) => {
    const c = cells(row);
    const label = (c[0]?.textContent || row.textContent || '').trim();
    const href = (c[1]?.textContent || c[0]?.querySelector('a')?.getAttribute('href') || '').trim();
    return { label, href };
  }).filter((c) => c.label);

  const crumbLis = crumbs.map((c, i) => {
    const sep = i > 0 ? '<span class="ds-breadcrumb-sep" aria-hidden="true">/</span> ' : '';
    const inner = c.href
      ? `<a href="${c.href}">${c.label}</a>`
      : `<span aria-current="page">${c.label}</span>`;
    return `<li>${sep}${inner}</li>`;
  }).join('');

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  wrap.innerHTML = `
    <div class="ds-ahero-inner">
      <nav class="ds-breadcrumb" aria-label="Breadcrumb"><ol>${crumbLis}</ol></nav>
      <h1>${h1Text}</h1>
    </div>`;

  block.innerHTML = TOPO;
  block.append(wrap);
  block.insertAdjacentHTML('beforeend', WAVE);
}
