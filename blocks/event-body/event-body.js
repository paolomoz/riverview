/**
 * event-body — Location rail (Get directions + Questions) + main (event photo,
 * About, Sessions with per-location schedules).
 * Tier: RECONSTRUCTIVE. Both columns are authored verbatim in the content page
 * (every schedule line, both locations, the fitness@riverview.org email and
 * 317-773-0760 phone are server-rendered); decorate() classifies the authored
 * elements and lays them into the two-column grid. The rail is DOM-first so it
 * stacks above the schedule on mobile; the grid places it right on desktop.
 * Register (hero) + the per-event registration widget bind at migrate/EDS.
 *
 * Source: stardust/prototypes/event-aquatic-aerobics-proposed.html (section.ds-body)
 * Schema: stardust/eds-schema/event-aquatic-aerobics.json#event-body
 *
 * Authored row contract:
 *   0  Location rail — <h2>Location</h2>, venue <p>, <address>, a "Get directions"
 *      link, a "Questions?" <p>, and a contact <p> (mailto + tel).
 *   1  main — <img> photo, <h2>About this event</h2>, lede <p>, <p>Sessions</p>,
 *      then per-location <h3> + "Effective…" <p> + <ul> schedule (verbatim).
 */

export default async function decorate(block) {
  const rows = [...block.children];
  const cellOf = (row) => (row ? row.querySelector(':scope > div') || row : null);
  const railCell = cellOf(rows[0]);
  const mainCell = cellOf(rows[1]);

  // ---- Location rail ----
  const rail = document.createElement('aside');
  rail.className = 'ds-rail';
  rail.setAttribute('data-slot', 'location');
  if (railCell) {
    const contactP = railCell.querySelector('p a[href^="mailto:"]')?.closest('p');
    const dirLink = [...railCell.querySelectorAll('a')].find((a) => /maps|directions/i.test(a.getAttribute('href') || '') || /get directions/i.test(a.textContent));
    let venueDone = false;
    [...railCell.children].forEach((el) => {
      if (el.tagName === 'H2' || el.tagName === 'H3') { const h = document.createElement('h2'); h.innerHTML = el.innerHTML; rail.append(h); return; }
      if (el.tagName === 'ADDRESS') { el.classList.add('ds-rail-address'); rail.append(el); return; }
      if (el.contains(dirLink) || el === dirLink) { dirLink.classList.add('ds-link'); rail.append(dirLink); return; }
      if (el === contactP) return; // handled with the Questions block below
      if (el.tagName === 'P' && !venueDone) { el.classList.add('ds-venue'); rail.append(el); venueDone = true; return; }
      if (el.tagName === 'P') { el.classList.add('ds-rail-label'); const info = document.createElement('div'); info.className = 'ds-rail-info'; info.append(el); if (contactP) { contactP.classList.add('ds-rail-contact'); info.append(contactP); } rail.append(info); }
    });
  }

  // ---- main: figure + prose ----
  const main = document.createElement('div');
  main.className = 'ds-main';
  const img = mainCell?.querySelector('img');
  if (img) {
    img.setAttribute('loading', 'lazy');
    const fig = document.createElement('figure');
    fig.className = 'ds-event-figure';
    fig.append(img);
    main.append(fig);
    (img.closest('p'))?.remove();
  }
  const prose = document.createElement('div');
  prose.className = 'ds-prose';
  [...(mainCell?.children || [])].forEach((el) => {
    if (el.querySelector && el.querySelector('img')) return; // figure paragraph, already lifted
    if (el.tagName === 'UL') { el.classList.add('ds-times'); prose.append(el); return; }
    if (el.tagName === 'P') {
      const t = el.textContent.trim();
      if (/^sessions$/i.test(t)) el.classList.add('ds-sessions-label');
      else if (/^effective\b/i.test(t)) el.classList.add('ds-eff-note');
      else el.classList.add('ds-lede');
    }
    prose.append(el);
  });
  main.append(prose);

  const grid = document.createElement('div');
  grid.className = 'ds-body-grid';
  grid.append(rail, main);

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  wrap.append(grid);

  block.replaceChildren(wrap);
}
