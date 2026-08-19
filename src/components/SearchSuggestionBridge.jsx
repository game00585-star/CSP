import {useEffect,useMemo} from 'react';
import {useApp} from '../context/AppContext';

const selector='input[type="text"], input:not([type])';

export default function SearchSuggestionBridge(){
  const {products,movements,lots,auditLogs}=useApp();
  const options=useMemo(()=>[...new Set([
    ...products.flatMap(product=>[product.barcode,product.productCode,product.productName,`${product.productCode} · ${product.productName}`]),
    ...movements.flatMap(movement=>[movement.documentNo,movement.productCode,movement.productName,movement.lotNo]),
    ...lots.flatMap(lot=>[lot.lotNo,`${lot.lotNo} · ${lot.productName}`]),
    ...auditLogs.flatMap(log=>[log.documentNo,log.productCode,log.productName,log.reason,log.requestedBy]),
  ].filter(Boolean).map(String))].slice(0,500),[products,movements,lots,auditLogs]);

  useEffect(()=>{
    const attach=()=>document.querySelectorAll(selector).forEach(input=>{
      const hint=`${input.placeholder||''} ${input.getAttribute('aria-label')||''}`;
      const isSearch=/ค้นหา|Barcode|รหัส|สินค้า|เอกสาร|Lot/i.test(hint);
      if(isSearch&&!input.list&&!input.closest('.product-search'))input.setAttribute('list','csp-global-search-options');
    });
    attach();
    const observer=new MutationObserver(attach);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);

  return <datalist id="csp-global-search-options">{options.map(option=><option value={option} key={option}/>)}</datalist>;
}
