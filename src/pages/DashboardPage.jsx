import {useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {Warehouse,Boxes,PackageCheck,ArrowDownToLine,ArrowUpFromLine,ArrowRightLeft,TriangleAlert,PackageX,ArrowUpRight,CalendarClock,ShieldAlert} from 'lucide-react';
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer} from 'recharts';
import {useApp} from '../context/AppContext';
import {warehouseGroups,movementLabels} from '../data/constants';
import {fmt,stockStatus} from '../utils/helpers';
import {PageHeader,StatCard,StatusBadge,Empty} from '../components/common';

const chart=Array.from({length:15},(_,i)=>({day:`${i+1}/7`,รับเข้า:60+(i*17)%95,จ่ายออก:35+(i*23)%80}));
const dayMs=24*60*60*1000;
const validDate=(year,month,day)=>{const date=new Date(year,month-1,day);return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null};
const parseLotDate=value=>{const text=String(value||'').trim();let match=text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);if(match)return validDate(+match[1],+match[2],+match[3]);match=text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);return match?validDate(+match[3],+match[2],+match[1]):null};
const shelfLabel=days=>days<0?'หมดอายุแล้ว':days===0?'หมดอายุวันนี้':`เหลือ ${days} วัน`;

export default function DashboardPage(){
  const {products,movements,lots}=useApp(),nav=useNavigate();
  const today=new Date();today.setHours(0,0,0,0);
  const todayTime=today.getTime();
  const todayIso=today.toISOString().slice(0,10);
  const stats=useMemo(()=>({stock:products.reduce((a,p)=>a+p.currentStock,0),low:products.filter(p=>stockStatus(p)==='ใกล้หมด').length,out:products.filter(p=>p.currentStock===0).length,receive:movements.filter(m=>m.transactionDate===todayIso&&m.transactionType==='RECEIVE').reduce((a,m)=>a+m.quantityIn,0),issue:movements.filter(m=>m.transactionDate===todayIso&&m.transactionType==='ISSUE').reduce((a,m)=>a+m.quantityOut,0),transfer:movements.filter(m=>m.transactionDate===todayIso&&m.transactionType==='TRANSFER_OUT').reduce((a,m)=>a+m.quantityOut,0)}),[products,movements,todayIso]);
  const shelfLife=useMemo(()=>lots.filter(lot=>lot.quantityRemaining>0).map(lot=>{const expiry=parseLotDate(lot.lotNo);return expiry?{...lot,expiry,daysLeft:Math.ceil((expiry.getTime()-todayTime)/dayMs)}:null}).filter(Boolean).filter(lot=>lot.daysLeft<=3).sort((a,b)=>a.daysLeft-b.daysLeft),[lots,todayTime]);
  const expired=shelfLife.filter(lot=>lot.daysLeft<0).length,warning=shelfLife.filter(lot=>lot.daysLeft>=0).length;
  const cards=[[Warehouse,'กลุ่มคลังทั้งหมด',5,'คลัง','blue'],[Boxes,'สินค้าทั้งหมด',products.length,'รายการ','purple'],[PackageCheck,'Stock คงเหลือรวม',fmt(stats.stock),'หน่วย','green'],[ArrowDownToLine,'รับเข้าวันนี้',fmt(stats.receive),'หน่วย','green'],[ArrowUpFromLine,'จ่ายออกวันนี้',fmt(stats.issue),'หน่วย','orange'],[ArrowRightLeft,'โอนคลังวันนี้',fmt(stats.transfer),'หน่วย','purple'],[TriangleAlert,'สินค้าใกล้หมด',stats.low,'รายการ','orange'],[PackageX,'สินค้าหมด',stats.out,'รายการ','red']];

  return <>
    <PageHeader title="ภาพรวมคลังสินค้า" subtitle="ข้อมูลการดำเนินงานล่าสุดของ CSP Foods Supply"/>
    <div className="stats-grid">{cards.map(([Icon,label,value,unit,color])=><StatCard key={label} icon={Icon} label={label} value={value} unit={unit} color={color}/>)}</div>
    <section className={`shelf-alert ${expired?'critical':warning?'warning':'safe'}`}>
      <div className="shelf-alert-head"><div className="shelf-icon"><CalendarClock/></div><div><span className="eyebrow">SHELF LIFE CONTROL</span><h2>แจ้งเตือน Shelf Life ล่วงหน้า 3 วัน</h2><p>ตรวจจากวันที่ใน Lot และแสดงเฉพาะสินค้าที่ยังมียอดคงเหลือ</p></div><div className="shelf-counters"><span className="expired"><b>{expired}</b> หมดอายุ</span><span className="urgent"><b>{warning}</b> ต้องรีบจัดการ</span></div></div>
      <div className="shelf-table-wrap">{shelfLife.length?<table><thead><tr><th>ระดับ</th><th>สินค้า</th><th>คลัง</th><th>Lot / วันหมดอายุ</th><th>คงเหลือ</th><th>สถานะ Shelf Life</th><th></th></tr></thead><tbody>{shelfLife.slice(0,10).map(lot=><tr key={lot.id} className={lot.daysLeft<0?'expired-row':''}><td><span className={`shelf-pulse ${lot.daysLeft<0?'red':'amber'}`}/></td><td><b>{lot.productName}</b><small>{lot.productCode}</small></td><td>{lot.warehouseGroup}</td><td><b>{lot.lotNo}</b><small>วันที่ใน Lot</small></td><td><b>{fmt(lot.quantityRemaining)}</b> <small>{products.find(product=>product.id===lot.productId)?.unit||'หน่วย'}</small></td><td><span className={`shelf-status ${lot.daysLeft<0?'expired':'urgent'}`}><ShieldAlert/>{shelfLabel(lot.daysLeft)}</span></td><td><button className="shelf-action" onClick={()=>nav(`/stock-card?product=${lot.productId}`)}>ตรวจสอบ <ArrowUpRight/></button></td></tr>)}</tbody></table>:<div className="shelf-empty"><PackageCheck/><div><b>ไม่มีสินค้าใกล้หมดอายุ</b><span>ทุกรายการมี Shelf Life มากกว่า 3 วัน</span></div></div>}</div>
    </section>
    <div className="card chart-card"><div className="card-title"><div><h2>แนวโน้มการเคลื่อนไหวสินค้า</h2><p>รับเข้าและจ่ายออก 15 วันล่าสุด</p></div><span className="live-dot">● อัปเดตล่าสุด</span></div><ResponsiveContainer width="100%" height={280}><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day"/><YAxis/><Tooltip/><Legend/><Line type="monotone" dataKey="รับเข้า" stroke="#16a34a" strokeWidth={3}/><Line type="monotone" dataKey="จ่ายออก" stroke="#f97316" strokeWidth={3}/></LineChart></ResponsiveContainer></div>
    <div className="two-col"><div className="card"><div className="card-title"><h2>สรุปกลุ่มคลัง</h2></div><div className="table-wrap"><table><thead><tr><th>กลุ่มคลัง</th><th>สินค้า</th><th>Stock</th><th>สถานะ</th><th></th></tr></thead><tbody>{warehouseGroups.map(group=>{const groupProducts=products.filter(product=>product.warehouseGroup===group.id),out=groupProducts.filter(product=>product.currentStock===0).length;return <tr key={group.id}><td><b>{group.name}</b></td><td>{groupProducts.length}</td><td>{fmt(groupProducts.reduce((sum,product)=>sum+product.currentStock,0))}</td><td><StatusBadge status={out?'ใกล้หมด':'ปกติ'}/></td><td><button className="link-btn" onClick={()=>nav(`/warehouse/${group.path}`)}><ArrowUpRight/></button></td></tr>})}</tbody></table></div></div><div className="card"><div className="card-title"><h2>ความเคลื่อนไหวล่าสุด</h2></div><div className="movement-list">{movements.slice(0,7).map(movement=><div key={movement.id}><span className={`movement-dot ${movement.transactionType.toLowerCase()}`}/><div><b>{movement.productName}</b><small>{movement.documentNo} · {movement.warehouseGroup}</small></div><div className={movement.quantityIn?'qty-in':'qty-out'}>{movement.quantityIn?'+':'-'}{fmt(movement.quantityIn||movement.quantityOut)}<small>{movementLabels[movement.transactionType]}</small></div></div>)}{!movements.length&&<Empty/>}</div></div></div>
  </>;
}
