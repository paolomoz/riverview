// harvest.mjs — structured live-page harvester for high-fidelity migration.
// Unlike the flat scrape (node stream) or the API body (prose only), this walks the
// live page's <main> and emits a REGION TREE: each region = a heading with its own
// paragraphs, linked CTAs (text+href pairs), list items, and images — preserving the
// composed layout (Drupal Layout Builder cards, callouts, option grids) that the
// flat sources lose. Usage: node harvest.mjs <url> <slug> [--out dir]
import { chromium } from 'playwright';
import fs from 'node:fs';

const url = process.argv[2];
const slug = process.argv[3];
const outDir = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'stardust/harvest';
if (!url || !slug) { console.error('usage: node harvest.mjs <url> <slug> [--out dir]'); process.exit(1); }

const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
await pg.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await pg.waitForTimeout(1200);

const data = await pg.evaluate(() => {
  const main = document.querySelector('main') || document.body;
  // strip chrome that sometimes nests inside main
  main.querySelectorAll('header, footer, nav[aria-label*="Main" i], .breadcrumb, [class*="breadcrumb"]').forEach((el) => el.remove());
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const abs = (h) => { try { return new URL(h, location.href).href; } catch { return h; } };

  // walk main in document order; group content under the nearest preceding heading
  const regions = [];
  let cur = { heading: null, level: 0, paras: [], links: [], items: [], imgs: [] };
  const flush = () => { if (cur.heading || cur.paras.length || cur.links.length || cur.items.length || cur.imgs.length) regions.push(cur); };
  const seenLinks = new Set();

  const walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    const tag = node.tagName;
    if (/^H[1-6]$/.test(tag)) {
      flush();
      cur = { heading: clean(node.textContent), level: +tag[1], paras: [], links: [], items: [], imgs: [] };
    } else if (tag === 'P') {
      const t = clean(node.textContent);
      // record paragraph text WITHOUT link labels that we capture separately
      const linkTexts = [...node.querySelectorAll('a')].map((a) => clean(a.textContent));
      if (t && !linkTexts.some((lt) => lt === t)) cur.paras.push(t);
    } else if (tag === 'LI' && !node.querySelector('li')) {
      const a = node.querySelector('a');
      const t = clean(node.textContent);
      if (t && !a) cur.items.push({ text: t });
      else if (a && clean(a.textContent) !== t) cur.items.push({ text: t, href: abs(a.getAttribute('href')) });
    } else if (tag === 'A') {
      const t = clean(node.textContent); const h = node.getAttribute('href');
      const key = t + '|' + h;
      const inLi = !!node.closest('li');
      if (t && h && !h.startsWith('javascript') && h !== '#' && !seenLinks.has(key)) {
        seenLinks.add(key);
        (inLi ? cur.items : cur.links)[inLi ? 'push' : 'push'](inLi ? { text: t, href: abs(h) } : { text: t, href: abs(h) });
      }
    } else if (tag === 'IMG') {
      const src = node.currentSrc || node.src;
      if (src && node.width > 40 && node.height > 40) cur.imgs.push({ src: abs(src), alt: clean(node.alt), w: node.naturalWidth, h: node.naturalHeight });
    }
    node = walker.nextNode();
  }
  flush();

  return {
    url: location.href,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    h1: clean(document.querySelector('main h1, h1')?.textContent),
    regions,
  };
});

await b.close();
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/${slug}.json`, JSON.stringify(data, null, 1));
console.log(`harvested ${data.regions.length} regions -> ${outDir}/${slug}.json`);
data.regions.forEach((r, i) => console.log(
  ` ${String(i).padStart(2)} ${r.heading ? `h${r.level} "${r.heading.slice(0, 44)}"` : '(lead)'} `
  + `p=${r.paras.length} links=${r.links.length} items=${r.items.length} imgs=${r.imgs.length}`,
));
