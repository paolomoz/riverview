/**
 * video-footer — "Tags:" chip row + "More videos" action, as captured.
 * Tier: TEMPLATE-SLOTTED. Slots the authored tag link(s) and the More-videos CTA
 * into the fixed tags/actions composition.
 *
 * Source: stardust/prototypes/video-…-proposed.html (section.ds-video-end)
 * Schema: stardust/eds-schema/video-courtney-cox-cole-infusion-center.json#video-footer
 *
 * Authored row contract:
 *   0  tag link(s) — plain <a> per tag (rendered as .ds-chip-tag chips)
 *   1  CTA — <em><a href="/video">More videos</a></em> (→ btn-secondary outline)
 */

export default async function decorate(block) {
  const rows = [...block.children];
  const cellOf = (row) => (row ? row.querySelector(':scope > div') || row : null);
  const [tagsRow, actionsRow] = rows.map(cellOf);

  const tags = document.createElement('div');
  tags.className = 'ds-video-tags';
  tags.setAttribute('data-slot', 'video-tags');
  tags.innerHTML = '<span class="ds-tags-label">Tags:</span>';
  [...(tagsRow?.querySelectorAll('a') || [])].forEach((a) => {
    a.classList.add('ds-chip-tag');
    tags.append(a);
  });

  const actions = document.createElement('div');
  actions.className = 'ds-video-actions';
  if (actionsRow) actions.append(...actionsRow.childNodes);

  const measure = document.createElement('div');
  measure.className = 'ds-measure';
  measure.append(tags, actions);

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  wrap.append(measure);

  block.replaceChildren(wrap);
}
