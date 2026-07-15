/** tabs — accessible tab strip + panels. Row = one tab: [title][panel content].
 *  Native buttons w/ arrow-key nav; panel cell HTML (imgs/lists/links) preserved. */
export default function decorate(block){
  const rows=[...block.children].filter(r=>r.children.length>=2);
  const list=document.createElement('div');list.className='tabs-list';list.setAttribute('role','tablist');
  const panels=[];
  rows.forEach((row,i)=>{
    const title=(row.children[0].textContent||'').trim();
    const btn=document.createElement('button');btn.className='tabs-tab';btn.type='button';
    btn.setAttribute('role','tab');btn.id=`tab-${i}`;btn.setAttribute('aria-controls',`tabpanel-${i}`);
    btn.setAttribute('aria-selected',i===0);btn.tabIndex=i===0?0:-1;btn.textContent=title;
    const panel=document.createElement('div');panel.className='tabs-panel';panel.setAttribute('role','tabpanel');
    panel.id=`tabpanel-${i}`;panel.setAttribute('aria-labelledby',`tab-${i}`);panel.hidden=i!==0;
    const copy=document.createElement('div');copy.className='tabs-copy';
    const h=document.createElement('h3');h.textContent=title;copy.append(h);
    let media=null;
    [...row.children[1].children].forEach(n=>{
      if(n.matches('picture,img')||n.querySelector('picture,img')){if(!media){media=document.createElement('div');media.className='tabs-media';}media.append(n);}
      else copy.append(n);
    });
    if(media)panel.append(media);
    panel.append(copy);
    list.append(btn);panels.push(panel);
  });
  const wrap=document.createElement('div');wrap.className='ds-wrap';wrap.append(list,...panels);
  block.replaceChildren(wrap);
  const btns=[...list.querySelectorAll('.tabs-tab')];
  btns.forEach((t,i)=>{
    t.addEventListener('click',()=>{btns.forEach((o,j)=>{o.setAttribute('aria-selected',o===t);o.tabIndex=o===t?0:-1;panels[j].hidden=o!==t;});t.focus();});
    t.addEventListener('keydown',(e)=>{const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
      if(d){e.preventDefault();btns[(i+d+btns.length)%btns.length].click();}});
  });
}
