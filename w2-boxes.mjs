// Wave-2 mechanical: probe each page's live sidebar boxes; append missing ones as
// service-body rail-box rows; redeploy. For the 8 known small-gap pages.
import { chromium } from 'playwright';
import fs from 'node:fs';
const CWD = '/Users/paolo/stardust/semrush/riverview-eds';
const T = fs.readFileSync(`${CWD}/.env`, 'utf8').match(/^DA_TOKEN=(.*)$/m)[1].trim();
const paths = ['/visitor-information/chaplaincy-services', '/visitor-information/patient-messages-prayer-requests',
  '/services/gynecology-services', '/services/interventional-pain-management',
  '/services/pharmacy-services/pharmacy-residency-pgy1-program', '/services/pharmacy-services/medication-management-services',
  '/services/radiology-imaging-services/screenings', '/explore-diagnostic-services-available-riverview-health-noblesville'];
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rel = (h) => String(h || '').replace('https://www.riverview.org', '') || '/';
const tel = (t) => esc(t).replace(/(\(?\d{3}\)?)[.\-\s](\d{3})[.\-\s](\d{4})/g, (m, a, b2, c) => `<a href="tel:+1${a.replace(/\D/g, '')}${b2}${c}">${m}</a>`);
const b = await chromium.launch();
const pg = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
for (const p of paths) {
  try {
    await pg.goto(`https://www.riverview.org${p}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await pg.waitForTimeout(2000);
    const boxes = await pg.evaluate(() => {
      const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
      const abs = (h) => { try { return new URL(h, location.href).href; } catch { return h; } };
      const sb = document.querySelector('.hgm-sidebar'); if (!sb) return [];
      const out = [];
      sb.querySelectorAll('.field.body, .field--name-body').forEach((box) => {
        const label = clean(box.querySelector('h2,h3,h4,h5,h6,strong')?.textContent) || 'More Information';
        const lines = [...box.querySelectorAll('p,li,h5,h6')].map((el) => clean(el.textContent)).filter((t) => t && t !== label);
        const links = [...box.querySelectorAll('a[href]')].map((a) => ({ text: clean(a.textContent), href: abs(a.getAttribute('href')) })).filter((l) => l.text && !/^[a-z_]+$/.test(l.text));
        if (lines.length || links.length) out.push({ label, lines: [...new Set(lines)].slice(0, 8), links: links.slice(0, 6) });
      });
      return out;
    });
    if (!boxes.length) { console.log('SKIP (no boxes found)', p); continue; }
    const f = `${CWD}/content${p}.html`;
    let s = fs.readFileSync(f, 'utf8');
    // drop boxes whose label already appears in the content
    const missing = boxes.filter((bx) => !s.toLowerCase().includes(bx.label.toLowerCase()));
    if (!missing.length) { console.log('OK (already present)', p); continue; }
    const rows = missing.map((bx) => `<div><div><p>${esc(bx.label)}</p><p>${bx.lines.map((l) => tel(l)).join('<br>')}</p>${bx.links.length ? `<ul>${bx.links.map((l) => `<li><a href="${rel(l.href)}">${esc(l.text)}</a></li>`).join('')}</ul>` : ''}</div></div>`).join('');
    const i = s.indexOf('<div class="service-body">');
    if (i < 0) { console.log('SKIP (no service-body)', p); continue; }
    // insert rows right before the block's closing: find end of block = matching close of the top div
    // blocks are single-line-ish; find the next '</div>\n' that closes it via balance
    let depth = 0; let j = i;
    while (j < s.length) {
      if (s.startsWith('<div', j)) { depth += 1; j = s.indexOf('>', j) + 1; }
      else if (s.startsWith('</div>', j)) { depth -= 1; if (depth === 0) break; j += 6; }
      else j += 1;
    }
    s = s.slice(0, j) + rows + s.slice(j);
    fs.writeFileSync(f, s);
    const fd = new FormData(); fd.append('data', new Blob([s], { type: 'text/html' }), 'f.html');
    const put = await fetch(`https://admin.da.live/source/paolomoz/riverview${p}.html`, { method: 'PUT', headers: { Authorization: `Bearer ${T}` }, body: fd });
    await fetch(`https://admin.hlx.page/preview/paolomoz/riverview/main${p}`, { method: 'POST', headers: { Authorization: `Bearer ${T}` } });
    await fetch(`https://admin.hlx.page/live/paolomoz/riverview/main${p}`, { method: 'POST', headers: { Authorization: `Bearer ${T}` } });
    console.log((put.status === 200 ? 'LIVE ' : 'FAIL ') + p + ' +' + missing.length + ' boxes (' + missing.map((x) => x.label).join('; ').slice(0, 60) + ')');
  } catch (e) { console.log('ERR', p, String(e.message).slice(0, 50)); }
}
await b.close();
