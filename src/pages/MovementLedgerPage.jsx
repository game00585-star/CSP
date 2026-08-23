import {useMemo,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {ArrowLeftRight,CalendarDays} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {warehouseGroups} from '../data/constants';
import {fmt} from '../utils/helpers';
import {Empty,ExportButton,PageHeader,Toolbar} from '../components/common';
import './warehouseExcel.css';

const thaiDate=value=>value?new Date(`${value}T00:00:00`).toLocaleDateString('th-TH'):'—';
const sourceSchemas={
  PK:['ลำดับ','รหัสสินค้า','ยอดยกมา','ชื่อสินค้า','กก./กระสอบ','จำนวนสินค้าคงเหลือ','หน่วย','จำนวนกระสอบ/ลัง','กลุ่มสินค้า','Remark','วันผลิต','วันหมดอายุ','วันหมดอายุที่เหลือ\n(UP DATE )','IN','OUT','MIN','MAX','Comment'],
  IN:['ลำดับ','รหัสสินค้า','ยอดยกมา','ชื่อสินค้า','กก./กระสอบ/ลัง/ถุง','จำนวนสินค้าคงเหลือ','หน่วย','จำนวนกระสอบ/ลัง','กลุ่มสินค้า','Allergen/Non Allergen','Remark','sheif life','LOT วันที่รับเข้า','วันผลิต','วันหมดอายุ','วันหมดอายุที่เหลือ\n(UP DATE )','IN','OUT','MIN','MAX','Comment']
};
const valueOrDash=value=>value===undefined||value===null||value===''?'—':value;
const sourceField=(product,column)=>{const index=sourceSchemas[product?.warehouseGroup]?.indexOf(column)??-1;return index>=0?product?.excelRow?.[index]:undefined};

export default function MovementLedgerPage(){
  const {group}=useParams(),nav=useNavigate(),{openingClosures,movements,products,activePeriod,viewingPeriod}=useApp();
  const [search,setSearch]=useState('');
  const warehouse=warehouseGroups.find(item=>item.path===group)||warehouseGroups[0],periodMonth=(activePeriod||viewingPeriod)?.month;
  const closure=openingClosures.filter(item=>item.warehouseGroup===warehouse.id&&(!periodMonth||item.periodMonth===periodMonth)).sort((a,b)=>String(b.closedAt).localeCompare(String(a.closedAt)))[0];
  const rows=useMemo(()=>{
    if(!closure)return[];
    return closure.rows.map(row=>{
      const product=products.find(item=>item.id===row.productId)||{};
      const afterClose=movements.filter(item=>item.productId===row.productId&&item.warehouseGroup===warehouse.id&&String(item.createdAt||'')>closure.closedAt&&item.transactionType!=='OPENING_BALANCE');
      const incoming=afterClose.reduce((sum,item)=>sum+Number(item.quantityIn||0),0),outgoing=afterClose.reduce((sum,item)=>sum+Number(item.quantityOut||0),0);
      return{...row,
        productCategory:valueOrDash(row.productCategory??sourceField(product,'กลุ่มสินค้า')??product.productCategory),
        remark:valueOrDash(row.remark??sourceField(product,'Remark')??product.note),
        productionDate:valueOrDash(row.productionDate??sourceField(product,'วันผลิต')??product.productionDate),
        expiryDate:valueOrDash(row.expiryDate??sourceField(product,'วันหมดอายุ')??product.expiryDate),
        expiryRemaining:valueOrDash(row.expiryRemaining??sourceField(product,'วันหมดอายุที่เหลือ\n(UP DATE )')??product.expiryRemaining),
        minStock:valueOrDash(row.minStock??sourceField(product,'MIN')??product.minStock),
        maxStock:valueOrDash(row.maxStock??sourceField(product,'MAX')??product.maxStock),
        comment:valueOrDash(row.comment??sourceField(product,'Comment')??product.comment),
        unit:row.unit||product.unit||'—',incoming,outgoing,netBalance:Number(row.openingBalance||0)+incoming-outgoing};
    }).filter(row=>!search||`${row.productCode} ${row.productName}`.toLowerCase().includes(search.toLowerCase()));
  },[closure,movements,products,search,warehouse.id]);
  const exportRows=rows.map(row=>({'ลำดับ':row.sequence,'รหัสสินค้า':row.productCode,'ชื่อสินค้า':row.productName,'ยอดยกมา':row.openingBalance,'กลุ่มสินค้า':row.productCategory,'Remark':row.remark,'วันผลิต':row.productionDate,'วันหมดอายุ':row.expiryDate,'วันหมดอายุที่เหลือ (UP DATE)':row.expiryRemaining,'IN':row.incoming,'OUT':row.outgoing,'MIN':row.minStock,'MAX':row.maxStock,'Comment':row.comment,'จำนวนสินค้าคงเหลือสุทธิ':row.netBalance,'หน่วย':row.unit}));
  return <div className="movement-ledger-page">
    <PageHeader title={`รายการเคลื่อนไหว · ${warehouse.name}`} subtitle="ติดตามยอดยกมา รับเข้า จ่ายออก และจำนวนสินค้าคงเหลือสุทธิ" actions={<ExportButton rows={exportRows} name={`CSP-movement-ledger-${warehouse.path}`}/>}/>
    {closure?<div className="ledger-opening-banner"><div><CalendarDays/><span><small>ยอดยกมา ณ วันที่</small><b>{thaiDate(closure.openingDate)}</b></span></div><div><small>จบยอดโดย</small><b>{closure.closedBy}</b></div><div><small>จำนวนรายการ</small><b>{closure.rows.length} รายการ</b></div></div>:<div className="card ledger-not-ready"><ArrowLeftRight/><h3>ยังไม่ได้จบยอดยกมาของคลัง {warehouse.name}</h3><p>กรุณาตรวจสอบและอนุมัติรายการแก้ไขให้ครบ แล้วกด “จบยอดยกมา” ก่อน</p><button className="btn primary" onClick={()=>nav(`/warehouse/${warehouse.path}`)}>ไปที่ยอดยกมา</button></div>}
    {closure&&<div className="card"><Toolbar search={search} setSearch={setSearch}><button className="btn ghost" onClick={()=>setSearch('')}>ล้างตัวกรอง</button></Toolbar><div className="table-wrap movement-ledger-table"><table><thead><tr><th>ลำดับ</th><th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>ยอดยกมา</th><th>กลุ่มสินค้า</th><th>Remark</th><th>วันผลิต</th><th>วันหมดอายุ</th><th>วันหมดอายุที่เหลือ<br/>(UP DATE)</th><th>IN</th><th>OUT</th><th>MIN</th><th>MAX</th><th>Comment</th><th>จำนวนสินค้าคงเหลือสุทธิ</th><th>หน่วย</th></tr></thead><tbody>{rows.map(row=><tr key={row.productId}><td>{row.sequence}</td><td><b>{row.productCode}</b></td><td>{row.productName}</td><td className="num">{fmt(row.openingBalance)}</td><td>{row.productCategory}</td><td>{row.remark}</td><td>{row.productionDate}</td><td>{row.expiryDate}</td><td>{row.expiryRemaining}</td><td className="ledger-in">{fmt(row.incoming)}</td><td className="ledger-out">{fmt(row.outgoing)}</td><td className="num">{row.minStock}</td><td className="num">{row.maxStock}</td><td>{row.comment}</td><td className="ledger-net">{fmt(row.netBalance)}</td><td>{row.unit}</td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div></div>}
  </div>;
}
