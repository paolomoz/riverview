/** stats — value|label row strip. Row = <p>value</p><p>label</p> (or one cell "value — label"). */
export default function decorate(block){
  const wrap=document.createElement('div');wrap.className='ds-wrap stats-grid';
  [...block.children].forEach((row)=>{
    const cells=[...row.querySelectorAll(':scope>div')];const it=document.createElement('div');it.className='stat';
    const v=document.createElement('div');v.className='stat-value';v.textContent=(cells[0]?.textContent||'').trim();
    const l=document.createElement('div');l.className='stat-label';l.textContent=(cells[1]?.textContent||'').trim();
    it.append(v,l);wrap.append(it);
  });
  block.replaceChildren(wrap);
}
