/** cards — generic responsive card grid. Row = one card:
 *  [ optional <picture>/<img> ] , <h3>title</h3> + <p>body</p> [ + <a> link ]. */
export default function decorate(block){
  const wrap=document.createElement('div');wrap.className='ds-wrap';
  const grid=document.createElement('div');grid.className='cards-grid';
  [...block.children].forEach((row)=>{
    const cell=row.querySelector(':scope>div')||row;
    const card=document.createElement('article');card.className='card';
    const media=cell.querySelector('picture,img');
    if(media){const m=document.createElement('div');m.className='card-media';m.append(media.closest('picture')||media);card.append(m);}
    const body=document.createElement('div');body.className='card-body';
    const hasBlockKids=cell.querySelector('p,h1,h2,h3,h4,h5,h6,ul,ol,div');
    if(!hasBlockKids&&(cell.textContent||'').trim()){const p=document.createElement('p');p.innerHTML=cell.innerHTML;body.append(p);}
    else [...cell.children].forEach((n)=>{if(!n.matches('picture,img')&&!n.querySelector('picture,img'))body.append(n);});
    card.append(body);grid.append(card);
  });
  wrap.append(grid);block.replaceChildren(wrap);
}
