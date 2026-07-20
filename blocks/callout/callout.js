/** callout — centered grey band. Rows: [heading html],[note]. */
export default function decorate(block){
  const rows=[...block.children];
  const inner=document.createElement('aside');inner.className='callout-inner';
  if(rows[0]){const h=document.createElement('h2');h.innerHTML=(rows[0].querySelector(':scope>div')||rows[0]).innerHTML;inner.append(h);}
  rows.slice(1).forEach((r)=>{const c=(r.querySelector(':scope>div')||r);const d=document.createElement('div');d.className='callout-note';d.innerHTML=c.innerHTML;inner.append(d);});
  const wrap=document.createElement('div');wrap.className='ds-wrap';wrap.append(inner);block.replaceChildren(wrap);
}
