/** callout — centered grey band. Rows: [heading html],[note]. */
export default function decorate(block){
  const rows=[...block.children];
  const inner=document.createElement('div');inner.className='callout-inner';
  if(rows[0]){const h=document.createElement('h2');h.innerHTML=(rows[0].querySelector(':scope>div')||rows[0]).innerHTML;inner.append(h);}
  if(rows[1]){const p=document.createElement('p');p.className='callout-note';p.innerHTML=(rows[1].querySelector(':scope>div')||rows[1]).innerHTML;inner.append(p);}
  const wrap=document.createElement('div');wrap.className='ds-wrap';wrap.append(inner);block.replaceChildren(wrap);
}
