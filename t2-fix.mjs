// Re-harvest (fresh, all sidebar blocks) + recompile + redeploy the cluster-A warns.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
const CWD = '/Users/paolo/stardust/semrush/riverview-eds';
const T = fs.readFileSync(`${CWD}/.env`, 'utf8').match(/^DA_TOKEN=(.*)$/m)[1].trim();
const paths = ['/patients-and-visitors/schedule-appointment/request-appointment', '/services/laboratory-services/direct-access-laboratory-testing',
  '/services/pharmacy-services/pharmacy-residency-pgy1-program', '/services/radiology-imaging-services/screenings', '/preventative-screenings',
  '/explore-diagnostic-services-available-riverview-health-noblesville', '/services/heart-vascular-services',
  '/services/pharmacy-services/medication-management-services', '/visitor-information/chaplaincy-services',
  '/visitor-information/patient-messages-prayer-requests', '/bill-pay/payment-options', '/bill-pay/financial-assistance',
  '/services/womens-health/diagnosing-treating-urinary-incontinence-overactive-bladder-noblesville',
  '/services/cancer/diagnostic-services', '/services/gynecology-services', '/services/interventional-pain-management',
  '/services/gastroenterology-services/colonoscopy'];
const slugOf = (p) => p.replace(/^\//, '').replace(/\//g, '-');
const run = (args) => new Promise((res) => execFile('node', args, { cwd: CWD, timeout: 90000 }, (e, so, se) => res({ e, so, se })));
let i = 0; const out = { ok: [], fail: [] };
async function worker() {
  while (i < paths.length) {
    const p = paths[i]; i += 1; const slug = slugOf(p);
    fs.rmSync(`${CWD}/stardust/harvest2/${slug}.json`, { force: true }); // fresh harvest w/ new sidebar capture
    const h = await run(['skills/enrich/scripts/harvest2.mjs', `https://www.riverview.org${p}`, slug]);
    if (h.e) { out.fail.push([p, 'harvest']); console.log('HFAIL', p); continue; }
    const c = await run(['skills/enrich/scripts/compile.mjs', slug, `content${p}.html`, p]);
    if (c.e) { out.fail.push([p, 'compile']); console.log('CFAIL', p); continue; }
    const html = fs.readFileSync(`${CWD}/content${p}.html`, 'utf8');
    const fd = new FormData(); fd.append('data', new Blob([html], { type: 'text/html' }), 'f.html');
    const put = await fetch(`https://admin.da.live/source/paolomoz/riverview${p}.html`, { method: 'PUT', headers: { Authorization: `Bearer ${T}` }, body: fd });
    await fetch(`https://admin.hlx.page/preview/paolomoz/riverview/main${p}`, { method: 'POST', headers: { Authorization: `Bearer ${T}` } });
    await fetch(`https://admin.hlx.page/live/paolomoz/riverview/main${p}`, { method: 'POST', headers: { Authorization: `Bearer ${T}` } });
    if (put.status === 200) { out.ok.push(p); console.log('LIVE', p); } else { out.fail.push([p, 'put' + put.status]); console.log('PFAIL', p); }
  }
}
await Promise.all(Array.from({ length: 3 }, worker));
fs.writeFileSync('/tmp/t2-fix.json', JSON.stringify(out, null, 1));
console.log(`DONE ok=${out.ok.length} fail=${out.fail.length}`);
