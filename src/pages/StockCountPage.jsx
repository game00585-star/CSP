import {useMemo,useState} from 'react';
import {ClipboardCheck,LockKeyhole,Minus,Plus,Search,UnlockKeyhole} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {PageHeader,Empty,ConfirmModal} from '../components/common';
import {fmt} from '../utils/helpers';

export default function StockCountPage(){
  const {products,lots,storageLocations,adjustStock,setToast}=useApp();
  const [search,setSearch]=useState(''),[productId,setProductId]=useState(''),[lotId,setLotId]=useState(''),[lotDate,setLotDate]=useState(''),[locationId,setLocationId]=useState(''),[locked,setLocked]=useState(false),[counted,setCounted]=useState(0),[reason,setReason]=useState('ตรวจนับสต็อกประจำรอบ'),[confirm,setConfirm]=useState(false);
  const matches=useMemo(()=>products.filter(product=>product.id===productId||!search||`${product.productCode} ${product.productName}`.toLowerCase().includes(search.toLowerCase())).slice(0,20),[products,search,productId]);
  const product=products.find(item=>item.id===productId);
  const productLots=useMemo(()=>lots.filter(lot=>lot.productId===productId),[lots,productId]);
  const mapLocations=useMemo(()=>storageLocations.filter(location=>location.active!==false&&location.warehouseGroup===product?.warehouseGroup),[storageLocations,product]);
  const selectedLot=productLots.find(lot=>lot.id===lotId);
  const normalizedDate=value=>{const text=String(value||'');if(/^\d{4}-\d{2}-\d{2}$/.test(text))return text;const match=text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);return match?`${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`:''};
  const findLot=(date,location)=>productLots.find(lot=>normalizedDate(lot.lotNo)===date&&lot.locationId===location);
  const syncLot=(date,location)=>{const lot=findLot(date,location);setLotId(lot?.id||'');setCounted(+lot?.quantityRemaining||0)};
  const chooseProduct=item=>{if(locked)return;setProductId(item.id);setLotId('');setLotDate('');setLocationId('');setCounted(0);setSearch(`${item.productCode} · ${item.productName}`)};
  const chooseDate=value=>{if(locked)return;setLotDate(value);syncLot(value,locationId)};
  const chooseLocation=value=>{if(locked)return;setLocationId(value);syncLot(lotDate,value)};
  const toggleLock=()=>{if(!lotDate){setToast('กรุณาเลือกวันที่ Lot จากปฏิทิน');return}if(!locationId){setToast('กรุณาเลือกจุดจัดเก็บจากแผนที่คลัง');return}if(!lotId){setToast('ไม่พบ Lot ของสินค้านี้ในวันที่และจุดจัดเก็บที่เลือก');return}setLocked(value=>!value)};
  const change=count=>setCounted(Math.max(0,+(count||0)));
  const submit=()=>{try{adjustStock(lotId,counted,reason.trim()||'ตรวจนับสต็อกสินค้า');setConfirm(false)}catch(error){setToast(error.message)}};
  const difference=counted-(+selectedLot?.quantityRemaining||0);
  return <>
    <PageHeader title="นับสต็อกสินค้า" subtitle="ค้นหาสินค้า ล็อก Lot และบันทึกจำนวนที่ตรวจนับได้จริง"/>
    <div className="stock-count-layout">
      <section className="card stock-count-search"><div className="card-title"><div><h2>1. ค้นหาสินค้า</h2><p>ค้นหาด้วยชื่อหรือรหัสสินค้า</p></div><Search/></div><label className="search"><Search size={17}/><input value={search} onChange={event=>{if(!locked){setSearch(event.target.value);setProductId('');setLotId('')}}} disabled={locked} placeholder="พิมพ์ชื่อหรือรหัสสินค้า"/></label><div className="stock-count-results">{matches.map(item=><button key={item.id} className={item.id===productId?'active':''} onClick={()=>chooseProduct(item)} disabled={locked}><b>{item.productName}</b><span>{item.productCode} · {item.warehouseGroup} · คงเหลือ {fmt(item.currentStock)} {item.unit}</span></button>)}{!matches.length&&<Empty/>}</div></section>
      <section className="card stock-count-form"><div className="card-title"><div><h2>2. เลือกและล็อก Lot</h2><p>เลือกวันที่จากปฏิทินและจุดจัดเก็บตามแผนที่คลัง</p></div>{locked?<LockKeyhole/>:<UnlockKeyhole/>}</div>{product?<><div className="count-product"><small>สินค้าที่เลือก</small><b>{product.productName}</b><span>{product.productCode} · {product.warehouseGroup} · {product.unit}</span></div><div className="stock-count-lot-grid"><label>Lot (วันที่)<input type="date" value={lotDate} onChange={event=>chooseDate(event.target.value)} disabled={locked}/></label><label>จุดจัดเก็บจากแผนที่<select value={locationId} onChange={event=>chooseLocation(event.target.value)} disabled={locked}><option value="">— เลือกจุดจัดเก็บ —</option>{mapLocations.map(location=><option key={location.id} value={location.id}>{location.name} · ลิมิต {fmt(location.capacity)} {location.unit}</option>)}</select></label></div>{lotDate&&locationId&&!selectedLot&&<div className="alert">ไม่พบ Lot วันที่ {lotDate} ที่จุดจัดเก็บนี้ กรุณาตรวจสอบวันที่หรือเลือกจุดจัดเก็บใหม่</div>}{selectedLot&&!locked&&<div className="lot-match"><b>พบ Lot ที่เลือก</b><span>{selectedLot.lotNo} · {selectedLot.locationName} · คงเหลือ {fmt(selectedLot.quantityRemaining)} {product.unit}</span></div>}<button className={`btn ${locked?'secondary':'primary'} lock-lot-btn`} onClick={toggleLock}>{locked?<><UnlockKeyhole/> เปลี่ยน Lot / จุดจัดเก็บ</>:<><LockKeyhole/> ล็อก Lot นี้</>}</button>{locked&&selectedLot&&<><div className="locked-lot"><LockKeyhole/><div><b>ล็อก Lot: {selectedLot.lotNo}</b><span>{selectedLot.locationName||'ไม่ระบุจุดเก็บ'} · ยอดระบบ {fmt(selectedLot.quantityRemaining)} {product.unit}</span></div></div><label>จำนวนที่นับได้จริง<div className="count-stepper"><button onClick={()=>change(counted-1)}><Minus/></button><input type="number" min="0" step="any" value={counted} onChange={event=>change(event.target.value)}/><button onClick={()=>change(counted+1)}><Plus/></button></div></label><div className={`count-difference ${difference===0?'same':difference>0?'plus':'minus'}`}><span>ผลต่างจากระบบ</span><b>{difference>0?'+':''}{fmt(difference)} {product.unit}</b></div><label>หมายเหตุ<input value={reason} onChange={event=>setReason(event.target.value)} placeholder="เหตุผลหรือรอบการตรวจนับ"/></label><button className="btn primary confirm-count" disabled={difference===0} onClick={()=>setConfirm(true)}><ClipboardCheck/> ยืนยันจำนวนที่นับได้</button></>}</>:<div className="stock-count-placeholder"><ClipboardCheck/><b>กรุณาเลือกสินค้า</b><span>เลือกรายการจากช่องค้นหาด้านซ้ายเพื่อเริ่มนับสต็อก</span></div>}</section>
    </div>
    {confirm&&<ConfirmModal title="ยืนยันปรับยอดจากการนับสต็อก" text={`Lot ${selectedLot?.lotNo}: ยอดระบบ ${fmt(selectedLot?.quantityRemaining)} → นับได้ ${fmt(counted)} ${product?.unit} (ผลต่าง ${difference>0?'+':''}${fmt(difference)})`} onClose={()=>setConfirm(false)} onConfirm={submit}/>} 
  </>;
}
