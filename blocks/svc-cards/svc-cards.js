/** svc-cards — mint-diamond label card grid. Each row cell = one service/procedure label. */
export default function decorate(block){
  const grid=document.createElement('ul');grid.className='svc-cards-grid';
  [...block.children].forEach((row)=>{const cell=row.firstElementChild||row;const inner=(cell.innerHTML||'').trim();if(!(cell.textContent||'').trim())return;const c=document.createElement('li');c.className='svc-card';c.innerHTML='<span class="svc-diamond" aria-hidden="true"></span><span class="svc-label">'+inner+'</span>';grid.append(c);});
  const wrap=document.createElement('div');wrap.className='ds-wrap';wrap.append(grid);block.replaceChildren(wrap);
}
