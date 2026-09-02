import {useEffect} from 'react';

const pageSizes=[10,20,50,100];

export default function AutoTablePagination(){
  useEffect(()=>{
    const cleanups=[];
    const enhance=table=>{
      if(table.dataset.autoPagination||table.closest('.print-document'))return;
      const card=table.closest('.card');
      if(card&&[...card.children].some(child=>child.classList?.contains('pagination')))return;
      const body=table.tBodies[0],wrap=table.closest('.table-wrap');
      if(!body||!wrap)return;
      table.dataset.autoPagination='true';
      let page=1,size=10;
      const footer=document.createElement('div');footer.className='pagination auto-table-pagination';
      const total=document.createElement('span'),controls=document.createElement('div'),label=document.createElement('label');label.className='page-size-label';label.append('แถวต่อหน้า');
      const select=document.createElement('select');select.setAttribute('aria-label','จำนวนแถวต่อหน้า');pageSizes.forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option)});label.append(select);
      const previous=document.createElement('button'),position=document.createElement('span'),next=document.createElement('button');previous.type=next.type='button';previous.textContent='‹';next.textContent='›';previous.setAttribute('aria-label','หน้าก่อน');next.setAttribute('aria-label','หน้าถัดไป');controls.append(label,previous,position,next);footer.append(total,controls);wrap.insertAdjacentElement('afterend',footer);
      const render=()=>{const rows=[...body.rows],pages=Math.max(1,Math.ceil(rows.length/size));page=Math.min(page,pages);rows.forEach((row,index)=>{row.hidden=index<(page-1)*size||index>=page*size});total.textContent=`ทั้งหมด ${rows.length} รายการ`;position.textContent=`${page} / ${pages}`;previous.disabled=page===1;next.disabled=page===pages};
      select.addEventListener('change',()=>{size=Number(select.value);page=1;render()});previous.addEventListener('click',()=>{page=Math.max(1,page-1);render()});next.addEventListener('click',()=>{page+=1;render()});
      const rowObserver=new MutationObserver(render);rowObserver.observe(body,{childList:true});render();cleanups.push(()=>{rowObserver.disconnect();footer.remove();delete table.dataset.autoPagination});
    };
    const scan=()=>document.querySelectorAll('main table').forEach(enhance);scan();
    const main=document.querySelector('main'),observer=new MutationObserver(scan);observer.observe(main||document.body,{childList:true,subtree:true});
    return()=>{observer.disconnect();cleanups.forEach(cleanup=>cleanup())};
  },[]);
  return null;
}
