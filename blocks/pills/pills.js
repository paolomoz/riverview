/** pills — mint-wash pill cluster. Each row cell = one label (condition/symptom). */
export default function decorate(block){
  const ul=document.createElement('ul');ul.className='pills-list';
  [...block.children].forEach((row)=>{const t=(row.textContent||'').trim();if(t){const li=document.createElement('li');li.textContent=t;ul.append(li);}});
  const wrap=document.createElement('div');wrap.className='ds-wrap';wrap.append(ul);block.replaceChildren(wrap);
}
