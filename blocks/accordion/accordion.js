/** accordion — FAQ / disclosure list. Row = one Q/A: [question cell][answer cell].
 *  Renders native <details>/<summary> (a11y + no-JS safe). */
export default function decorate(block){
  const list=document.createElement('div');list.className='accordion-list';
  [...block.children].forEach((row)=>{
    const cells=[...row.children];if(!cells.length)return;
    const q=(cells[0].textContent||'').trim();
    const a=cells[1]?cells[1].innerHTML:'';
    if(!q)return;
    const d=document.createElement('details');
    const s=document.createElement('summary');s.textContent=q;
    const body=document.createElement('div');body.className='accordion-body';body.innerHTML=a;
    d.append(s,body);list.append(d);
  });
  const wrap=document.createElement('div');wrap.className='ds-wrap';wrap.append(list);
  block.replaceChildren(wrap);
}
