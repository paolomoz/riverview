/**
 * provider-about — About prose band for a provider.
 * Tier: TEMPLATE-SLOTTED (fixed prose composition; heading + body slotted by role).
 *
 * Source: provider-kathleen-miller-md-proposed.html [data-section="about"] (.ds-section)
 * Schema: stardust/eds-schema/provider-kathleen-miller-md.json#about
 *
 * Row contract (content/provider/kathleen-miller-md.html):
 *   row 0 → <h2> heading (e.g. "About Kathleen A Miller, MD")
 *   row 1 → About prose (one or more <p>)
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

  if (h2) {
    const head = document.createElement('div');
    head.className = 'ds-section-head';
    h2.classList.add('ds-h2');
    head.append(h2);
    wrap.append(head);
  }

  const body = document.createElement('div');
  body.className = 'ds-about-body';
  (paras.length ? paras : (bodyCell ? [bodyCell] : [])).forEach((p) => body.append(p));
  wrap.append(body);

  block.append(wrap);
}
