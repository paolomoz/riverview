/**
 * article-body — centered prose measure for a post. Holds every captured
 * paragraph plus the article's figures: one lede figure (a real riverview CDN
 * image + caption) and any caption-only figures (mint-ruled italic captions with
 * NO image — the source images 404'd and were omitted per media-reconciliation;
 * the captured caption text is preserved exactly).
 * Tier: TEMPLATE-SLOTTED (fixed prose composition; the full body is slotted, and
 * figure treatment is assigned structurally by whether a figure carries an image).
 *
 * Source: blog-finding-comfort-courtney-cox-cole-infusion-center-proposed.html
 *         [data-section="article-body"] (.ds-article-section)
 * Schema: stardust/eds-schema/blog-finding-comfort-courtney-cox-cole-infusion-center.json#article-body
 *
 * Row contract (content/blog/finding-comfort-courtney-cox-cole-infusion-center.html):
 *   row 0 → the full article body: <p> paragraphs and <figure> elements in order.
 *           A <figure> WITH an <img> → lede figure (image + caption).
 *           A <figure> WITHOUT an <img> → caption-only figure (mint-ruled italic).
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const bodyCell = rows[0]?.querySelector(':scope > div') || rows[0];
  const nodes = bodyCell ? [...bodyCell.children] : [];

  block.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const article = document.createElement('article');
  article.className = 'ds-article';

  nodes.forEach((node) => {
    const el = node.cloneNode(true);
    if (el.tagName === 'FIGURE') {
      el.classList.add('ds-article-fig');
      const img = el.querySelector('img');
      if (img) {
        el.classList.add('ds-article-fig--lede');
      } else {
        // Caption-only figure: source image 404'd and was omitted per
        // media-reconciliation; the captured caption is preserved verbatim.
        el.classList.add('ds-article-fig--caption-only');
      }
    }
    article.append(el);
  });

  wrap.append(article);
  block.append(wrap);
}
