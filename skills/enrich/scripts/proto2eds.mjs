// proto2eds.mjs — generic stardust:migrate: approved prototype <main> → EDS content
// page (David's Model). Maps the design-system vocabulary to blocks. Usage:
//   node proto2eds.mjs <prototype.html> <out content.html> <canonical-path>
import fs from 'node:fs';
import { chromium } from 'playwright';
const [,,SRC,OUT,PATHP]=process.argv;
const b=await chromium.launch();const pg=await (await b.newContext()).newPage();
await pg.goto('file://'+(SRC.startsWith('/')?SRC:process.cwd()+'/'+SRC),{waitUntil:'load'});
const data=await pg.evaluate(()=>{
  const clean=t=>(t||'').replace(/\s+/g,' ').trim();
  const relify=el=>{el.querySelectorAll('a').forEach(a=>{const h=a.getAttribute('href')||'';if(h.startsWith('https://www.riverview.org'))a.setAttribute('href',h.replace('https://www.riverview.org','')||'/');});return el;};
  const inner=el=>relify(el.cloneNode(true)).innerHTML.trim();
  const S=[];
  const title=document.title;
  const desc=document.querySelector('meta[name="description"]')?.content||'';
  // hero
  const hero=document.querySelector('.ds-hero');
  const bg=(hero.getAttribute('style')||'').match(/url\('([^']+)'\)/)?.[1]||null;
  const crumbs=[...hero.querySelectorAll('.ds-crumbs li')].map(li=>{const a=li.querySelector('a');return a?`<li><a href="${a.getAttribute('href')}">${clean(a.textContent)}</a></li>`:`<li>${clean(li.textContent)}</li>`;}).join('');
  const h1=clean(hero.querySelector('h1')?.textContent);
  const lede=hero.querySelector('.ds-hero-lede');
  const ctas=[...hero.querySelectorAll('.ds-hero-ctas a')].map((a,i)=>i===0?`<strong><a href="${a.getAttribute('href')}">${clean(a.textContent)}</a></strong>`:`<a href="${a.getAttribute('href')}">${clean(a.textContent)}</a>`).join(' ');
  S.push({t:'service-hero',rows:[[`<ul>${crumbs}</ul>`],[`<h1>${h1}</h1>`],[lede?`<p>${inner(lede)}</p>`:''],[ctas?`<p>${ctas}</p>`:''],...(bg?[[`<img src="${bg}" alt="">`]]:[])]});
  // walk sections after hero
  document.querySelectorAll('main > section:not(.ds-hero), main > div.ds-section').forEach(sec=>{
    // rail layout
    const rail=sec.querySelector('aside');
    const proseEl=sec.querySelector('.ds-prose,.ds-qa,.ds-main');
    if(rail&&proseEl){
      const navUl=rail.querySelector('nav ul');
      const navLabel=clean(rail.querySelector('.ds-rail-label')?.textContent)||'In this section';
      const boxes=[...rail.querySelectorAll('.ds-rail-box')].map(box=>{
        const lbl=clean(box.querySelector('.ds-rail-label,p')?.textContent);
        const img=box.querySelector('img');const ul=box.querySelector('ul');
        const extraP=[...box.querySelectorAll('p')].slice(1).filter(p=>!p.querySelector('img')&&clean(p.textContent)!==lbl).map(p=>`<p>${inner(p)}</p>`).join('');
        return [`<p>${lbl}</p>${img?`<img src="${img.src}" alt="${img.alt||''}">`:''}${extraP}${ul?relify(ul.cloneNode(true)).outerHTML:''}`];
      });
      const addr=rail.querySelector('.ds-rail-address,address');
      const infoLbl=addr?clean(addr.closest('.ds-rail-info')?.querySelector('.ds-rail-label')?.textContent)||'More Information':'';
      // main col → ordered segments: prose runs vs nested component groups
      const segs=[];let buf=[];
      const flushBuf=()=>{if(!buf.length)return;const d=document.createElement('div');buf.forEach(n=>d.append(n.cloneNode(true)));relify(d);
        d.querySelectorAll('.ds-figure,figure,.ds-map-figure').forEach(f=>{const img=f.querySelector('img');const cap=f.querySelector('figcaption,.ds-figure-caption,em');
          const rep=document.createElement('div');rep.innerHTML=(cap?`<p><strong>${clean(cap.textContent)}</strong></p>`:'')+(img?`<p><img src="${img.src}" alt="${img.alt||''}"></p>`:'');f.replaceWith(...rep.children);});
        segs.push({kind:'prose',html:d.innerHTML.replace(/\sclass="[^"]*"/g,'').replace(/\sstyle="[^"]*"/g,'').trim()});buf=[];};
      const walk=(el)=>{[...el.children].forEach(ch=>{
        if(ch.matches('.ds-bio-cards')){flushBuf();segs.push({kind:'cards',rows:[...ch.querySelectorAll('.ds-bio-card')].map(c=>{const img=c.querySelector('img');const h3=clean(c.querySelector('h3')?.textContent);const role=clean(c.querySelector('.ds-role,em')?.textContent);const ps=[...c.querySelectorAll('p')].filter(pp=>clean(pp.textContent)!==role).map(pp=>`<p>${inner(pp)}</p>`).join('');return [(img?`<img src="${img.src}" alt="${img.alt||h3}">`:'')+`<h3>${h3}</h3>${role?`<p><em>${role}</em></p>`:''}${ps}`];})});}
        else if(ch.matches('.ds-svc-cards')){flushBuf();segs.push({kind:'svc-cards',rows:[...ch.querySelectorAll('.ds-svc-card')].map(c=>{const a=c.querySelector('a');return [a?`<a href="${a.getAttribute('href')}">${clean(a.textContent)}</a>`:clean(c.textContent)];})});}
        else if(ch.matches('.ds-cond-pills')){flushBuf();segs.push({kind:'pills',rows:[...ch.querySelectorAll('li')].map(li=>{const a=li.querySelector('a');return [a?`<a href="${a.getAttribute('href')}">${clean(a.textContent)}</a>`:clean(li.textContent)];})});}
        else if(ch.querySelector('.ds-svc-cards,.ds-cond-pills,.ds-bio-cards')){walk(ch);}
        else buf.push(ch);
      });};
      walk(proseEl);flushBuf();
      const first=segs[0]&&segs[0].kind==='prose'?segs.shift():{kind:'prose',html:''};
      S.push({t:'service-body',rows:[[`<p>${navLabel}</p>${navUl?relify(navUl.cloneNode(true)).outerHTML:''}`],[addr?`<p>${infoLbl}</p><p>${inner(addr)}</p>`:''],[first.html],...boxes]});
      segs.forEach(g=>{if(g.kind==='prose')S.push({t:null,pre:[g.html],rows:[]});else S.push({t:g.kind==='cards'?'cards':g.kind,rows:g.rows});});
      return;
    }
    // per-component
    const head=sec.querySelector(':scope .ds-section-head h2, :scope > .ds-wrap > h2, :scope .ds-center h2');
    let parts=[];
    if(head)parts.push(`<h2>${clean(head.textContent)}</h2>`);
    const headP=head?.parentElement?.querySelector('p');
    if(headP)parts.push(`<p>${inner(headP)}</p>`);
    // tabs
    const tablist=sec.querySelector('.ds-tablist');
    if(tablist){
      const btns=[...tablist.querySelectorAll('.ds-tab')].map(t=>clean(t.textContent));
      const panels=[...sec.querySelectorAll('.ds-tabpanel')];
      const rows=panels.map((p,i)=>{const cp=p.cloneNode(true);relify(cp);const h3=cp.querySelector('h3');if(h3)h3.remove();
        return [btns[i]||'',cp.innerHTML.replace(/\sclass="[^"]*"/g,'').replace(/\s(aria|role|id|hidden|loading|style)[^\s>]*(="[^"]*")?/g,'').trim()];});
      S.push({t:'tabs',pre:parts,rows});return;
    }
    // label cards / pills
    const svc=sec.querySelectorAll('.ds-svc-card .ds-svc-label, .ds-svc-card');
    const pills=sec.querySelectorAll('.ds-cond-pills li');
    if(svc.length){S.push({t:'svc-cards',pre:parts,rows:[...sec.querySelectorAll('.ds-svc-card')].map(c=>{const a=c.querySelector('a');const txt=clean(c.textContent);return [a?`<a href="${a.getAttribute('href')}">${clean(a.textContent)}</a>`:txt];})});return;}
    if(pills.length){S.push({t:'pills',pre:parts,rows:[...pills].map(li=>{const a=li.querySelector('a');return [a?`<a href="${a.getAttribute('href')}">${clean(a.textContent)}</a>`:clean(li.textContent)];})});return;}
    // bio cards
    const bios=sec.querySelectorAll('.ds-bio-card');
    if(bios.length){S.push({t:'cards',pre:parts,rows:[...bios].map(c=>{const img=c.querySelector('img');const h3=clean(c.querySelector('h3')?.textContent);const role=clean(c.querySelector('.ds-role,em,.ds-spec')?.textContent);const ps=[...c.querySelectorAll('p')].filter(p=>clean(p.textContent)!==role).map(p=>`<p>${inner(p)}</p>`).join('');
      return [(img?`<img src="${img.src}" alt="${img.alt||h3}">`:'')+`<h3>${h3}</h3>${role?`<p><em>${role}</em></p>`:''}${ps}`];})});return;}
    // media/gallery/logos/hub/story/prog cards
    const media=[...sec.querySelectorAll('.ds-media-card,.ds-hub-card,.ds-prog-card,.ds-story-card,[class*=gallery] img,[class*=partner-logos] img,[class*=logo] img')];
    if(media.length&&media[0].tagName==='IMG'){S.push({t:'cards media',pre:parts,rows:media.map(img=>[`<img src="${img.src}" alt="${img.alt||''}">`])});return;}
    if(media.length){S.push({t:'cards',pre:parts,rows:media.map(c=>{const img=c.querySelector('img');const h3=clean(c.querySelector('h3')?.textContent);const ps=[...c.querySelectorAll('p')].map(p=>`<p>${inner(p)}</p>`).join('');const a=c.querySelector('a.ds-link,a.ds-btn,a');
      return [(img?`<img src="${img.src}" alt="${img.alt||h3}">`:'')+(h3?`<h3>${h3}</h3>`:'')+ps+(a&&clean(a.textContent)?`<p><a href="${a.getAttribute('href')}">${clean(a.textContent)}</a></p>`:'')];})});return;}
    // splits (incl blue/story/tile)
    const split=sec.querySelector('.ds-split,.ds-split2,.ds-split3,.ds-tile,.ds-story-callout');
    if(split){const img=split.querySelector('img');const cp=split.cloneNode(true);relify(cp);cp.querySelectorAll('img').forEach(i=>i.remove());
      const variant=sec.className.includes('blue')||sec.classList.contains('ds-blue-band')?'split blue':(sec.className.includes('mint')||split.className.includes('story')||split.className.includes('tile')?'split story':'split');
      const btns=[...cp.querySelectorAll('a.ds-btn')];btns.forEach((a,i)=>{const p=document.createElement('p');p.innerHTML=i===0?`<strong><a href="${a.getAttribute('href')}">${clean(a.textContent)}</a></strong>`:`<a href="${a.getAttribute('href')}">${clean(a.textContent)}</a>`;a.replaceWith(p);});
      S.push({t:variant,pre:parts,rows:[[img?`<img src="${img.src}" alt="${img.alt||''}">`:''],[cp.innerHTML.replace(/\sclass="[^"]*"/g,'').replace(/\sstyle="[^"]*"/g,'').trim()]]});return;}
    // fallback: prose-only section → default content
    const body=sec.querySelector('.ds-wrap')||sec;const cp=body.cloneNode(true);relify(cp);
    S.push({t:null,pre:[cp.innerHTML.replace(/\sclass="[^"]*"/g,'').replace(/\sstyle="[^"]*"/g,'').trim()],rows:[]});
  });
  return {title,desc,S};
});
await b.close();
const cell=h=>`<div>${h}</div>`;
const block=(n,rows)=>`<div class="${n}">${rows.map(r=>`<div>${r.map(cell).join('')}</div>`).join('')}</div>`;
const section=(...p)=>`    <div>\n      ${p.filter(Boolean).join('\n      ')}\n    </div>`;
const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const out=[section(`<div class="metadata"><div><div>Title</div><div>${esc(data.title)}</div></div><div><div>Description</div><div>${esc(data.desc).slice(0,155)}</div></div></div>`)];
for(const s of data.S){
  if(!s.t){out.push(section(...s.pre));continue;}
  out.push(section(...(s.pre||[]),block(s.t,s.rows)));
}
fs.mkdirSync(OUT.replace(/\/[^/]+$/,''),{recursive:true});
fs.writeFileSync(OUT,`<body>\n  <header></header>\n  <main>\n${out.join('\n')}\n  </main>\n  <footer></footer>\n</body>\n`);
console.log(OUT.split('content')[1]+': '+data.S.map(s=>s.t||'(default)').join(', '));
