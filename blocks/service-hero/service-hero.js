/**
 * service-hero — service-hub identity band: breadcrumb + title (with a mint
 * keyword) + captured lede + action row, over the navy hero. The hub archetype
 * carries a captured hero photo (AdobeStock_968773921) behind a left-to-right
 * navy scrim (white h1 AA-verified); the bg photo URL lives in service-hero.css.
 * Tier: TEMPLATE-SLOTTED (bespoke fixed hero composition; authored values slotted
 * by role). Carries the page <h1>.
 *
 * Source: services-cancer-services-proposed.html [data-section="service-hero"] (.ds-hero)
 * Schema: stardust/eds-schema/services-cancer-services.json#service-hero
 *
 * Row contract (content/services/cancer-services.html):
 *   row 0 → breadcrumb: a list of crumbs (<li><a> links; a link-less <li> is the
 *           current page)
 *   row 1 → <h1> title (a nested <span> is the mint keyword; if none, the last
 *           word is treated as the keyword)
 *   row 2 → <p> hero lede
 *   row 3 → CTAs (first <a> → on-navy solid; rest → outline-light)
 *
 * Template conditional (documented): the hero photo band renders on the hub
 * archetype (this page). service-detail + SEO-lander variants use the plain navy
 * topo band only — omit the photo divs / the --photo modifier for those.
 * Signature elements (inlined, decorative, aria-hidden): topo SVG texture + wave mask.
 */

const TOPO_SVG = `<svg class="ds-topo" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1.5"><path d="M-60 90 C 220 30, 460 150, 740 100 S 1230 40, 1500 110"/><path d="M-60 190 C 240 130, 480 250, 760 200 S 1250 140, 1500 210"/><path d="M-60 290 C 200 230, 440 350, 720 300 S 1210 240, 1500 310"/><path d="M-60 390 C 260 330, 500 450, 780 400 S 1270 340, 1500 410"/><path d="M-60 490 C 220 430, 460 550, 740 500 S 1230 440, 1500 510"/></g></svg>`;
const WAVE_SVG = `<svg class="ds-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path fill="#ffffff" d="M0,58 C170,94 350,16 560,32 C780,49 930,98 1130,74 C1275,57 1375,24 1440,38 L1440,100 L0,100 Z"/></svg>`;
const PHOTO_ALT = 'A patient and a loved one embrace in a sunlit room at Riverview Health Cancer Center';

export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.querySelector(':scope > div') || rows[i];

  const crumbCell = cell(0);
  const crumbItems = crumbCell ? [...crumbCell.querySelectorAll('li')] : [];
  const h1 = cell(1)?.querySelector('h1') || cell(1);
  const lede = cell(2)?.querySelector('p') || cell(2);
  const ctaNodes = cell(3) ? [...cell(3).querySelectorAll('a')] : [];
  const heroImg = block.querySelector('img'); // authored per-page hero photo row

  block.replaceChildren();

  if (heroImg) {
    block.classList.add('service-hero--photo');
    const photo = document.createElement('div');
    photo.className = 'ds-hero-photo';
    photo.style.backgroundImage = `url("${heroImg.src}")`;
    if (heroImg.alt) { photo.setAttribute('role', 'img'); photo.setAttribute('aria-label', heroImg.alt); }
    block.append(photo);
    const scrim = document.createElement('div');
    scrim.className = 'ds-hero-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    block.append(scrim);
  }

  // hero photo band is a variant (class "photo") — the cancer-services hub carries
  // it; service-detail / SEO-lander / enriched pages use the plain navy topo band.
  if (block.classList.contains('photo')) {
    block.classList.add('service-hero--photo');
    const photo = document.createElement('div');
    photo.className = 'ds-hero-photo';
    photo.setAttribute('role', 'img');
    photo.setAttribute('aria-label', PHOTO_ALT);
    block.append(photo);
    const scrim = document.createElement('div');
    scrim.className = 'ds-hero-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    block.append(scrim);
  }

  block.insertAdjacentHTML('beforeend', TOPO_SVG);

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const copy = document.createElement('div');
  copy.className = 'ds-hero-copy';

  // breadcrumb
  if (crumbItems.length) {
    const nav = document.createElement('nav');
    nav.className = 'ds-crumbs';
    nav.setAttribute('aria-label', 'Breadcrumb');
    const ol = document.createElement('ol');
    crumbItems.forEach((li) => {
      const item = document.createElement('li');
      const a = li.querySelector('a');
      if (a) {
        item.append(a.cloneNode(true));
      } else {
        const span = document.createElement('span');
        span.setAttribute('aria-current', 'page');
        span.textContent = (li.textContent || '').trim();
        item.append(span);
      }
      ol.append(item);
    });
    nav.append(ol);
    copy.append(nav);
  }

  // title — ensure the mint keyword span carries .ds-hero-kw
  if (h1) {
    let kw = h1.querySelector('span');
    if (!kw) {
      // no authored keyword span: wrap the last word.
      const text = (h1.textContent || '').trim();
      const idx = text.lastIndexOf(' ');
      if (idx > -1) {
        h1.textContent = `${text.slice(0, idx)} `;
        kw = document.createElement('span');
        kw.textContent = text.slice(idx + 1);
        h1.append(kw);
      }
    }
    if (kw) kw.className = 'ds-hero-kw';
    copy.append(h1);
  }

  if (lede && (lede.textContent || '').trim()) {
    lede.className = 'ds-hero-lede';
    copy.append(lede);
  }

  if (ctaNodes.length) {
    const ctas = document.createElement('div');
    ctas.className = 'ds-hero-ctas';
    ctaNodes.forEach((a, i) => {
      const btn = a.cloneNode(true);
      btn.className = i === 0 ? 'ds-btn ds-btn--onnavy' : 'ds-btn ds-btn--outline-light';
      ctas.append(btn);
    });
    copy.append(ctas);
  }

  wrap.append(copy);
  block.append(wrap);
  block.insertAdjacentHTML('beforeend', WAVE_SVG);
}
