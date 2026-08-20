import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {CalendarDays,CheckCircle2,Eye,LockKeyhole,Plus,Trash2,TriangleAlert} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {PageHeader,ConfirmModal,Empty} from '../components/common';

const monthLabel=value=>{if(!value)return '—';const [year,month]=value.split('-');return new Date(+year,+month-1,1).toLocaleDateString('th-TH',{month:'long',year:'numeric'})};

export default function WarehousePeriodsPage(){
  const {warehousePeriods,activePeriod,createWarehousePeriod,closeWarehousePeriod,removeWarehousePeriod,viewWarehousePeriod,setToast}=useApp();
  const navigate=useNavigate();
  const [month,setMonth]=useState(new Date().toISOString().slice(0,7)),[closing,setClosing]=useState(null),[deleting,setDeleting]=useState(null);
  const create=()=>{try{createWarehousePeriod(month);navigate('/dashboard')}catch(error){setToast(error.message)}};
  return <>
    <PageHeader title="รอบเดือนคลัง" subtitle="เปิดรอบเดือนก่อนรับเข้า จ่ายออก โอน และนับสต็อก"/>
    {activePeriod?<section className="period-current card"><div className="period-icon"><CalendarDays/></div><div><small>รอบเดือนที่กำลังใช้งาน</small><h2>{monthLabel(activePeriod.month)}</h2><p>รายการคลังทั้งหมดต้องลงวันที่ภายในเดือน {activePeriod.month}</p></div><span className="period-open"><CheckCircle2/> เปิดใช้งาน</span><button className="btn danger-btn" onClick={()=>setClosing(activePeriod)}><LockKeyhole/> ปิดรอบเดือน</button></section>:<section className="period-create card"><div className="period-icon"><Plus/></div><div><h2>สร้างรอบเดือนคลัง</h2><p>เมื่อสร้างแล้ว เดือนนี้จะถูกใช้กับรายการคลังทั้งหมดจนกว่าจะปิดรอบ</p></div><label>เดือนที่ต้องการเปิด<input type="month" value={month} onChange={event=>setMonth(event.target.value)}/></label><button className="btn primary" onClick={create}><CalendarDays/> สร้างและเปิดใช้งาน</button></section>}
    {!activePeriod&&<div className="period-warning"><TriangleAlert/><span><b>ยังไม่มีรอบเดือนที่เปิดใช้งาน</b> ระบบจะไม่อนุญาตให้รับเข้า จ่ายออก โอน หรือนับสต็อกจนกว่าจะสร้างรอบเดือน</span></div>}
    <section className="card period-history"><div className="card-title"><h2>ประวัติรอบเดือน</h2></div><div className="table-wrap"><table><thead><tr><th>เดือน</th><th>สถานะ</th><th>เปิดโดย</th><th>วันที่เปิด</th><th>ปิดโดย</th><th>วันที่ปิด</th><th>จัดการ</th></tr></thead><tbody>{warehousePeriods.map(period=><tr key={period.id} className={period.status==='CLOSED'?'period-history-row':''} onDoubleClick={()=>{if(period.status==='CLOSED'){viewWarehousePeriod(period.id);navigate('/dashboard')}}}><td><b>{monthLabel(period.month)}</b><small>{period.month}</small></td><td><span className={`period-status ${period.status.toLowerCase()}`}>{period.status==='OPEN'?'เปิดใช้งาน':'ปิดรอบแล้ว'}</span></td><td>{period.openedBy}</td><td>{new Date(period.openedAt).toLocaleString('th-TH')}</td><td>{period.closedBy||'—'}</td><td>{period.closedAt?new Date(period.closedAt).toLocaleString('th-TH'):'—'}</td><td><div className="period-actions">{period.status==='CLOSED'&&<button className="period-view-btn" onClick={()=>{try{viewWarehousePeriod(period.id);navigate('/dashboard')}catch(error){setToast(error.message)}}}><Eye/> ดูย้อนหลัง</button>}<button className="icon-btn danger" disabled={period.status==='OPEN'} onClick={()=>setDeleting(period)} title={period.status==='OPEN'?'ต้องปิดรอบก่อนลบ':'ลบรอบเดือน'}><Trash2/></button></div></td></tr>)}</tbody></table>{!warehousePeriods.length&&<Empty/>}</div></section>
    {closing&&<ConfirmModal title="ยืนยันปิดรอบเดือน" text={`เมื่อปิด ${monthLabel(closing.month)} แล้ว จะเพิ่มรายการในเดือนนี้ไม่ได้ และต้องสร้างเดือนถัดไปใหม่`} onClose={()=>setClosing(null)} onConfirm={()=>{try{closeWarehousePeriod(closing.id);setClosing(null)}catch(error){setToast(error.message)}}}/>} 
    {deleting&&<ConfirmModal title="ยืนยันลบรอบเดือน" text={`ต้องการลบ ${monthLabel(deleting.month)} ออกจากประวัติหรือไม่? การดำเนินการนี้ย้อนกลับไม่ได้`} onClose={()=>setDeleting(null)} onConfirm={()=>{try{removeWarehousePeriod(deleting.id);setDeleting(null)}catch(error){setToast(error.message)}}}/>}
  </>;
}
