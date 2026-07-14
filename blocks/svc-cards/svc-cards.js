/** svc-cards — mint-diamond label card grid. Each row cell = one service/procedure label. */
export default function decorate(block){
  const grid=document.createElement('div');grid.className='svc-cards-grid';
  [...block.children].forEach((row)=>{const t=(row.textContent||'').trim();if(!t)return;const c=document.createElement('div');c.className='svc-card';c.innerHTML='<span class="svc-diamond" aria-hidden="true"></span><span>'+t+'</span>';grid.append(c);});
  const wrap=document.createElement('div');wrap.className='ds-wrap';wrap.append(grid);block.replaceChildren(wrap);
}
