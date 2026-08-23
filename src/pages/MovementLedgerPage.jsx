import {useMemo,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {ArrowLeftRight,CalendarDays} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {warehouseGroups} from '../data/constants';
import {fmt} from '../utils/helpers';
import {Empty,ExportButton,PageHeader,Toolbar} from '../components/common';
import './warehouseExcel.css';

const thaiDate=value=>value?new Date(`${value}T00:00:00`).toLocaleDateString('th-TH'):'—';

export default function MovementLedgerPage(){
  const {group}=useParams(),nav=useNavigate(),{openingClosures,movements,activePeriod,viewingPeriod}=useApp();
  const [search,setSearch]=useState('');
  const warehouse=warehouseGroups.find(item=>item.path===group)||warehouseGroups[0],periodMonth=(activePeriod||viewingPeriod)?.month;
  const closure=openingClosures.filter(item=>item.warehouseGroup===warehouse.id&&(!periodMonth||item.periodMonth===periodMonth)).sort((a,b)=>String(b.closedAt).localeCompare(String(a.closedAt)))[0];
  const rows=useMemo(()=>{
    if(!closure)return[];
    return closure.rows.map(row=>{
      const afterClose=movements.filter(item=>item.productId===row.productId&&item.warehouseGroup===warehouse.id&&String(item.createdAt||'')>closure.closedAt&&item.transactionType!=='OPENING_BALANCE');
      const incoming=afterClose.reduce((sum,item)=>sum+Number(item.quantityIn||0),0),outgoing=afterClose.reduce((sum,item)=>sum+Number(item.quantityOut||0),0);
      return{...row,incoming,outgoing,netBalance:Number(row.openingBalance||0)+incoming-outgoing};
    }).filter(row=>!search||`${row.productCode} ${row.productName}`.toLowerCase().includes(search.toLowerCase()));
  },[closure,movements,search,warehouse.id]);
  return <div className="movement-ledger-page">
    <PageHeader title={`รายการเคลื่อนไหว · ${warehouse.name}`} subtitle="ติดตามยอดยกมา รับเข้า จ่ายออก และจำนวนสินค้าคงเหลือสุทธิ" actions={<ExportButton rows={rows} name={`CSP-movement-ledger-${warehouse.path}`}/>}/>
    {closure?<div className="ledger-opening-banner"><div><CalendarDays/><span><small>ยอดยกมา ณ วันที่</small><b>{thaiDate(closure.openingDate)}</b></span></div><div><small>จบยอดโดย</small><b>{closure.closedBy}</b></div><div><small>จำนวนรายการ</small><b>{closure.rows.length} รายการ</b></div></div>:<div className="card ledger-not-ready"><ArrowLeftRight/><h3>ยังไม่ได้จบยอดยกมาของคลัง {warehouse.name}</h3><p>กรุณาตรวจสอบและอนุมัติรายการแก้ไขให้ครบ แล้วกด “จบยอดยกมา” ก่อน</p><button className="btn primary" onClick={()=>nav(`/warehouse/${warehouse.path}`)}>ไปที่ยอดยกมา</button></div>}
    {closure&&<div className="card"><Toolbar search={search} setSearch={setSearch}><button className="btn ghost" onClick={()=>setSearch('')}>ล้างตัวกรอง</button></Toolbar><div className="table-wrap movement-ledger-table"><table><thead><tr><th>ลำดับ</th><th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>ยอดยกมา</th><th>IN</th><th>OUT</th><th>จำนวนสินค้าคงเหลือสุทธิ</th><th>หน่วย</th></tr></thead><tbody>{rows.map(row=><tr key={row.productId}><td>{row.sequence}</td><td><b>{row.productCode}</b></td><td>{row.productName}</td><td className="num">{fmt(row.openingBalance)}</td><td className="ledger-in">{fmt(row.incoming)}</td><td className="ledger-out">{fmt(row.outgoing)}</td><td className="ledger-net">{fmt(row.netBalance)}</td><td>{row.unit||'—'}</td></tr>)}</tbody></table>{!rows.length&&<Empty/>}</div></div>}
  </div>;
}
