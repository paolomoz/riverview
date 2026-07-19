// Full-site health sweep: every ledger-live page → delivered 200, exactly one h1,
// no about:error, no empty main. Concurrency 8, ~10 min.
import fs from 'node:fs';
const dl = JSON.parse(fs.readFileSync('content/.deploy-ledger.json', 'utf8'));
const paths = Object.entries(dl).filter(([, r]) => r.status === 'live').map(([p]) => p);
const out = { ok: 0, warn: [] };
let i = 0;
async function worker() {
  while (i < paths.length) {
    const p = paths[i]; i += 1;
    try {
      const r = await fetch(`https://main--riverview--paolomoz.aem.live${p}.plain.html`);
      if (r.status !== 200) { out.warn.push([p, 'http' + r.status]); continue; }
      const t = await r.text();
      const h1s = (t.match(/<h1[\s>]/g) || []).length;
      const err = /about:error/i.test(t);
      const empty = t.replace(/<[^>]+>/g, '').trim().length < 40;
      if (h1s !== 1 || err || empty) out.warn.push([p, `h1=${h1s}${err ? ' about:error' : ''}${empty ? ' empty' : ''}`]);
      else out.ok += 1;
    } catch (e) { out.warn.push([p, 'fetch-err']); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
fs.writeFileSync('/tmp/qa-sweep.json', JSON.stringify(out, null, 1));
console.log(`DONE ok=${out.ok} warn=${out.warn.length} of ${paths.length}`);
const byIssue = {};
out.warn.forEach(([, w]) => { byIssue[w] = (byIssue[w] || 0) + 1; });
console.log(JSON.stringify(byIssue));
