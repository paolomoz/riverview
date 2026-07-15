/** people — provider card grid. Row = one person: [img][name (may be a link)][specialty]. */
export default function decorate(block){
  const grid=document.createElement('div');grid.className='people-grid';
  [...block.children].forEach((row)=>{
    const cells=[...row.children];if(cells.length<2)return;
    const img=cells[0].querySelector('img');
    const nameEl=cells[1];const a=nameEl.querySelector('a');
    const spec=(cells[2]?.textContent||'').trim();
    const card=document.createElement('article');card.className='person';
    if(img)card.append(img);
    const body=document.createElement('div');body.className='person-body';
    const h=document.createElement('h3');
    if(a)h.append(a);else h.textContent=(nameEl.textContent||'').trim();
    body.append(h);
    if(spec){const s=document.createElement('span');s.className='person-spec';s.textContent=spec;body.append(s);}
    if(cells[3]&&(cells[3].textContent||'').trim()){const m=document.createElement('div');m.className='person-meta';m.innerHTML=cells[3].innerHTML;body.append(m);}
    if(a){const v=document.createElement('a');v.className='person-link';v.href=a.getAttribute('href');v.textContent='View details';body.append(v);}
    if(cells[4]&&cells[4].querySelector('a')){const act=document.createElement('div');act.className='person-actions';act.innerHTML=cells[4].innerHTML;body.append(act);}
    card.append(body);grid.append(card);
  });
  const wrap=document.createElement('div');wrap.className='ds-wrap';wrap.append(grid);block.replaceChildren(wrap);
}
