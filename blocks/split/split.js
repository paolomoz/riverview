/** split — two-column media + copy. Row1 cell = <picture>/<img>; Row2 cell = heading+prose+CTAs. */
export default function decorate(block){
  const rows=[...block.children];const wrap=document.createElement('div');wrap.className='ds-wrap split-grid';
  const media=block.querySelector('picture,img');
  const mediaCol=document.createElement('div');mediaCol.className='split-media';
  if(media)mediaCol.append(media.closest('picture')||media);
  const copy=document.createElement('div');copy.className='split-copy';
  rows.forEach((r)=>{const c=r.querySelector(':scope>div')||r;[...c.children].forEach((n)=>{if(!n.matches('picture,img')&&!n.querySelector('picture,img'))copy.append(n);});});
  wrap.append(mediaCol,copy);block.replaceChildren(wrap);
}
