/** appointment — New Patient Appointment Request panel. Rows: [heading], [intro prose]...,
 *  then decorate renders a labeled non-submitting form + a placeholder ribbon. */
export default function decorate(block){
  const rows=[...block.children];const head=rows.shift();
  const panel=document.createElement('section');panel.className='appointment-panel';
  const h=document.createElement('h2');h.textContent=(head?.textContent||'New Patient Appointment Request').trim();
  panel.append(h);
  rows.filter(r=>r.children.length<2).forEach((r)=>{const t=(r.textContent||'').trim();if(t){const p=document.createElement('p');p.className='appointment-intro';p.innerHTML=r.firstElementChild?.innerHTML||t;panel.append(p);}});
  // David's Model: 2-cell rows = [label][type] field defs; 1-cell rows = intro/note paras (handled above)
  const fieldRows=rows.filter(r=>r.children.length>=2);
  const fields=fieldRows.length?fieldRows.map((r,i)=>{const l=(r.children[0].textContent||'').trim();const t=(r.children[1].textContent||'').trim()||'text';return [l,t,'f'+i];})
    :[['First name','text','fname'],['Last name','text','lname'],['Email','email','email'],['Phone','tel','phone'],['Preferred location','select','location'],['Reason for visit','text','reason']];
  const form=document.createElement('form');form.className='appointment-form';form.setAttribute('aria-label','New patient appointment request');
  form.addEventListener('submit',(e)=>e.preventDefault());
  fields.forEach(([label,type,name])=>{const w=document.createElement('div');w.className='appointment-field'+(name==='reason'?' appointment-field--wide':'');
    const id='appt-'+name;const l=document.createElement('label');l.setAttribute('for',id);l.textContent=label;
    let ctl;if(type.startsWith('select')){ctl=document.createElement('select');const opts=type.includes(':')?['- Select -',...type.slice(type.indexOf(':')+1).split('|')]:['- Select -'];opts.forEach((o,i)=>{const op=document.createElement('option');op.textContent=o.trim();if(i===0){op.disabled=true;op.selected=true;}ctl.append(op);});}
    else{ctl=document.createElement('input');ctl.type=type;}
    ctl.id=id;ctl.name=name;w.append(l,ctl);form.append(w);});
  const submit=document.createElement('button');submit.type='submit';submit.className='appointment-submit';submit.textContent=fieldRows.length?'Submit':'Request Appointment';
  form.append(submit);panel.append(form);
  const ribbon=document.createElement('p');ribbon.className='appointment-ribbon';ribbon.textContent='Form connects to the appointment system at launch.';
  panel.append(ribbon);
  const wrap=document.createElement('div');wrap.className='ds-wrap';wrap.append(panel);block.replaceChildren(wrap);
}
