// harvest2.mjs — COMPONENT-AWARE harvester (the "compile" path of train-then-compile).
// Reads the source's own composition containers (site adapter, below) into a TYPED
// TREE — no text-walk reconstruction, no DOM-order trap: sidebar and body are
// separate containers in the source. Usage: node harvest2.mjs <url> <slug> [--out dir]
//
// SITE ADAPTER (riverview.org / Drupal hgm theme) — the one per-site block to remap:
//   hero:      section.hgm-marquee-two-column   (bg on .hgm-marquee-two-column__bg)
//   sidebar:   .hgm-sidebar  → .field-hgm-menu-component (nav) + .field.body (info)
//   body flow: .hgm-body-region children, in order
//   video:     .hgm-video (+ sibling/nearby h5 title)
//   webform:   form[id*=webform], .webform-submission-form
//   people:    provider card grid (h6 name + img + /provider/ link)
import { chromium } from 'playwright';
import fs from 'node:fs';

const url = process.argv[2];
const slug = process.argv[3];
const outDir = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'stardust/harvest2';
if (!url || !slug) { console.error('usage: node harvest2.mjs <url> <slug>'); process.exit(1); }

const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
try { await pg.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); } catch { await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); await pg.waitForTimeout(3000); }
await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await pg.waitForTimeout(2000);
await pg.evaluate(() => window.scrollTo(0, 0));

const data = await pg.evaluate(() => {
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const abs = (h) => { try { return new URL(h, location.href).href; } catch { return h; } };
  const GLYPH = /^[a-z_]+$/;
  const links = (el) => [...el.querySelectorAll('a[href]')].map((a) => ({ text: clean(a.textContent), href: abs(a.getAttribute('href')) }))
    .filter((l) => l.text && !GLYPH.test(l.text) && !l.href.startsWith('javascript'));
  const JUNK = /you have been blocked|unable to access|status message/i;

  const out = { url: location.href, title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '', hero: null, sidebar: null, body: [] };

  // ---- hero ----
  // pick the marquee that actually contains the page h1 (pages can have several marquee-classed wrappers)
  const hero = [...document.querySelectorAll('[class*="hgm-marquee"]')].find((el) => el.querySelector('h1')) || document.querySelector('[class*="hgm-marquee"]');
  if (hero) {
    const bgEl = hero.querySelector('[class*="__bg"]') || hero;
    const bg = getComputedStyle(bgEl).backgroundImage.match(/url\("?([^")]+)/)?.[1] || null;
    out.hero = { bg: bg && !/hero_\d|hg_webdv_child/.test(bg) ? bg : null,
      h1: clean(hero.querySelector('h1')?.textContent),
      lede: clean(hero.querySelector('p')?.textContent),
      ctas: links(hero).slice(0, 3) };
  }
  if (!out.hero || !out.hero.h1) { const h1 = document.querySelector('main h1, h1'); out.hero = { ...(out.hero || { bg: null, lede: '', ctas: [] }), h1: clean(h1?.textContent) }; }

  // ---- sidebar (its own container → no order trap) ----
  const sb = document.querySelector('.hgm-sidebar');
  if (sb) {
    const navEl = sb.querySelector('[class*="menu-component"]');
    const nav = navEl ? links(navEl) : [];
    const navLabel = navEl ? clean(navEl.querySelector('h2,h3,h4,h5,strong,p')?.textContent) || '' : '';
    const info = [];
    sb.querySelectorAll('.field.body, .field--name-body, .region-left-sidebar > div > div:not([class*=menu-component]), .region-right-sidebar > div > div:not([class*=menu-component])').forEach((box) => {
      if (box.closest('[class*=menu-component]') || box.matches('[class*=menu-component]')) return;
      if ([...sb.querySelectorAll('.field.body')].some((b2) => b2 !== box && b2.contains(box))) return;
      const label = clean(box.querySelector('h2,h3,h4,h5')?.textContent) || 'For More Information';
      const lines = [...box.querySelectorAll('p,li,h3,h4,h5,h6')].filter((el) => clean(el.textContent) !== label).map((p) => ({ html: p.innerHTML.trim(), text: clean(p.textContent), head: /^H\d$/.test(p.tagName) })).filter((l) => l.text);
      const boxLinks = links(box);
      if (lines.length || boxLinks.length) info.push({ label, lines, links: boxLinks });
    });
    out.sidebar = { navLabel, nav, info };
  }

  // ---- body flow (ordered typed nodes) ----
  const body = document.querySelector('.hgm-body-region') || document.querySelector('main');
  const push = (n) => out.body.push(n);
  const emit = (el) => {
    const tag = el.tagName;
    if (JUNK.test(clean(el.textContent)) && clean(el.textContent).length < 200) return;
    // video card
    if (el.matches('[class*="hgm-video"]') || el.querySelector(':scope > [class*="hgm-video"]')) {
      const v = el.matches('[class*="hgm-video"]') ? el : el.querySelector('[class*="hgm-video"]');
      const img = v.querySelector('img'); const ifr = v.querySelector('iframe');
      const scope = el.closest('[class*="col-"]') || el.parentElement;
      const title = clean(scope.querySelector('h2,h3,h4,h5,h6')?.textContent);
      push({ t: 'video', title, poster: img ? abs(img.currentSrc || img.src) : null, src: ifr ? abs(ifr.src) : null });
      return;
    }
    if (/^H[2-6]$/.test(tag)) { push({ t: 'h', level: +tag[1], text: clean(el.textContent), links: links(el) }); return; }
    if (tag === 'P') { const txt = clean(el.textContent); if (txt) push({ t: 'p', html: el.innerHTML.trim(), text: txt, links: links(el) }); return; }
    if (tag === 'UL' || tag === 'OL') {
      push({ t: 'list', items: [...el.querySelectorAll(':scope > li')].map((li) => { const a = li.querySelector('a'); return { text: clean(li.textContent), href: a ? abs(a.getAttribute('href')) : null }; }) }); return;
    }
    if (tag === 'FORM' || el.querySelector(':scope > form')) {
      const f = tag === 'FORM' ? el : el.querySelector('form');
      const fields = [...f.querySelectorAll('input:not([type=hidden]):not([type=submit]),select,textarea')].map((c) => {
        const id = c.id; const lbl = id ? f.querySelector(`label[for="${id}"]`) : c.closest('.form-item,.ds-field')?.querySelector('label');
        let type = c.tagName === 'SELECT' ? 'select:' + [...c.querySelectorAll('option')].map((o) => clean(o.textContent)).filter((o) => o && !/^-|none|select/i.test(o)).join('|') : (c.getAttribute('type') || 'text');
        if (c.tagName === 'TEXTAREA') type = 'text';
        return { label: clean(lbl?.textContent), type };
      }).filter((x) => x.label);
      const notes = [...f.querySelectorAll('p,.webform-element-description,[class*=message]')].map((p) => clean(p.textContent)).filter((t) => t.length > 20 && !JUNK.test(t));
      push({ t: 'form', heading: clean((el.closest('section') || f).querySelector('h2,h3')?.textContent) || 'Schedule an Appointment', fields, notes: [...new Set(notes)].slice(0, 2) }); return;
    }
    if (tag === 'IMG') { push({ t: 'img', src: abs(el.currentSrc || el.src), alt: clean(el.alt) }); return; }
    // provider/people grid?
    const names = [...el.querySelectorAll('h6, h5')].filter((h) => el.querySelectorAll('img').length >= 2 && /^[A-Z]/.test(clean(h.textContent)) && !/\d{3}/.test(h.textContent));
    if (names.length >= 3 && el.querySelectorAll('a[href*="/provider"]').length >= 2) {
      const people = names.map((h) => { const card = h.closest('div[class*=views-row],article,div[class*=card]') || h.parentElement;
        const img = card.querySelector('img'); const a = card.querySelector('a[href*="/provider"]');
        const spec = clean(card.textContent).match(/(Podiatric Surgery|Orthopedic Surgery|Gastroenterology|OB\/GYN|GYN|Sports Medicine|Family Medicine|Internal Medicine)( \+\d more)?/)?.[0] || '';
        return { name: clean(h.textContent), img: img ? abs(img.currentSrc || img.src) : null, href: a ? abs(a.getAttribute('href')) : null, spec }; });
      push({ t: 'people', people }); return;
    }
    // container: recurse in order
    if (el.children.length) [...el.children].forEach(emit);
  };
  if (body) [...body.children].forEach(emit);
  return out;
});
await b.close();
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/${slug}.json`, JSON.stringify(data, null, 1));
const counts = data.body.reduce((a, n) => { a[n.t] = (a[n.t] || 0) + 1; return a; }, {});
console.log(`${slug}: hero=${data.hero?.bg ? 'photo' : 'navy'} sidebar=${data.sidebar ? data.sidebar.nav.length + 'nav/' + data.sidebar.info.length + 'info' : '-'} body=${JSON.stringify(counts)}`);
