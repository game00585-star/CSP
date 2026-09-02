import {useEffect,useMemo,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {ArrowLeftRight,Boxes,CalendarDays,MapPinned,PackageCheck,PackageX,TriangleAlert} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {warehouseGroups} from '../data/constants';
import {fmt} from '../utils/helpers';
import {Empty,ExportButton,PageHeader,Pagination,StatCard,Toolbar} from '../components/common';
import './warehouseExcel.css';

const thaiDate=value=>value?new Date(`${value}T00:00:00`).toLocaleDateString('th-TH'):'—';
const sourceSchemas={
  PK:['ลำดับ','รหัสสินค้า','ยอดยกมา','ชื่อสินค้า','กก./กระสอบ','จำนวนสินค้าคงเหลือ','หน่วย','จำนวนกระสอบ/ลัง','กลุ่มสินค้า','Remark','วันผลิต','วันหมดอายุ','วันหมดอายุที่เหลือ\n(UP DATE )','IN','OUT','MIN','MAX','Comment'],
  IN:['ลำดับ','รหัสสินค้า','ยอดยกมา','ชื่อสินค้า','กก./กระสอบ/ลัง/ถุง','จำนวนสินค้าคงเหลือ','หน่วย','จำนวนกระสอบ/ลัง','กลุ่มสินค้า','Allergen/Non Allergen','Remark','sheif life','LOT วันที่รับเข้า','วันผลิต','วันหมดอายุ','วันหมดอายุที่เหลือ\n(UP DATE )','IN','OUT','MIN','MAX','Comment']
};
const valueOrDash=value=>value===undefined||value===null||value===''?'—':value;
const sourceField=(product,column)=>{const index=sourceSchemas[product?.warehouseGroup]?.indexOf(column)??-1;return index>=0?product?.excelRow?.[index]:undefined};
const tableColumns=['ลำดับ','รหัสสินค้า','ยอดยกมา','ชื่อสินค้า','กก./กระสอบ','จำนวนสินค้าคงเหลือ','หน่วย','จำนวนกระสอบ/ลัง','IN','OUT','กลุ่มสินค้า','แผนที่จุดเก็บ'];
const webTransactionTypes=new Set(['RECEIVE','ISSUE','TRANSFER_IN','TRANSFER_OUT']);
const readHeaderNames=()=>{try{return JSON.parse(localStorage.getItem('csp_warehouse_table_headers'))||{}}catch{return{}}};
const divisorOf=value=>{const match=String(value??'').replaceAll(',','').match(/\d+(?:\.\d+)?/);return Number(match?.[0]||0)};

export default function MovementLedgerPage(){
  const {group}=useParams(),nav=useNavigate(),{openingClosures,movements,products,lots,activePeriod,viewingPeriod}=useApp();
  const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[unit,setUnit]=useState(''),[page,setPage]=useState(1),[size,setSize]=useState(10),[selected,setSelected]=useState([]);
  const [headerNames]=useState(readHeaderNames);
  const warehouse=warehouseGroups.find(item=>item.path===group)||warehouseGroups[0],periodMonth=(activePeriod||viewingPeriod)?.month;
  const closure=openingClosures.filter(item=>item.warehouseGroup===warehouse.id&&(!periodMonth||item.periodMonth===periodMonth)).sort((a,b)=>String(b.closedAt).localeCompare(String(a.closedAt)))[0];
  const allRows=useMemo(()=>{
    if(!closure)return[];
    return closure.rows.map(row=>{
      const product=products.find(item=>item.id===row.productId)||{},currentWarehouse=product.warehouseGroup||warehouse.id;
      const locationMap=new Map();
      lots.filter(lot=>lot.productId===row.productId&&lot.warehouseGroup===currentWarehouse&&Number(lot.quantityRemaining)>0).forEach(lot=>{const key=lot.locationId||lot.locationName||'unassigned',current=locationMap.get(key)||{id:lot.locationId||'',name:lot.locationName||'ยังไม่ระบุจุดจัดเก็บ',quantity:0};current.quantity+=Number(lot.quantityRemaining||0);locationMap.set(key,current)});
      const locations=[...locationMap.values()];
      if(!locations.length&&(product.defaultLocationName||row.locationName))locations.push({id:product.defaultLocationId||row.locationId||'',name:product.defaultLocationName||row.locationName,quantity:Number(row.openingBalance||0)});
      const afterClose=movements.filter(item=>{
        const samePeriod=closure.periodId&&item.periodId?item.periodId===closure.periodId:String(item.periodMonth||item.transactionDate||'').startsWith(closure.periodMonth);
        return item.productId===row.productId&&item.warehouseGroup===currentWarehouse&&samePeriod&&String(item.createdAt||'')>closure.closedAt&&webTransactionTypes.has(item.transactionType);
      });
      const incoming=afterClose.reduce((sum,item)=>sum+Number(item.quantityIn||0),0),outgoing=afterClose.reduce((sum,item)=>sum+Number(item.quantityOut||0),0);
      const netBalance=Number(row.openingBalance||0)+incoming-outgoing;
      const packSize=sourceField(product,'กก./กระสอบ')??sourceField(product,'กก./กระสอบ/ลัง/ถุง')??product.packSize??'—',packDivisor=divisorOf(packSize);
      return{...row,
        productCategory:valueOrDash(row.productCategory??sourceField(product,'กลุ่มสินค้า')??product.productCategory),
        remark:valueOrDash(row.remark??sourceField(product,'Remark')??product.note),
        productionDate:valueOrDash(row.productionDate??sourceField(product,'วันผลิต')??product.productionDate),
        expiryDate:valueOrDash(row.expiryDate??sourceField(product,'วันหมดอายุ')??product.expiryDate),
        expiryRemaining:valueOrDash(row.expiryRemaining??sourceField(product,'วันหมดอายุที่เหลือ\n(UP DATE )')??product.expiryRemaining),
        minStock:valueOrDash(row.minStock??sourceField(product,'MIN')??product.minStock),
        maxStock:valueOrDash(row.maxStock??sourceField(product,'MAX')??product.maxStock),
        comment:valueOrDash(row.comment??sourceField(product,'Comment')??product.comment),
        warehouseGroup:currentWarehouse,locations,locationSummary:locations.map(location=>`${location.name} (${fmt(location.quantity)} ${row.unit||product.unit||'หน่วย'})`).join(', ')||'ยังไม่ระบุจุดจัดเก็บ',packSize,packCount:packDivisor>0?netBalance/packDivisor:null,unit:row.unit||product.unit||'—',incoming,outgoing,netBalance};
    });
  },[closure,movements,products,lots,warehouse.id]);
  const statusOf=row=>Number(row.netBalance)<=0?'หมด':Number(row.netBalance)<=Number(row.minStock||0)?'ใกล้หมด':'ปกติ';
  const rows=useMemo(()=>allRows.filter(row=>(!search||`${row.productCode} ${row.productName}`.toLowerCase().includes(search.toLowerCase()))&&(!status||statusOf(row)===status)&&(!unit||row.unit===unit)),[allRows,search,status,unit]);
  const units=useMemo(()=>[...new Set(allRows.map(row=>row.unit).filter(value=>value&&value!=='—'))],[allRows]);
  const stats=useMemo(()=>({stock:allRows.reduce((sum,row)=>sum+Number(row.netBalance||0),0),low:allRows.filter(row=>statusOf(row)==='ใกล้หมด').length,out:allRows.filter(row=>statusOf(row)==='หมด').length}),[allRows]);
  useEffect(()=>{setPage(current=>Math.min(current,Math.max(1,Math.ceil(rows.length/size))))},[rows.length,size]);
  const selectedRows=selected.filter(id=>rows.some(row=>row.productId===id)),allSelected=rows.length>0&&rows.every(row=>selected.includes(row.productId));
  const toggleAll=()=>setSelected(allSelected?[]:rows.map(row=>row.productId));
  const openMoveSelection=()=>{sessionStorage.setItem('csp_map_product_selection',JSON.stringify(selectedRows));nav(`/warehouse-map/${warehouse.path}?assign=1`)};
  const displayHeader=(column,index)=>column==='ยอดยกมา'?'ยอดยกมา':column==='จำนวนสินค้าคงเหลือ'?'จำนวนสินค้าคงเหลือสุทธิ':column==='แผนที่จุดเก็บ'?'แผนที่จุดเก็บ':headerNames[warehouse.id]?.length===tableColumns.length?headerNames[warehouse.id][index]||column:column;
  const rowValue=(row,column)=>{
    if(column==='ลำดับ')return row.sequence;
    if(column==='รหัสสินค้า')return row.productCode;
    if(column==='ยอดยกมา')return row.openingBalance;
    if(column==='ชื่อสินค้า')return row.productName;
    if(column==='กก./กระสอบ')return row.packSize;
    if(column==='จำนวนสินค้าคงเหลือ')return row.netBalance;
    if(column==='หน่วย')return row.unit;
    if(column==='จำนวนกระสอบ/ลัง')return row.packCount==null?'—':row.packCount;
    if(column==='IN')return row.incoming;
    if(column==='OUT')return row.outgoing;
    if(column==='กลุ่มสินค้า')return row.productCategory;
    if(column==='แผนที่จุดเก็บ')return row.locationSummary;
    return '—';
  };
  const displayValue=(row,column)=>{const value=rowValue(row,column);return['ยอดยกมา','จำนวนสินค้าคงเหลือ','จำนวนกระสอบ/ลัง','IN','OUT'].includes(column)&&value!=='—'?fmt(value):value};
  const exportRows=rows.map(row=>Object.fromEntries(tableColumns.map((column,index)=>[displayHeader(column,index),rowValue(row,column)])));
  const pageRows=rows.slice((page-1)*size,page*size);
  return <div className="movement-ledger-page warehouse-page-expanded">
    <PageHeader title={`รายการเคลื่อนไหว · ${warehouse.name}`} subtitle="ติดตามยอดยกมา รับเข้า จ่ายออก และจำนวนสินค้าคงเหลือสุทธิ" actions={<ExportButton rows={exportRows} name={`CSP-movement-ledger-${warehouse.path}`}/>}/>
    {closure?<div className="ledger-opening-banner"><div><CalendarDays/><span><small>ยอดยกมา ณ วันที่</small><b>{thaiDate(closure.openingDate)}</b></span></div><div><small>จบยอดโดย</small><b>{closure.closedBy}</b></div><div><small>จำนวนรายการ</small><b>{closure.rows.length} รายการ</b></div></div>:<div className="card ledger-not-ready"><ArrowLeftRight/><h3>ยังไม่ได้จบยอดยกมาของคลัง {warehouse.name}</h3><p>กรุณาตรวจสอบและอนุมัติรายการแก้ไขให้ครบ แล้วกด “จบยอดยกมา” ก่อน</p><button className="btn primary" onClick={()=>nav(`/warehouse/${warehouse.path}`)}>ไปที่ยอดยกมา</button></div>}
    {closure&&<><div className="stats-grid compact"><StatCard icon={Boxes} label="จำนวนรายการ" value={allRows.length} unit="สินค้า"/><StatCard icon={PackageCheck} label="Stock คงเหลือ" value={fmt(stats.stock)} unit="หน่วย" color="green"/><StatCard icon={TriangleAlert} label="ใกล้หมด" value={stats.low} unit="รายการ" color="orange"/><StatCard icon={PackageX} label="หมด" value={stats.out} unit="รายการ" color="red"/></div><div className="card"><Toolbar search={search} setSearch={value=>{setSearch(value);setPage(1)}}><select value={status} onChange={event=>{setStatus(event.target.value);setPage(1)}}><option value="">ทุกสถานะ</option><option>ปกติ</option><option>ใกล้หมด</option><option>หมด</option></select><select value={unit} onChange={event=>{setUnit(event.target.value);setPage(1)}}><option value="">ทุกหน่วย</option>{units.map(item=><option key={item}>{item}</option>)}</select><button className="btn ghost" onClick={()=>{setSearch('');setStatus('');setUnit('');setPage(1)}}>ล้างตัวกรอง</button>{selectedRows.length>0&&<button className="btn primary" onClick={openMoveSelection}><MapPinned/> ย้ายสินค้า ({selectedRows.length})</button>}<ExportButton rows={exportRows} name={`CSP-movement-ledger-${warehouse.path}`}/></Toolbar><div className="table-wrap movement-ledger-table opening-balance-table"><table><thead><tr><th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="เลือกสินค้าทั้งหมด"/></th>{tableColumns.map((column,index)=><th key={column}>{displayHeader(column,index)}</th>)}</tr></thead><tbody>{pageRows.map((row,rowIndex)=><tr key={row.productId} className={selected.includes(row.productId)?'selected-row':''}><td><input type="checkbox" checked={selected.includes(row.productId)} onChange={()=>setSelected(current=>current.includes(row.productId)?current.filter(id=>id!==row.productId):[...current,row.productId])} aria-label={`เลือก ${row.productName}`}/></td>{tableColumns.map(column=><td key={column} className={column==='IN'?'ledger-in':column==='OUT'?'ledger-out':column==='จำนวนสินค้าคงเหลือ'?'ledger-net':['ยอดยกมา','กก./กระสอบ','จำนวนกระสอบ/ลัง'].includes(column)?'num':''}>{column==='ลำดับ'?(page-1)*size+rowIndex+1:column==='แผนที่จุดเก็บ'?<div className="ledger-location-list">{row.locations.length?row.locations.map(location=><button key={location.id||location.name} onClick={()=>nav(`/stock-card?group=${encodeURIComponent(row.warehouseGroup)}&location=${encodeURIComponent(location.name)}&product=${encodeURIComponent(row.productId)}`)}><b>{location.name}</b><span>{fmt(location.quantity)} {row.unit}</span></button>):<span>ยังไม่ระบุจุดจัดเก็บ</span>}</div>:displayValue(row,column)}</td>)}</tr>)}</tbody></table>{!rows.length&&<Empty/>}</div><Pagination page={page} setPage={setPage} total={rows.length} size={size} setSize={setSize}/></div></>}
  </div>;
}
