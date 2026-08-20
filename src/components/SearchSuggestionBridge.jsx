import {useEffect,useMemo} from 'react';
import {useApp} from '../context/AppContext';

const selector='input[type="text"], input:not([type])';

export default function SearchSuggestionBridge(){
  const {products}=useApp();
  const options=useMemo(()=>[...new Set(products.flatMap(product=>[product.productName,product.productCode]).filter(Boolean).map(String))].slice(0,500),[products]);

  useEffect(()=>{
    const attach=()=>document.querySelectorAll(selector).forEach(input=>{
      const hint=`${input.placeholder||''} ${input.getAttribute('aria-label')||''}`;
      const isSearch=/ค้นหา|Barcode|รหัส|สินค้า|เอกสาร|Lot/i.test(hint);
      if(isSearch){
        if(/Barcode|รหัส|ชื่อสินค้า/.test(input.placeholder||''))input.placeholder='พิมพ์ชื่อหรือรหัสสินค้า';
        if(input.placeholder==='เลข Lot'){
          input.type='date';
          const label=input.closest('label');
          if(label?.firstChild?.nodeType===Node.TEXT_NODE)label.firstChild.nodeValue='วันที่ Lot';
        }
        if(input.type!=='date'&&!input.list&&!input.closest('.product-search'))input.setAttribute('list','csp-global-search-options');
      }
    });
    attach();
    const observer=new MutationObserver(attach);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);

  return <datalist id="csp-global-search-options">{options.map(option=><option value={option} key={option}/>)}</datalist>;
}
