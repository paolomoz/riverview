// After-audit measurements — method-identical to stardust/audit/riverview-org/audit.json
// Target: https://main--riverview--paolomoz.aem.live  (same 5-page template sample)
import { chromium } from 'playwright';
import fs from 'node:fs';

const ORIGIN = 'https://main--riverview--paolomoz.aem.live';
const PAGES = {
  index: '/',
  providers: '/providers',
  'provider-kathleen-miller-md': '/provider/kathleen-miller-md',
  'wellness-understanding-healthcare-when-should-you-start-colon-cancer-screenings':
    '/wellness/understanding-healthcare/when-should-you-start-colon-cancer-screenings',
  'about-riverview-health': '/about-riverview-health',
};
const OUTDIR = '/Users/paolo/stardust/semrush/riverview/stardust/audit/riverview-aem-live';
fs.mkdirSync(OUTDIR, { recursive: true });
const M = { pages: {} };

// ---------- curl-level checks ----------
async function head(url) {
  const r = await fetch(url, { redirect: 'manual' });
  return { status: r.status, location: r.headers.get('location'), xRobots: r.headers.get('x-robots-tag') };
}
M.robots = await (async () => {
  const r = await fetch(`${ORIGIN}/robots.txt`); const t = await r.text();
  return { status: r.status, hasSitemapDirective: /sitemap:/i.test(t), blocksAll: /disallow:\s*\/\s*$/im.test(t), body: t.slice(0, 300) };
})();
M.sitemap = await (async () => {
  const r = await fetch(`${ORIGIN}/sitemap.xml`); const t = await r.text();
  const locs = (t.match(/<loc>/g) || []).length;
  return { status: r.status, valid: /<urlset/.test(t), urlCount: locs, httpLocs: (t.match(/<loc>http:\/\//g) || []).length };
})();
M.llmsTxt = await (async () => { const r = await fetch(`${ORIGIN}/llms.txt`); return { status: r.status, present: r.status === 200, bytes: r.status===200?(await r.text()).length:0 }; })();
M.redirectChain = [await head(ORIGIN.replace('https', 'http') + '/'), await head(ORIGIN + '/')];
M.noindexHeader = (await head(ORIGIN + '/')).xRobots || (await fetch(ORIGIN + '/')).headers.get('x-robots-tag');

// key facts in RAW served HTML (no JS)
const rawHome = await (await fetch(ORIGIN + '/')).text();
M.keyFactsRaw = {
  phone: /317[.\-\s]?773[.\-\s]?0760/.test(rawHome),
  address: /395\s+Westfield\s+Rd|Noblesville/i.test(rawHome),
  scheduleCta: /schedule an appointment/i.test(rawHome),
  jsonldServerRendered: /application\/ld\+json/.test(rawHome),
};

// ---------- browser measurements ----------
const b = await chromium.launch();

const pageEval = () => {
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const m = {};
  m.title = document.title; m.titleLen = m.title.length;
  m.desc = document.querySelector('meta[name="description"]')?.content || null;
  m.descLen = (m.desc || '').length;
  m.canonical = document.querySelector('link[rel="canonical"]')?.href || null;
  m.metaRobots = document.querySelector('meta[name="robots"]')?.content || null;
  m.og = {}; document.querySelectorAll('meta[property^="og:"]').forEach((x) => { m.og[x.getAttribute('property')] = (x.content || '').slice(0, 80); });
  m.jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { const j = JSON.parse(s.textContent); return [].concat(j).map((x) => x['@type']).flat(); } catch { return ['parse-error']; } }).flat();
  m.landmarks = { main: !!document.querySelector('main'), nav: !!document.querySelector('nav,[role=navigation]'), footer: !!document.querySelector('footer,[role=contentinfo]'), banner: !!document.querySelector('header,[role=banner]') };
  m.h1s = [...document.querySelectorAll('h1')].map((h) => clean(h.textContent));
  const hs = [...document.querySelectorAll('main h1,main h2,main h3,main h4,main h5,main h6')].map((h) => +h.tagName[1]);
  m.headingSkips = hs.reduce((acc, lv, i) => acc + (i && lv > hs[i - 1] + 1 ? 1 : 0), 0);
  m.headings = [...document.querySelectorAll('main h2,main h3')].map((h) => clean(h.textContent)).filter(Boolean).slice(0, 30);
  m.proseWords = clean(document.querySelector('main')?.innerText || '').split(/\s+/).filter(Boolean).length;
  const imgs = [...document.querySelectorAll('main img')];
  m.images = imgs.length;
  m.emptyAlt = imgs.filter((i) => !(i.getAttribute('alt') || '').trim()).length;
  m.altSamples = imgs.slice(0, 8).map((i) => (i.getAttribute('alt') || '').slice(0, 60));
  // schedule-bucket CTA labels (links+buttons whose text mentions schedule/book/appointment)
  m.scheduleLabels = {};
  document.querySelectorAll('a,button').forEach((a) => {
    const t = clean(a.textContent); if (!t || t.length > 70) return;
    if (/schedul|book an|appointment/i.test(t)) m.scheduleLabels[t] = (m.scheduleLabels[t] || 0) + 1;
  });
  // first-viewport CTAs (desktop)
  m.firstViewportCtas = [...document.querySelectorAll('a,button')].filter((a) => {
    const r = a.getBoundingClientRect();
    return r.top >= 0 && r.top < 900 && r.width > 0 && (a.matches('.btn,.btn-primary,[class*=cta]') || /schedul|find a provider|pay my bill|donate/i.test(clean(a.textContent)));
  }).map((a) => clean(a.textContent)).filter((t, i, arr) => t && arr.indexOf(t) === i).slice(0, 12);
  return m;
};

const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const pg = await ctx.newPage();
for (const [slug, path] of Object.entries(PAGES)) {
  await pg.goto(ORIGIN + path, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await pg.waitForTimeout(2500);
  M.pages[slug] = await pg.evaluate(pageEval);
}

// home-only: type scale, radii, pixel-sample, screenshots
await pg.goto(ORIGIN + '/', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
await pg.waitForTimeout(2500);
M.typeScale = await pg.evaluate(() => {
  const sizes = [...new Set([...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Math.round(parseFloat(getComputedStyle(h).fontSize))))].sort((a, b2) => b2 - a);
  const ratios = sizes.slice(0, -1).map((s, i) => +(s / sizes[i + 1]).toFixed(2));
  return { headingSizes: sizes, ratios };
});
M.radiusSprawl = await pg.evaluate(() => {
  const occ = {};
  document.querySelectorAll('*').forEach((el) => {
    const r = getComputedStyle(el).borderTopLeftRadius;
    if (r && r !== '0px' && el.getBoundingClientRect().width > 0) occ[r] = (occ[r] || 0) + 1;
  });
  return Object.fromEntries(Object.entries(occ).filter(([, c]) => c >= 3).sort((a, b2) => b2[1] - a[1]));
});
// fold screenshot + full-page for pixel sample
await pg.screenshot({ path: `${OUTDIR}/home-desktop-fold.png` });
await pg.screenshot({ path: `${OUTDIR}/home-fullpage.png`, fullPage: true });
// mobile capture
const mctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 });
const mpg = await mctx.newPage();
await mpg.goto(ORIGIN + '/', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
await mpg.waitForTimeout(2000);
M.mobileFirstViewportCtas = await mpg.evaluate(() => {
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  return [...document.querySelectorAll('a,button')].filter((a) => {
    const r = a.getBoundingClientRect();
    return r.top >= 0 && r.top < 667 && r.width > 0 && /schedul|provider|bill|donate|appointment/i.test(clean(a.textContent));
  }).map((a) => clean(a.textContent)).slice(0, 8);
});
M.mobileTapTargets = await mpg.evaluate(() => {
  const els = [...document.querySelectorAll('header a,header button, footer a')].filter((e) => e.getBoundingClientRect().width > 0);
  const small = els.filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; });
  return { interactive: els.length, under44: small.length };
});
await mpg.screenshot({ path: `${OUTDIR}/home-mobile.png`, fullPage: false });
await mctx.close();
await ctx.close();
await b.close();
fs.writeFileSync('/tmp/after-measurements-1.json', JSON.stringify(M, null, 1));
console.log('PART1 DONE — pages:', Object.keys(M.pages).length, 'llms:', M.llmsTxt.present, 'sitemap:', M.sitemap.urlCount, 'noindex:', M.noindexHeader);
