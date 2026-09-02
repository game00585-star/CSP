import {useEffect,useMemo,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {ArrowDownToLine,ArrowUpFromLine,ArrowRightLeft,PackageCheck,Search,Trash2} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {warehouseGroups,movementLabels} from '../data/constants';
import {fmt,stockStatus} from '../utils/helpers';
import {PageHeader,StatCard,ExportButton,StatusBadge,Empty,ConfirmModal} from '../components/common';

const normalizeLotDate=value=>{const text=String(value||'').trim();if(/^\d{4}-\d{2}-\d{2}$/.test(text))return text;const match=text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);return match?`${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`:''};

export default function StockCardPage(){
  const {products,movements,lots,removeStockCardLots}=useApp(),[params]=useSearchParams();
  const mapLocation=params.get('location')||'',mapProduct=params.get('product')||'',mapGroup=params.get('group')||'';
  const [product,setProduct]=useState(mapProduct),[productSearch,setProductSearch]=useState(mapLocation),[lotSearch,setLotSearch]=useState(''),[group,setGroup]=useState(mapGroup),[type,setType]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState('');
  const [selectedLots,setSelectedLots]=useState([]),[confirmDelete,setConfirmDelete]=useState(false);
  useEffect(()=>{setProduct(mapProduct);setProductSearch(mapLocation);setGroup(mapGroup);setSelectedLots([])},[mapLocation,mapProduct,mapGroup]);
  const filteredProducts=useMemo(()=>products.filter(item=>{
    if(group&&item.warehouseGroup!==group)return false;
    if(!productSearch)return true;
    const term=productSearch.toLowerCase(),matchesProduct=`${item.productName} ${item.productCode} ${item.barcode}`.toLowerCase().includes(term);
    const matchesLocation=lots.some(lot=>lot.productId===item.id&&Number(lot.quantityRemaining)>0&&String(lot.locationName||'').toLowerCase().includes(term));
    return matchesProduct||matchesLocation;
  }),[products,lots,productSearch,group]);
  const selected=products.find(item=>item.id===product);
  const list=useMemo(()=>movements.filter(movement=>(!product||movement.productId===product)&&(!productSearch||`${movement.productName} ${movement.productCode} ${movement.barcode} ${movement.locationName}`.toLowerCase().includes(productSearch.toLowerCase()))&&(!lotSearch||normalizeLotDate(movement.lotNo)===lotSearch)&&(!group||movement.warehouseGroup===group)&&(!type||movement.transactionType===type)&&(!from||movement.transactionDate>=from)&&(!to||movement.transactionDate<=to)),[movements,product,productSearch,lotSearch,group,type,from,to]);
  const lotList=useMemo(()=>lots.filter(lot=>Number(lot.quantityRemaining)>0&&(!product||lot.productId===product)&&(!productSearch||`${lot.productName} ${lot.productCode} ${lot.barcode} ${lot.locationName}`.toLowerCase().includes(productSearch.toLowerCase()))&&(!lotSearch||normalizeLotDate(lot.lotNo)===lotSearch)&&(!group||lot.warehouseGroup===group)).sort((a,b)=>a.receivedDate.localeCompare(b.receivedDate)),[lots,product,productSearch,lotSearch,group]);
  const totals={in:list.reduce((sum,movement)=>sum+movement.quantityIn,0),out:list.reduce((sum,movement)=>sum+movement.quantityOut,0),tin:list.filter(movement=>movement.transactionType==='TRANSFER_IN').reduce((sum,movement)=>sum+movement.quantityIn,0),tout:list.filter(movement=>movement.transactionType==='TRANSFER_OUT').reduce((sum,movement)=>sum+movement.quantityOut,0)};
  const filteredStock=lotList.reduce((sum,lot)=>sum+Number(lot.quantityRemaining||0),0),hasStockFilter=Boolean(product||productSearch||lotSearch||group);
  const visibleSelected=selectedLots.filter(id=>lotList.some(lot=>lot.id===id)),allLotsSelected=lotList.length>0&&lotList.every(lot=>selectedLots.includes(lot.id));
  const toggleAllLots=()=>setSelectedLots(allLotsSelected?selectedLots.filter(id=>!lotList.some(lot=>lot.id===id)):[...new Set([...selectedLots,...lotList.map(lot=>lot.id)])]);
  const toggleLot=id=>setSelectedLots(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  const deleteSelectedLots=()=>{removeStockCardLots(visibleSelected);setSelectedLots(current=>current.filter(id=>!visibleSelected.includes(id)));setConfirmDelete(false)};
  const clear=()=>{setProduct('');setProductSearch('');setLotSearch('');setGroup('');setType('');setFrom('');setTo('');setSelectedLots([])};
  return <>
    <PageHeader title="Stock Card" subtitle="ตรวจสอบวันที่รับ วันที่จ่าย และยอดคงเหลือแยกตาม Lot" actions={<ExportButton rows={list.map(movement=>({...movement,transactionType:movementLabels[movement.transactionType]}))} name="CSP-stock-card"/>}/>
    <div className="card filters"><label>ค้นหาสินค้า / จุดเก็บ<div className="filter-search"><Search/><input value={productSearch} onChange={event=>{setProductSearch(event.target.value);setProduct('')}} placeholder="รหัสสินค้า ชื่อสินค้า หรือจุดเก็บ"/></div></label><label>ค้นหา Lot (วันที่)<input type="date" value={lotSearch} onChange={event=>setLotSearch(event.target.value)}/></label><label>สินค้า<select value={product} onChange={event=>setProduct(event.target.value)}><option value="">ทุกสินค้า ({filteredProducts.length})</option>{filteredProducts.map(item=><option value={item.id} key={item.id}>{item.productCode} · {item.productName} · {item.warehouseGroup}</option>)}</select></label><label>กลุ่มคลัง<select value={group} onChange={event=>setGroup(event.target.value)}><option value="">ทุกคลัง</option>{warehouseGroups.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>ประเภท<select value={type} onChange={event=>setType(event.target.value)}><option value="">ทุกประเภท</option>{Object.entries(movementLabels).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label><label>วันที่เริ่มต้น<input type="date" value={from} onChange={event=>setFrom(event.target.value)}/></label><label>วันที่สิ้นสุด<input type="date" value={to} onChange={event=>setTo(event.target.value)}/></label><button className="btn ghost" onClick={clear}>ล้างค่า</button></div>
    {selected&&<div className="product-banner"><div><small>{selected.barcode} · {selected.productCode}</small><h2>{selected.productName}</h2><span>{selected.warehouseGroup} · {selected.unit}</span></div><div><small>Stock ตามตัวกรอง</small><b>{fmt(filteredStock)}</b><StatusBadge status={stockStatus({...selected,currentStock:filteredStock})}/></div></div>}
    <div className="stats-grid compact"><StatCard icon={PackageCheck} label={productSearch?`Stock ที่ ${productSearch}`:'Stock ปัจจุบัน'} value={fmt(hasStockFilter?filteredStock:products.reduce((sum,item)=>sum+item.currentStock,0))} unit={selected?.unit||'หลายหน่วย'}/><StatCard icon={ArrowDownToLine} label="รับเข้ารวม" value={fmt(totals.in)} unit={selected?.unit||'หลายหน่วย'} color="green"/><StatCard icon={ArrowUpFromLine} label="จ่ายออกรวม" value={fmt(totals.out)} unit={selected?.unit||'หลายหน่วย'} color="orange"/><StatCard icon={ArrowRightLeft} label="โอนเข้า / ออก" value={`${fmt(totals.tin)} / ${fmt(totals.tout)}`} unit={selected?.unit||'หลายหน่วย'} color="purple"/></div>
    <div className="card"><div className="card-title"><h2>Lot คงเหลือ</h2><div className="stock-card-lot-actions">{visibleSelected.length>0&&<button className="btn danger-btn" onClick={()=>setConfirmDelete(true)}><Trash2/> ลบที่เลือก ({visibleSelected.length})</button>}<ExportButton rows={lotList} name="CSP-lot-balance"/></div></div><div className="table-wrap"><table><thead><tr><th><input type="checkbox" checked={allLotsSelected} onChange={toggleAllLots} aria-label="เลือก Lot ทั้งหมดตามตัวกรอง"/></th><th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>จุดเก็บ</th><th>คลัง</th><th>Lot</th><th>วันที่รับ</th><th>หน่วย</th><th>รับทั้งหมด</th><th>คงเหลือ Lot</th><th>จัดการ</th></tr></thead><tbody>{lotList.map(lot=><tr key={lot.id} className={selectedLots.includes(lot.id)?'selected-row':''}><td><input type="checkbox" checked={selectedLots.includes(lot.id)} onChange={()=>toggleLot(lot.id)} aria-label={`เลือก Lot ${lot.lotNo} ${lot.productName}`}/></td><td><b>{lot.productCode}</b><small>{lot.barcode}</small></td><td>{lot.productName}</td><td>{lot.locationName||'ไม่ระบุจุดเก็บ'}</td><td>{lot.warehouseGroup}</td><td><b>{lot.lotNo}</b></td><td>{lot.receivedDate}</td><td>{products.find(item=>item.id===lot.productId)?.unit||'—'}</td><td>{fmt(lot.quantityReceived)}</td><td><b>{fmt(lot.quantityRemaining)}</b></td><td><button className="icon-btn danger" title="ลบ Lot นี้" onClick={()=>{setSelectedLots([lot.id]);setConfirmDelete(true)}}><Trash2/></button></td></tr>)}</tbody></table>{!lotList.length&&<Empty/>}</div></div>
    {confirmDelete&&(
      <ConfirmModal
        title={`ลบรายการ Stock Card ${visibleSelected.length} รายการ`}
        text={`ยืนยันลบ Lot ที่เลือก ${visibleSelected.length} รายการหรือไม่? ระบบจะหักยอดคงเหลือของสินค้า บันทึกรายการปรับออก และเก็บประวัติไว้ใน Audit Log การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onClose={()=>setConfirmDelete(false)}
        onConfirm={deleteSelectedLots}
      />
    )}
  </>;
}
