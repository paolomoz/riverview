/**
 * article-hero — post hero: navy wave band (topo contours + wave mask) carrying
 * the article title, publish date, author byline and category chips.
 * Tier: TEMPLATE-SLOTTED (bespoke fixed hero composition; authored values slotted
 * by role). Carries the page <h1>.
 *
 * Source: blog-finding-comfort-courtney-cox-cole-infusion-center-proposed.html
 *         [data-section="article-hero"] (.ds-ahero)
 * Schema: stardust/eds-schema/blog-finding-comfort-courtney-cox-cole-infusion-center.json#article-hero
 *
 * Row contract (content/blog/finding-comfort-courtney-cox-cole-infusion-center.html):
 *   row 0 → <h1> article title
 *   row 1 → publish date (<time datetime> preferred, else plain text)
 *   row 2 → byline paragraph: "By: <a>Author</a>"
 *   row 3 → category links (one or more <a>)
 *
 * Chrome reproduced verbatim from the prototype meta row: the "·" separator and
 * the sr-only "Categories:" label (accessibility labels, not authored content).
 * Signature elements (inlined, decorative, aria-hidden): topo SVG texture + wave mask.
 */

const TOPO_SVG = `<svg class="ds-topo" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1.5"><path d="M-60 90 C 220 30, 460 150, 740 100 S 1230 40, 1500 110"/><path d="M-60 190 C 240 130, 480 250, 760 200 S 1250 140, 1500 210"/><path d="M-60 290 C 200 230, 440 350, 720 300 S 1210 240, 1500 310"/><path d="M-60 390 C 260 330, 500 450, 780 400 S 1270 340, 1500 410"/><path d="M-60 490 C 220 430, 460 550, 740 500 S 1230 440, 1500 510"/></g></svg>`;
const WAVE_SVG = `<svg class="ds-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path fill="#ffffff" d="M0,58 C170,94 350,16 560,32 C780,49 930,98 1130,74 C1275,57 1375,24 1440,38 L1440,100 L0,100 Z"/></svg>`;

export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.querySelector(':scope > div') || rows[i];

  const h1 = cell(0)?.querySelector('h1') || cell(0);
  const dateCell = cell(1);
  const bylineCell = cell(2);
  const catCell = cell(3);
  const catLinks = catCell ? [...catCell.querySelectorAll('a')] : [];

  // Phase-4 SEO: Article JSON-LD from the parsed hero fields
  try {
    const t = dateCell?.querySelector('time');
    const ld = {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: (h1?.textContent || '').trim(), url: window.location.href,
      datePublished: t ? t.getAttribute('datetime') : undefined,
      publisher: { '@type': 'MedicalOrganization', name: 'Riverview Health', '@id': 'https://www.riverview.org/#organization' },
    };
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(ld, (k, v) => (v === undefined ? undefined : v));
    document.head.append(s);
  } catch (e) { /* non-fatal */ }

  block.replaceChildren();
  block.insertAdjacentHTML('beforeend', TOPO_SVG);

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const inner = document.createElement('div');
  inner.className = 'ds-ahero-inner';
  if (h1) inner.append(h1);

  const meta = document.createElement('div');
  meta.className = 'ds-ahero-meta';

  // publish date — preserve an authored <time datetime>, else wrap the text.
  const authoredTime = dateCell?.querySelector('time');
  const dateText = (dateCell?.textContent || '').trim();
  if (dateText) {
    const time = document.createElement('time');
    if (authoredTime?.getAttribute('datetime')) time.setAttribute('datetime', authoredTime.getAttribute('datetime'));
    time.textContent = dateText;
    meta.append(time);
  }

  // byline — clone the authored "By: <a>Author</a>" nodes verbatim into a span.
  if (bylineCell) {
    const sep = document.createElement('span');
    sep.className = 'ds-ahero-sep';
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = '·';
    meta.append(sep);

    const byline = document.createElement('span');
    const src = bylineCell.querySelector('p') || bylineCell;
    [...src.childNodes].forEach((n) => byline.append(n.cloneNode(true)));
    meta.append(byline);
  }

  // categories — sr-only label + chip links.
  if (catLinks.length) {
    const srLabel = document.createElement('span');
    srLabel.className = 'ds-sr-only';
    srLabel.textContent = 'Categories:';
    meta.append(srLabel);
    catLinks.forEach((a) => {
      const chip = a.cloneNode(true);
      chip.className = 'ds-chip-cat';
      meta.append(chip);
    });
  }

  inner.append(meta);
  wrap.append(inner);
  block.append(wrap);
  block.insertAdjacentHTML('beforeend', WAVE_SVG);
}
