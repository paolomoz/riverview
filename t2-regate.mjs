// Re-gate the 17 fixed pages (same fidelity diff as t2-gate).
import { chromium } from 'playwright';
import fs from 'node:fs';
const paths = JSON.parse(fs.readFileSync('/tmp/t2-fix.json', 'utf8')).ok;
const b = await chromium.launch();
const EXCL = /for more information|in this section|^about( us)?$/;
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const pg = await ctx.newPage();
async function heads(url, sel) {
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await pg.waitForTimeout(1500);
  return pg.evaluate((s) => [...document.querySelectorAll(s)].map((h) => h.textContent.trim().replace(/\s+/g, ' ').toLowerCase()).filter(Boolean), sel);
}
let pass = 0; const warn = [];
for (const p of paths) {
  try {
    const o = (await heads(`https://www.riverview.org${p}`, 'main h1,main h2,main h3,main h4,main h5,main h6,h1')).filter((t) => !EXCL.test(t));
    const d = new Set(await heads(`https://main--riverview--paolomoz.aem.page${p}`, 'main h1,main h2,main h3,main h4,main h5,main h6,main strong,main .ds-rail p,main .ds-rail li,main figcaption,main em,h1'));
    const os = [...new Set(o)];
    const matched = os.filter((h) => d.has(h)).length;
    const pct = os.length ? Math.round((100 * matched) / os.length) : 100;
    if (pct >= 90) { pass += 1; console.log(`PASS ${pct}% ${p}`); }
    else warn.push({ p, pct, missing: os.filter((h) => !d.has(h)).slice(0, 3) }), console.log(`WARN ${pct}% ${p} :: ${os.filter((h) => !d.has(h)).slice(0, 2).join(' | ')}`);
  } catch { console.log('ERR', p); warn.push({ p, pct: -1 }); }
}
await b.close();
fs.writeFileSync('/tmp/t2-regate.json', JSON.stringify(warn, null, 1));
console.log(`DONE pass=${pass}/${paths.length}`);
