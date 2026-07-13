/**
 * service-body — two-column service-hub body: main prose (Overview, a "Virtual
 * Tour" media region, and a "Conditions We Treat" list) beside a grey sticky rail
 * ("More Information": the service-line child nav + the location address). The
 * rail is sticky on desktop and collapses to a disclosure at ≤900px.
 * Tier: RECONSTRUCTIVE (the rail child-nav is a repeat group rebuilt into the
 * disclosure shell) + TEMPLATE-SLOTTED (the prose column is slotted verbatim).
 *
 * Source: services-cancer-services-proposed.html [data-section="service-body"] (.ds-body)
 * Schema: stardust/eds-schema/services-cancer-services.json#service-body
 *
 * Row contract (content/services/cancer-services.html):
 *   row 0 → rail nav: a <p> section label + a <ul> of <li><a> child-service links
 *           (a link with aria-current="page" marks the active page)
 *   row 1 → rail info: a <p> label ("More Information") + an <address> block
 *   row 2 → main prose: <h2>/<p> sections in order, one <figure> (the Virtual Tour
 *           poster — the video embed is a documented migrate conditional), and a
 *           <ul> conditions list
 *
 * The rail's disclosure summary label and the sr-only "In this section" heading
 * are reproduced as captured chrome. The Virtual Tour renders the captured poster
 * ONLY — no synthesized player.
 */

const CHEVRON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.querySelector(':scope > div') || rows[i];

  const navCell = cell(0);
  const infoCell = cell(1);
  const proseCell = cell(2);

  const navLabel = (navCell?.querySelector('p')?.textContent || '').trim();
  const navList = navCell?.querySelector('ul');
  const infoLabel = (infoCell?.querySelector('p')?.textContent || 'More Information').trim();
  const address = infoCell?.querySelector('address');

  block.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const grid = document.createElement('div');
  grid.className = 'ds-body-grid';

  // ── rail: sticky "More Information" disclosure ──
  const aside = document.createElement('aside');
  aside.className = 'ds-rail';
  aside.setAttribute('aria-labelledby', 'rail-h');
  const details = document.createElement('details');
  details.className = 'ds-rail-disc';
  details.open = true;

  const summary = document.createElement('summary');
  const pill = document.createElement('span');
  pill.className = 'ds-disc-pill';
  pill.append(navLabel);
  pill.insertAdjacentHTML('beforeend', CHEVRON);
  summary.append(pill);
  details.append(summary);

  const railBody = document.createElement('div');
  railBody.className = 'ds-rail-body';
  const srH = document.createElement('h2');
  srH.id = 'rail-h';
  srH.className = 'ds-sr-only';
  srH.textContent = 'In this section';
  railBody.append(srH);

  const label1 = document.createElement('p');
  label1.className = 'ds-rail-label';
  label1.textContent = navLabel;
  railBody.append(label1);

  if (navList) {
    const nav = document.createElement('nav');
    nav.className = 'ds-rail-nav';
    nav.setAttribute('aria-label', `${navLabel} sections`);
    nav.append(navList.cloneNode(true));
    railBody.append(nav);
  }

  if (address) {
    const info = document.createElement('div');
    info.className = 'ds-rail-info';
    const label2 = document.createElement('p');
    label2.className = 'ds-rail-label';
    label2.textContent = infoLabel;
    info.append(label2);
    const addr = address.cloneNode(true);
    addr.className = 'ds-rail-address';
    info.append(addr);
    railBody.append(info);
  }

  details.append(railBody);
  aside.append(details);
  grid.append(aside);

  // ── main: prose column ──
  const main = document.createElement('div');
  main.className = 'ds-main';
  const prose = document.createElement('div');
  prose.className = 'ds-prose';

  const proseNodes = proseCell ? [...proseCell.children] : [];
  proseNodes.forEach((node) => {
    const el = node.cloneNode(true);
    if (el.tagName === 'UL') {
      // the conditions list
      el.className = 'ds-cond-list';
      prose.append(el);
    } else if (el.tagName === 'FIGURE') {
      // Virtual Tour: captured poster only (video embed = migrate conditional).
      const tour = document.createElement('div');
      tour.className = 'ds-tour';
      const figure = document.createElement('figure');
      const media = document.createElement('div');
      media.className = 'ds-tour-media';
      const img = el.querySelector('img');
      if (img) media.append(img.cloneNode(true));
      figure.append(media);
      const cap = el.querySelector('figcaption');
      if (cap) figure.append(cap.cloneNode(true));
      tour.append(figure);
      prose.append(tour);
    } else {
      prose.append(el);
    }
  });

  main.append(prose);
  grid.append(main);

  wrap.append(grid);
  block.append(wrap);
}
