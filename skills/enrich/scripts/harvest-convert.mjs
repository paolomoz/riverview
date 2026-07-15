// harvest-convert.mjs — region tree (harvest.mjs) → EDS content page, per the
// mapping in stardust/rebuild/LEARNINGS.md. Faithful translation of composed
// live pages: card-runs → cards, media regions → split, label lists →
// svc-cards/pills, phone/hours sub-lines folded into prose, everything else →
// service-body article. No invented copy.
// Usage: node harvest-convert.mjs <slug> <outFile>
import fs from 'node:fs';

const slug = process.argv[2];
const outFile = process.argv[3];
const H = JSON.parse(fs.readFileSync(`stardust/harvest/${slug}.json`, 'utf8'));

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rel = (h) => String(h || '').replace('https://www.riverview.org', '') || '/';
const cell = (h) => `<div>${h}</div>`;
const row = (...cs) => `<div>${cs.map(cell).join('')}</div>`;
const block = (name, rows) => `<div class="${name}">${rows.map((r) => `<div>${r.map(cell).join('')}</div>`).join('')}</div>`;
const section = (...parts) => `    <div>\n      ${parts.filter(Boolean).join('\n      ')}\n    </div>`;
const words = (t) => (t || '').split(/\s+/).filter(Boolean).length;
const PHONE = /(\d{3})[.\- ](\d{3})[.\- ](\d{4})/g;
const telify = (t) => esc(t).replace(PHONE, (m, a, b2, c) => `<a href="tel:+1${a}${b2}${c}">${m}</a>`);
const GLYPH = /^[a-z_]+$/; // material icon glyph link text
const CTA = (r) => (r.links || []).find((l) => !GLYPH.test(l.text) && l.text.length > 2);
const PILLS_RE = /symptom|sign|condition|we treat|disorders?|allergens?/i;

// section-nav detection: an items set containing a link to THIS page is the
// sidebar "In this section" nav (About pages) — route to the rail, not a block.
const selfPath = rel(H.url);
let railNav = '';
const stripNav = (r) => {
  if (r.items.length >= 2 && r.items.some((it) => it.href && rel(it.href) === selfPath)) {
    if (!railNav) railNav = `<p>In this section</p><ul>${r.items.map((it) => `<li><a href="${rel(it.href)}"${rel(it.href) === selfPath ? ' aria-current="page"' : ''}>${esc(it.text)}</a></li>`).join('')}</ul>`;
    r.items = [];
  }
  return r;
};

// fold h5/h6 sub-line regions into their parent h2/h3 region
const regions = [];
for (const r of H.regions.map(stripNav)) {
  const prev = regions[regions.length - 1];
  if (r.heading && r.level >= 5 && prev && prev.heading && prev.level <= 4) {
    prev.paras.push(r.heading, ...r.paras);
    prev.links.push(...r.links); prev.items.push(...r.items); prev.imgs.push(...r.imgs);
  } else regions.push({ ...r, paras: [...r.paras], links: [...r.links], items: [...r.items], imgs: [...r.imgs] });
}

// card-run detection: ≥2 consecutive same-level headed regions, each compact
// (≤3 paras, no items) with a CTA link or an image
const isCardish = (r) => r.heading && r.level >= 2 && r.level <= 4 && r.paras.length <= 3
  && r.items.length === 0 && (CTA(r) || r.imgs.length);

const S = [];
S.push(section(`<div class="metadata">${row('Title', esc(H.title))}${row('Description', esc(H.description))}</div>`));

// hero: on-page h1 (fallback: title before |), lede = description
const h1 = H.h1 || H.title.split('|')[0].trim();
const crumbs = rel(H.url).split('/').filter(Boolean);
const crumbLis = ['<li><a href="/">Home</a></li>'];
let acc = '';
crumbs.forEach((s, i) => { acc += `/${s}`; crumbLis.push(i === crumbs.length - 1 ? `<li>${esc(h1)}</li>` : `<li><a href="${acc}">${esc(s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}</a></li>`); });
S.push(section(block('service-hero', [
  [`<ul>${crumbLis.join('')}</ul>`],
  [`<h1>${esc(h1)}</h1>`],
  [H.description ? `<p>${esc(H.description)}</p>` : ''],
  ['<p><strong><a href="/schedule-appointment">Schedule an Appointment</a></strong></p>'],
])));

let prose = ''; // accumulated service-body article html
let railUsed = false;
const flushProse = () => {
  if (!prose) return;
  const r0 = railUsed ? '' : railNav; railUsed = railUsed || !!railNav;
  S.push(section(block('service-body', [[r0], [''], [prose]])));
  prose = '';
};

// bio-run detection: ≥3 consecutive same-level headed regions, each link/img-free
// with a short first para (a role/title line) → bio cards (leadership grid)
const isBioish = (r) => r.heading && r.level >= 3 && r.level <= 4 && !CTA(r) && !r.imgs.length
  && r.items.length === 0 && r.paras.length >= 1 && words(r.paras[0]) <= 8;

// FAQ detection: a run of ≥4 '?'-ending headed regions → accordion (David's #5:
// one row per Q/A — question cell + answer cell)
const isFaqish = (r) => r.heading && /\?\s*$/.test(r.heading) && r.paras.length >= 1 && !r.imgs.length;

let i = 0;
while (i < regions.length) {
  const r = regions[i];
  // FAQ run → accordion rows (question cell + answer cell)
  if (isFaqish(r)) {
    let j = i;
    while (j < regions.length && isFaqish(regions[j])) j += 1;
    if (j - i >= 4) {
      flushProse();
      S.push(section(block('accordion', regions.slice(i, j).map((q) => [
        esc(q.heading),
        q.paras.map((p) => `<p>${telify(p)}</p>`).join(''),
      ]))));
      i = j; continue;
    }
  }
  // bio run (leadership-style grid)?
  if (isBioish(r)) {
    let j = i;
    while (j < regions.length && isBioish(regions[j]) && regions[j].level === r.level) j += 1;
    if (j - i >= 3) {
      flushProse();
      S.push(section(block('cards', regions.slice(i, j).map((c) => [
        `<h3>${esc(c.heading)}</h3><p><em>${esc(c.paras[0])}</em></p>${c.paras.slice(1).map((p) => `<p>${telify(p)}</p>`).join('')}`,
      ]))));
      i = j; continue;
    }
  }
  // card run?
  if (isCardish(r)) {
    let j = i;
    while (j < regions.length && isCardish(regions[j]) && regions[j].level === r.level) j += 1;
    if (j - i >= 2) {
      flushProse();
      const rows = regions.slice(i, j).map((c) => {
        const cta = CTA(c);
        const img = c.imgs[0];
        return [(img ? `<img src="${img.src}" alt="${esc(img.alt)}" width="${img.w}" height="${img.h}">` : '')
          + `<h3>${esc(c.heading)}</h3>` + c.paras.map((p) => `<p>${telify(p)}</p>`).join('')
          + (cta ? `<p><a href="${rel(cta.href)}">${esc(cta.text.replace(' →', ''))}</a></p>` : '')];
      });
      S.push(section(block('cards', rows)));
      i = j; continue;
    }
  }
  // media split (single region with a real image + prose)
  if (r.imgs.length && r.paras.length && r.heading) {
    flushProse();
    const img = r.imgs[0];
    const ctas = (r.links || []).filter((l) => !GLYPH.test(l.text)).slice(0, 2);
    S.push(section(block('split', [
      [`<img src="${img.src}" alt="${esc(img.alt)}" width="${img.w}" height="${img.h}">`],
      [(r.level > 1 ? `<h2>${esc(r.heading)}</h2>` : '') + r.paras.map((p) => `<p>${telify(p)}</p>`).join('')
        + (ctas.length ? `<p>${ctas.map((l, k) => (k === 0 ? `<strong><a href="${rel(l.href)}">${esc(l.text)}</a></strong>` : `<a href="${rel(l.href)}">${esc(l.text)}</a>`)).join(' ')}</p>` : '')],
    ])));
    i += 1; continue;
  }
  // label lists → svc-cards / pills; other lists → <ul> in prose
  if (r.items.length >= 3) {
    const labels = r.items.every((it) => words(it.text) <= 6 && !/[.:;]$/.test(it.text.trim()));
    if (labels) {
      flushProse();
      const name = PILLS_RE.test(r.heading || '') ? 'pills' : 'svc-cards';
      S.push(section(r.heading && r.level > 1 ? `<h2>${esc(r.heading)}</h2>` : '',
        r.paras.map((p) => `<p>${telify(p)}</p>`).join(''),
        block(name, r.items.map((it) => [it.href ? `<a href="${rel(it.href)}">${esc(it.text)}</a>` : esc(it.text)]))));
      i += 1; continue;
    }
  }
  // prose article accumulation (don't re-emit the page h1 region's heading)
  if (r.heading && r.level > 1) prose += `<h${Math.min(r.level, 3)}>${esc(r.heading)}</h${Math.min(r.level, 3)}>`;
  prose += r.paras.map((p) => `<p>${telify(p)}</p>`).join('');
  if (r.items.length) prose += `<ul>${r.items.map((it) => `<li>${it.href ? `<a href="${rel(it.href)}">${esc(it.text)}</a>` : esc(it.text)}</li>`).join('')}</ul>`;
  const extraCtas = (r.links || []).filter((l) => !GLYPH.test(l.text) && /request|schedule|apply|donate|give|join|sign up|learn more|view|find/i.test(l.text));
  if (extraCtas.length) prose += `<p>${extraCtas.slice(0, 2).map((l) => `<strong><a href="${rel(l.href)}">${esc(l.text.replace(' →', ''))}</a></strong>`).join(' ')}</p>`;
  i += 1;
}
flushProse();

// section-nav captured but no service-body consumed it (card/label-only pages) →
// emit a rail-only service-body so the in-section wayfinding links survive.
if (railNav && !railUsed) {
  S.push(section(block('service-body', [[railNav], [''], ['']])));
  railUsed = true;
}

const doc = `<body>\n  <header></header>\n  <main>\n${S.join('\n')}\n  </main>\n  <footer></footer>\n</body>\n`;
fs.mkdirSync(outFile.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(outFile, doc);
const blocks = [...doc.matchAll(/<div class="([a-z-]+)">/g)].map((m) => m[1]).filter((b) => b !== 'metadata');
console.log(`${slug}: ${blocks.join(', ')}`);
