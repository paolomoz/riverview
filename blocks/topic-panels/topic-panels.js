/** topic-panels — bordered narrative panels. Each row = one panel (heading cell + body cell). */
export default function decorate(block){
  const grid=document.createElement('div');grid.className='topic-panels-grid';
  [...block.children].forEach((row,i)=>{const cells=[...row.children];const head=cells[0];const body=cells[1]||cells[0];
    const panel=document.createElement('article');panel.className='topic-panel'+((i%2===1)?' topic-panel--wash':'');
    const h=document.createElement('h3');h.textContent=(head?.textContent||'').trim();
    const b=document.createElement('div');b.className='topic-panel-body';b.innerHTML=(cells.length>1?body:head)?.innerHTML||'';
    if(cells.length===1)b.innerHTML='';panel.append(h,b);grid.append(panel);});
  const wrap=document.createElement('div');wrap.className='ds-wrap';wrap.append(grid);block.replaceChildren(wrap);
}
