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
  // DA strips <address>, so detect the rail info by structure: the first <p> in the
  // info cell is the label, any following <p>/<address> content is the address body.
  const infoPs = infoCell ? [...infoCell.children].filter((el) => /^(P|ADDRESS)$/.test(el.tagName)) : [];
  const infoLabel = (infoPs[0]?.textContent || 'More Information').trim();
  const addressParts = infoCell?.querySelector('address') ? [infoCell.querySelector('address')] : infoPs.slice(1);

  // no rail content (no child-nav links AND no address) → single-column prose,
  // not the two-column grid with an empty grey rail box.
  const hasBoxRows = rows.slice(3).some((r) => (r.textContent || '').trim());
  const hasRail = !!(navList || addressParts.length || hasBoxRows);

  block.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const grid = document.createElement('div');
  grid.className = hasRail ? 'ds-body-grid' : 'ds-body-grid ds-body-grid--single';

  if (hasRail) {
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
    pill.append(navLabel || infoLabel);
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

    if (navList) {
      const label1 = document.createElement('p');
      label1.className = 'ds-rail-label';
      label1.textContent = navLabel;
      railBody.append(label1);
      const nav = document.createElement('nav');
      nav.className = 'ds-rail-nav';
      nav.setAttribute('aria-label', `${navLabel} sections`);
      const navClone = navList.cloneNode(true);
      // DA strips aria-* from content: mark the current page at decorate time
      navClone.querySelectorAll('a').forEach((a) => {
        try { if (new URL(a.href).pathname.replace(/\/$/, '') === window.location.pathname.replace(/\/$/, '')) a.setAttribute('aria-current', 'page'); } catch { /* noop */ }
      });
      nav.append(navClone);
      railBody.append(nav);
    }

    if (addressParts.length) {
      const info = document.createElement('div');
      info.className = 'ds-rail-info';
      const label2 = document.createElement('p');
      label2.className = 'ds-rail-label';
      label2.textContent = infoLabel;
      info.append(label2);
      const addr = document.createElement('address');
      addr.className = 'ds-rail-address';
      addr.innerHTML = addressParts.map((el) => el.innerHTML).join('<br>');
      info.append(addr);
      railBody.append(info);
    }

    // rows 3+ → extra rail boxes (mint): a label <p> + a <ul> of links
    rows.slice(3).forEach((r) => {
      const c = r.querySelector(':scope > div') || r;
      const label = (c.querySelector('p')?.textContent || '').trim();
      const ulEl = c.querySelector('ul');
      if (!label) return;
      const box = document.createElement('div');
      box.className = 'ds-rail-box';
      const lp = document.createElement('p');
      lp.className = 'ds-rail-label';
      lp.textContent = label;
      box.append(lp);
      const boxImg = c.querySelector('picture,img');
      if (boxImg) box.append(boxImg.closest('picture') || boxImg);
      // non-label paragraphs (e.g. "Already have an account.") between label and list
      [...c.querySelectorAll('p')].slice(1).forEach((pp) => { if (!pp.querySelector('img')) box.append(pp.cloneNode(true)); });
      if (ulEl) box.append(ulEl.cloneNode(true));
      railBody.append(box);
    });

    details.append(railBody);
    aside.append(details);
    grid.append(aside);
  }

  // ── main: prose column ──
  const main = document.createElement('div');
  main.className = 'ds-main';
  const prose = document.createElement('div');
  prose.className = 'ds-prose';

  const proseNodes = proseCell ? [...proseCell.children] : [];
  proseNodes.forEach((node) => {
    const el = node.cloneNode(true);
    // titled media pair (DA strips figure/figcaption): a <p> whose only content is
    // an img/picture becomes a ds-tour; a preceding strong-only <p> is its caption.
    if (el.tagName === 'P' && el.querySelector('picture,img') && !(el.textContent || '').trim()) {
      const prev = prose.lastElementChild;
      let capText = '';
      if (prev && prev.tagName === 'P' && prev.children.length === 1 && prev.firstElementChild.tagName === 'STRONG'
        && (prev.textContent || '').trim() === (prev.firstElementChild.textContent || '').trim()) {
        capText = prev.textContent.trim(); prev.remove();
      }
      const tour = document.createElement('div');
      tour.className = 'ds-tour';
      const figure = document.createElement('figure');
      const media = document.createElement('div');
      media.className = 'ds-tour-media';
      media.append(el.querySelector('picture') || el.querySelector('img'));
      figure.append(media);
      if (capText) { const cap = document.createElement('figcaption'); cap.textContent = capText; figure.append(cap); }
      tour.append(figure);
      prose.append(tour);
      return;
    }
    if (el.tagName === 'UL') {
      // short parallel labels → 2-column condition list; sentence-fragment bullet
      // lists (criteria, steps) → single-column prose list (readable long items)
      const lis = [...el.querySelectorAll('li')];
      const allShort = lis.length > 0 && lis.every((li) => (li.textContent || '').trim().split(/\s+/).length <= 6);
      el.className = allShort ? 'ds-cond-list' : 'ds-prose-list';
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
