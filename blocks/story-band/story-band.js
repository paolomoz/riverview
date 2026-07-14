/** story-band — navy patient-story band. Rows: [heading],[quote],[cta link]. */
export default function decorate(block){
  const rows=[...block.children];
  const inner=document.createElement('div');inner.className='story-band-inner';
  const [head,quote,cta]=rows;
  if(head){const h=document.createElement('h2');h.textContent=(head.textContent||'').trim();inner.append(h);}
  if(quote){const q=document.createElement('blockquote');q.textContent=(quote.textContent||'').trim();inner.append(q);}
  if(cta){const a=cta.querySelector('a');if(a){const grp=document.createElement('p');grp.className='btn-group';a.className='btn btn-primary';grp.append(a);inner.append(grp);}}
  const wave='<svg class="story-wave-top" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path fill="#ffffff" d="M0,42 C170,86 350,8 560,26 C780,46 930,90 1130,66 C1275,47 1375,14 1440,30 L1440,0 L0,0 Z"/></svg>';
  const wrap=document.createElement('div');wrap.className='ds-wrap';wrap.append(inner);
  block.insertAdjacentHTML('afterbegin',wave);block.append(wrap);
  [...block.children].forEach(c=>{if(c!==wrap&&!c.classList?.contains('story-wave-top'))c.remove();});
}
