import {useMemo,useState} from 'react';
import {ClipboardCheck,Minus,Plus,Search,TriangleAlert} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {warehouseGroups} from '../data/constants';
import {PageHeader,Empty,ConfirmModal} from '../components/common';
import {fmt} from '../utils/helpers';

const normalizeDate=value=>{const text=String(value||'');if(/^\d{4}-\d{2}-\d{2}$/.test(text))return text;const match=text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);return match?`${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`:''};

export default function StockCountPage(){
  const {products,lots,adjustStock,setToast}=useApp();
  const [warehouse,setWarehouse]=useState(''),[search,setSearch]=useState(''),[productId,setProductId]=useState(''),[lotDate,setLotDate]=useState(''),[counted,setCounted]=useState(0),[reason,setReason]=useState('ตรวจนับสต็อกประจำรอบ'),[confirm,setConfirm]=useState(false);
  const matches=useMemo(()=>products.filter(product=>(!warehouse||product.warehouseGroup===warehouse)&&(product.id===productId||!search||`${product.productCode} ${product.productName}`.toLowerCase().includes(search.toLowerCase()))).slice(0,30),[products,warehouse,search,productId]);
  const product=products.find(item=>item.id===productId);
  const matchedLots=useMemo(()=>lots.filter(lot=>lot.productId===productId&&normalizeDate(lot.lotNo)===lotDate),[lots,productId,lotDate]);
  const systemQuantity=matchedLots.reduce((sum,lot)=>sum+(+lot.quantityRemaining||0),0),lotExists=matchedLots.length>0,difference=counted-systemQuantity;
  const chooseProduct=item=>{setProductId(item.id);setLotDate('');setCounted(0);setSearch(`${item.productCode} · ${item.productName}`)};
  const chooseWarehouse=value=>{setWarehouse(value);setProductId('');setSearch('');setLotDate('');setCounted(0)};
  const chooseDate=value=>{setLotDate(value);const existing=lots.filter(lot=>lot.productId===productId&&normalizeDate(lot.lotNo)===value);setCounted(existing.reduce((sum,lot)=>sum+(+lot.quantityRemaining||0),0))};
  const change=value=>setCounted(Math.max(0,+(value||0)));
  const submit=()=>{try{adjustStock(productId,lotDate,counted,reason.trim()||'ตรวจนับสต็อกสินค้า');setConfirm(false)}catch(error){setToast(error.message)}};
  return <>
    <PageHeader title="นับสต็อกสินค้า" subtitle="กรองคลัง ค้นหาสินค้า และบันทึกจำนวนตามวันที่ Lot ที่ตรวจนับจริง"/>
    <div className="stock-count-layout">
      <section className="card stock-count-search"><div className="card-title"><div><h2>1. เลือกคลังและค้นหาสินค้า</h2><p>ค้นหาด้วยชื่อหรือรหัสสินค้า</p></div><Search/></div><label className="stock-count-filter">คลังสินค้า<select value={warehouse} onChange={event=>chooseWarehouse(event.target.value)}><option value="">ทุกคลัง</option>{warehouseGroups.map(group=><option key={group.id} value={group.id}>{group.name}</option>)}</select></label><label className="search"><Search size={17}/><input value={search} onChange={event=>{setSearch(event.target.value);setProductId('');setLotDate('')}} placeholder="พิมพ์ชื่อหรือรหัสสินค้า"/></label><div className="stock-count-results">{matches.map(item=><button key={item.id} className={item.id===productId?'active':''} onClick={()=>chooseProduct(item)}><b>{item.productName}</b><span>{item.productCode} · {item.warehouseGroup} · คงเหลือ {fmt(item.currentStock)} {item.unit}</span></button>)}{!matches.length&&<Empty/>}</div></section>
      <section className="card stock-count-form"><div className="card-title"><div><h2>2. ระบุ Lot และจำนวนที่นับได้</h2><p>Lot ที่ไม่พบใน Stock ยังสามารถนับเข้าได้</p></div><ClipboardCheck/></div>{product?<><div className="count-product"><small>สินค้าที่เลือก</small><b>{product.productName}</b><span>{product.productCode} · {product.warehouseGroup} · {product.unit}</span></div><label>Lot (วันที่)<input type="date" value={lotDate} onChange={event=>chooseDate(event.target.value)}/></label>{lotDate&&!lotExists&&<div className="stock-count-warning"><TriangleAlert/><div><b>ไม่พบ Lot นี้ใน Stock</b><span>ยังสามารถระบุจำนวนและยืนยันเพื่อนับ Lot นี้เข้าระบบได้</span></div></div>}{lotDate&&lotExists&&<div className="lot-match"><b>พบ Lot ใน Stock {matchedLots.length} รายการ</b><span>ยอดคงเหลือรวม {fmt(systemQuantity)} {product.unit}</span></div>}{lotDate&&<><label>จำนวนที่นับได้จริง<div className="count-stepper"><button onClick={()=>change(counted-1)}><Minus/></button><input type="number" min="0" step="any" value={counted} onChange={event=>change(event.target.value)}/><button onClick={()=>change(counted+1)}><Plus/></button></div></label><div className={`count-difference ${difference===0?'same':difference>0?'plus':'minus'}`}><span>ผลต่างจากยอดในระบบ</span><b>{difference>0?'+':''}{fmt(difference)} {product.unit}</b></div><label>หมายเหตุ<input value={reason} onChange={event=>setReason(event.target.value)} placeholder="เหตุผลหรือรอบการตรวจนับ"/></label><button className="btn primary confirm-count" disabled={difference===0} onClick={()=>setConfirm(true)}><ClipboardCheck/> ยืนยันจำนวนที่นับได้</button></>}</>:<div className="stock-count-placeholder"><ClipboardCheck/><b>กรุณาเลือกสินค้า</b><span>เลือกคลังและสินค้าจากด้านซ้ายเพื่อเริ่มนับสต็อก</span></div>}</section>
    </div>
    {confirm&&<ConfirmModal title={lotExists?'ยืนยันปรับยอดจากการนับสต็อก':'ยืนยันนับ Lot ใหม่เข้าระบบ'} text={`Lot ${lotDate}: ยอดระบบ ${fmt(systemQuantity)} → นับได้ ${fmt(counted)} ${product?.unit} (ผลต่าง ${difference>0?'+':''}${fmt(difference)})`} onClose={()=>setConfirm(false)} onConfirm={submit}/>}
  </>;
}
