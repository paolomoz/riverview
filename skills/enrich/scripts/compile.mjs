// compile.mjs — deterministic page compiler: harvest2 typed tree → EDS content page
// (David's Model) + a gate MANIFEST of expected structural counts. Zero LLM tokens.
// Rules = the classification learned on the 22 Tier-1 pages (see PROCESS.md,
// LEARNINGS.md). Unmapped/odd shapes exit non-zero → the page falls back to the
// agent path. Usage: node compile.mjs <slug> <outFile> <canonicalPath>
import fs from 'node:fs';

const [, , slug, OUT, PATHP] = process.argv;
const H = JSON.parse(fs.readFileSync(`stardust/harvest2/${slug}.json`, 'utf8'));

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rel = (h) => String(h || '').replace(/https?:\/\/[a-z0-9.-]*pantheonsite\.io/, '').replace('https://www.riverview.org', '') || '/';
const cell = (h) => `<div>${h}</div>`;
const row = (...cs) => `<div>${cs.map(cell).join('')}</div>`;
const block = (n, rows) => `<div class="${n}">${rows.map((r) => `<div>${r.map(cell).join('')}</div>`).join('')}</div>`;
const section = (...p) => `    <div>\n      ${p.filter(Boolean).join('\n      ')}\n    </div>`;
const words = (t) => (t || '').split(/\s+/).filter(Boolean).length;
const tel = (t) => esc(t).replace(/(\(?\d{3}\)?)[.\-\s](\d{3})[.\-\s](\d{4})/g, (m, a, b2, c) => `<a href="tel:+1${a.replace(/\D/g, '')}${b2}${c}">${m}</a>`);
const linkify = (n) => { let out = tel(n.text); for (const l of n.links || []) { const lt = esc(l.text); if (lt && out.includes(lt)) out = out.replace(lt, `<a href="${rel(l.href)}">${lt}</a>`); } return out; };
const PILLS_RE = /symptom|sign|condition|we treat|disorders?|allergens?/i;
const isLabelSet = (items) => items.length >= 3 && items.every((it) => words(it.text) <= 6 && !/[.:;]$/.test(it.text.trim()));
const manifest = { videos: 0, imgs: 0, people: 0, formFields: 0, pills: 0, svcCards: 0, listItems: 0, paras: 0, navLinks: 0, headings: 0 };

const S = [];
S.push(section(`<div class="metadata">${row('Title', esc(H.title))}${row('Description', esc(H.description || H.hero?.lede || '').slice(0, 155))}</div>`));

// hero
const segs = rel(H.url).split('/').filter(Boolean);
const crumbs = ['<li><a href="/">Home</a></li>']; let acc = '';
segs.forEach((s, i) => { acc += `/${s}`; crumbs.push(i === segs.length - 1 ? `<li>${esc(H.hero.h1)}</li>` : `<li><a href="${acc}">${esc(s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}</a></li>`); });
const ctas = (H.hero.ctas || []).slice(0, 2).map((l, i) => (i === 0 ? `<strong><a href="${rel(l.href)}">${esc(l.text)}</a></strong>` : `<a href="${rel(l.href)}">${esc(l.text)}</a>`)).join(' ')
  || '<strong><a href="/schedule-appointment">Schedule an Appointment</a></strong>';
S.push(section(block('service-hero', [[`<ul>${crumbs.join('')}</ul>`], [`<h1>${esc(H.hero.h1)}</h1>`], [H.hero.lede ? `<p>${esc(H.hero.lede)}</p>` : ''], [`<p>${ctas}</p>`],
  ...(H.hero.bg ? [[`<img src="${H.hero.bg}" alt="">`]] : [])])));

// sidebar → service-body rows (built once, attached to first prose flush)
let railNav = ''; let railInfo = '';
if (H.sidebar) {
  if (H.sidebar.nav.length) { railNav = `<p>${esc(H.sidebar.navLabel || 'In this section')}</p><ul>${H.sidebar.nav.map((l) => `<li><a href="${rel(l.href)}"${rel(l.href) === rel(H.url) ? ' aria-current="page"' : ''}>${esc(l.text)}</a></li>`).join('')}</ul>`; manifest.navLinks = H.sidebar.nav.length; }
  const box = H.sidebar.info[0];
  if (box) railInfo = `<p>${esc(box.label)}</p><p>${box.lines.map((l) => tel(l.text)).join('<br>')}</p>`;
}
let railUsed = false;
const takeRail = () => { if (railUsed || (!railNav && !railInfo)) return ['', '']; railUsed = true; return [railNav, railInfo]; };

// body flow → sections (heading-delimited runs, same rules as Tier-1)
let prose = '';
const flushProse = () => { if (!prose) return; const [r0, r1] = takeRail(); S.push(section(block('service-body', [[r0], [r1], [prose]]))); prose = ''; };
let pendingHead = null; // heading awaiting a typed component (list/people/form)
const emitHead = () => { if (pendingHead) { prose += `<h${Math.min(pendingHead.level, 3)}>${esc(pendingHead.text)}</h${Math.min(pendingHead.level, 3)}>`; manifest.headings += 1; pendingHead = null; } };

const nodes = H.body;
for (let i = 0; i < nodes.length; i += 1) {
  const n = nodes[i];
  if (n.t === 'h') { emitHead(); pendingHead = n; continue; }
  if (n.t === 'p') { emitHead(); prose += `<p>${linkify(n)}</p>`; manifest.paras += 1; continue; }
  if (n.t === 'list') {
    if (isLabelSet(n.items)) {
      const headTxt = pendingHead ? pendingHead.text : '';
      const name = PILLS_RE.test(headTxt) ? 'pills' : 'svc-cards';
      flushProse();
      S.push(section(pendingHead ? `<h2>${esc(pendingHead.text)}</h2>` : '', block(name, n.items.map((it) => [it.href ? `<a href="${rel(it.href)}">${esc(it.text)}</a>` : esc(it.text)]))));
      manifest[name === 'pills' ? 'pills' : 'svcCards'] += n.items.length; if (pendingHead) manifest.headings += 1; pendingHead = null; continue;
    }
    emitHead(); prose += `<ul>${n.items.map((it) => `<li>${it.href ? `<a href="${rel(it.href)}">${esc(it.text)}</a>` : esc(it.text)}</li>`).join('')}</ul>`; manifest.listItems += n.items.length; continue;
  }
  if (n.t === 'video') { emitHead(); prose += `${n.title ? `<p><strong>${esc(n.title)}</strong></p>` : ''}<p>${n.poster ? `<img src="${n.poster}" alt="${esc(n.title || '')}">` : ''}</p>`; manifest.videos += 1; continue; }
  if (n.t === 'img') { emitHead(); prose += `<p><img src="${n.src}" alt="${esc(n.alt)}"></p>`; manifest.imgs += 1; continue; }
  if (n.t === 'form') {
    flushProse(); pendingHead = null;
    const rows = [[`<h2>${esc(n.heading)}</h2>`], ...n.notes.map((t) => [esc(t)]), ...n.fields.map((f) => [esc(f.label), f.type])];
    S.push(section(block('appointment', rows))); manifest.formFields = n.fields.length; continue;
  }
  if (n.t === 'people') {
    flushProse();
    const head = pendingHead ? `<h2>${esc(pendingHead.text)}</h2>` : '<h2>Meet our people</h2>'; if (pendingHead) manifest.headings += 1; pendingHead = null;
    S.push(section(head, block('people', n.people.map((p2) => [p2.img ? `<img src="${p2.img}" alt="${esc(p2.name)}">` : '', p2.href ? `<a href="${rel(p2.href)}">${esc(p2.name)}</a>` : esc(p2.name), esc(p2.spec), '', '']))));
    manifest.people = n.people.length; continue;
  }
  // unmapped node type → fail loud (agent fallback)
  console.error(`UNMAPPED node type: ${n.t} — page needs the agent path`); process.exit(2);
}
emitHead(); flushProse();
// rail captured but never attached (label-only pages)
if (!railUsed && (railNav || railInfo)) S.push(section(block('service-body', [[railNav], [railInfo], ['']])));

fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, `<body>\n  <header></header>\n  <main>\n${S.join('\n')}\n  </main>\n  <footer></footer>\n</body>\n`);
fs.mkdirSync('stardust/compile-manifests', { recursive: true });
fs.writeFileSync(`stardust/compile-manifests/${slug}.json`, JSON.stringify({ path: PATHP, manifest, hero: !!H.hero.bg }, null, 1));
console.log(`${slug}: ${[...OUT.matchAll(/x/g), ...''] && ''}${JSON.stringify(manifest)} hero=${H.hero.bg ? 'photo' : 'navy'}`);
