/**
 * article-cta — closing CTA band for a post: a single wide outline pill linking
 * to the related service.
 * Tier: TEMPLATE-SLOTTED (fixed single-composition band; the CTA is slotted).
 *
 * Source: blog-finding-comfort-courtney-cox-cole-infusion-center-proposed.html
 *         [data-section="article-cta"] (.ds-article-cta)
 * Schema: stardust/eds-schema/blog-finding-comfort-courtney-cox-cole-infusion-center.json#article-cta
 *
 * Row contract (content/blog/finding-comfort-courtney-cox-cole-infusion-center.html):
 *   row 0 → the CTA, authored as <em><a> (→ .btn.btn-secondary outline pill).
 * Buttons are NOT manufactured here — the authored <em><a> child nodes are cloned
 * into an .actions wrapper and the global button decorator paints them.
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cell = rows[0]?.querySelector(':scope > div') || rows[0];
  const ctaNodes = cell ? [...cell.childNodes] : [];

  block.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const measure = document.createElement('div');
  measure.className = 'ds-measure';
  const actions = document.createElement('div');
  actions.className = 'actions';
  ctaNodes.forEach((n) => actions.append(n.cloneNode(true)));
  measure.append(actions);
  wrap.append(measure);
  block.append(wrap);
}
