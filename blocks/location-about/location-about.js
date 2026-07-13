/**
 * location-about — About prose band for a location.
 * Tier: TEMPLATE-SLOTTED (fixed prose composition; heading + body slotted by role).
 * The captured page carries no visible About heading, so the authored <h2> is
 * rendered screen-reader-only (ds-sr-only) to keep the heading outline intact.
 *
 * Source: location-riverview-health-physicians-obgyn-proposed.html [data-section="about"]
 * Schema: stardust/eds-schema/location-riverview-health-physicians-obgyn.json#about
 *
 * Row contract (content/location/riverview-health-physicians-obgyn.html):
 *   row 0 → <h2> heading (e.g. "About this location")
 *   row 1 → About prose (one or more <p>, reproduced verbatim)
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.querySelector(':scope > div') || rows[i];

  const h2 = cell(0)?.querySelector('h2') || cell(0);
  const bodyCell = cell(1);
  const paras = bodyCell ? [...bodyCell.querySelectorAll('p')] : [];

  block.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';

  if (h2) { h2.className = 'ds-sr-only'; wrap.append(h2); }

  const body = document.createElement('div');
  body.className = 'ds-about-body';
  (paras.length ? paras : (bodyCell ? [bodyCell] : [])).forEach((p) => body.append(p));
  wrap.append(body);

  block.append(wrap);
}
