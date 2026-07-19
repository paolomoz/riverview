// Tier-2 auto-gate: source-heading fidelity diff (h1-h6, levels-agnostic, rail
// labels excluded) + about:error/h1 checks, concurrency 3.
import { chromium } from 'playwright';
import fs from 'node:fs';
const R = JSON.parse(fs.readFileSync('/tmp/t2-deploy.json', 'utf8'));
const paths = R.live;
const b = await chromium.launch();
const out = { pass: [], warn: [] };
const EXCL = /for more information|in this section|^about( us)?$/;
async function heads(pg, url, extraSel) {
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await pg.waitForTimeout(1500);
  return pg.evaluate((sel) => [...document.querySelectorAll(sel)]
    .map((h) => h.textContent.trim().replace(/\s+/g, ' ').toLowerCase()).filter(Boolean), extraSel);
}
let i = 0; const CONC = 3;
async function worker() {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  while (i < paths.length) {
    const p = paths[i]; i += 1;
    try {
      const o = (await heads(pg, `https://www.riverview.org${p}`, 'main h1,main h2,main h3,main h4,main h5,main h6,h1')).filter((t) => !EXCL.test(t));
      const dRaw = await heads(pg, `https://main--riverview--paolomoz.aem.page${p}`, 'main h1,main h2,main h3,main h4,main h5,main h6,main strong,h1');
      const err = await pg.evaluate(() => /about:error/i.test(document.body.textContent) ? 1 : 0 + (document.querySelectorAll('h1').length !== 1 ? 2 : 0));
      const d = new Set(dRaw);
      const os = [...new Set(o)];
      const matched = os.filter((h) => d.has(h)).length;
      const pct = os.length ? Math.round((100 * matched) / os.length) : 100;
      if (pct >= 90 && !err) { out.pass.push(p); console.log(`PASS ${pct}% ${p}`); }
      else { out.warn.push({ p, pct, err, missing: os.filter((h) => !d.has(h)).slice(0, 3) }); console.log(`WARN ${pct}% err=${err} ${p}`); }
    } catch (e) { out.warn.push({ p, pct: -1, err: String(e.message).slice(0, 40) }); console.log('ERR', p); }
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: CONC }, worker));
await b.close();
fs.writeFileSync('/tmp/t2-gate.json', JSON.stringify(out, null, 1));
console.log(`DONE pass=${out.pass.length} warn=${out.warn.length}`);
