/** cta-band — navy full-bleed band: heading + copy + CTAs (topo + wave signature). */
const WAVE=`<svg class="ds-wave-top" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path fill="#ffffff" d="M0,42 C170,86 350,8 560,26 C780,46 930,90 1130,66 C1275,47 1375,14 1440,30 L1440,0 L0,0 Z"/></svg>`;
export default function decorate(block){
  block.insertAdjacentHTML('afterbegin',WAVE);
  const wrap=document.createElement('div');wrap.className='ds-wrap cta-band-inner';
  [...block.children].forEach((row)=>{if(row.querySelector)[...(row.querySelector(':scope>div')||row).children].forEach((n)=>wrap.append(n));});
  block.querySelectorAll(':scope>div').forEach((d)=>{if(!d.classList.contains('cta-band-inner')&&d.tagName==='DIV')d.remove();});
  block.append(wrap);
}
