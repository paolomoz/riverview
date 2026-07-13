/**
 * article-footer — article end matter: a tag chip row over a rule, then an
 * actions row ("More articles" text link + a "More from <author>" byline).
 * Tier: RECONSTRUCTIVE (the tag chips are a repeat group; the actions row is a
 * fixed composition rebuilt from authored links).
 *
 * Source: blog-finding-comfort-courtney-cox-cole-infusion-center-proposed.html
 *         [data-section="article-footer"] (.ds-article-end)
 * Schema: stardust/eds-schema/blog-finding-comfort-courtney-cox-cole-infusion-center.json#article-footer
 *
 * Row contract (content/blog/finding-comfort-courtney-cox-cole-infusion-center.html):
 *   row 0 → tags: a "Tags:" label (<p>) followed by one or more chip <a> links
 *   row 1 → actions: the "More articles" link (<a>) + a byline paragraph
 *           ("More from <a>Author</a>")
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.querySelector(':scope > div') || rows[i];

  const tagsCell = cell(0);
  const actionsCell = cell(1);

  const labelText = (tagsCell?.querySelector('p')?.textContent || 'Tags:').trim();
  const tagLinks = tagsCell ? [...tagsCell.querySelectorAll('a')] : [];

  block.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const measure = document.createElement('div');
  measure.className = 'ds-measure';

  // tags row
  const tags = document.createElement('div');
  tags.className = 'ds-article-tags';
  const label = document.createElement('span');
  label.className = 'ds-tags-label';
  label.textContent = labelText;
  tags.append(label);
  tagLinks.forEach((a) => {
    const chip = a.cloneNode(true);
    chip.className = 'ds-chip-tag';
    tags.append(chip);
  });
  measure.append(tags);

  // actions row: "More articles" link + "More from <author>" byline
  const actions = document.createElement('div');
  actions.className = 'ds-article-actions';
  const paras = actionsCell ? [...actionsCell.querySelectorAll(':scope > p')] : [];
  const morePara = paras[0];
  const bylinePara = paras[1];

  const moreLink = morePara?.querySelector('a');
  if (moreLink) {
    const more = moreLink.cloneNode(true);
    more.className = 'ds-link ds-article-more';
    actions.append(more);
  }

  if (bylinePara) {
    const byline = document.createElement('p');
    byline.className = 'ds-article-byline';
    const authorLink = bylinePara.querySelector('a');
    const kickerText = [...bylinePara.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join(' ')
      .trim();
    if (kickerText) {
      const kicker = document.createElement('span');
      kicker.className = 'ds-article-byline-kicker';
      kicker.textContent = kickerText;
      byline.append(kicker);
      byline.append(' ');
    }
    if (authorLink) {
      const author = authorLink.cloneNode(true);
      author.className = 'ds-article-author';
      byline.append(author);
    }
    actions.append(byline);
  }
  measure.append(actions);

  wrap.append(measure);
  block.append(wrap);
}
