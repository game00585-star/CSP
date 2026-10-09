import {useState} from 'react';
import {Warehouse,Scale,Tags,TableProperties,Hash,DatabaseBackup,RotateCcw,Save,Users,Download} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {warehouseGroups,units} from '../data/constants';
import {PageHeader,ConfirmModal} from '../components/common';

const tabs=[['กลุ่มคลัง',Warehouse],['หน่วยสินค้า',Scale],['ประเภทการจ่าย',Tags],['หน้าตาตาราง',TableProperties],['เลขที่เอกสาร',Hash],['ผู้ใช้งาน',Users],['สำรองข้อมูล',DatabaseBackup]];
const backupKeys=['csp_products','csp_movements','csp_lots','csp_documents','csp_audit_logs','csp_stock_counts','csp_storage_locations','csp_warehouse_periods','csp_viewing_period','csp_opening_closures','csp_users','csp_transaction_drafts'];

export default function SettingsPage(){
  const [tab,setTab]=useState(0),[confirm,setConfirm]=useState(false),[error,setError]=useState('');
  const {reset,setToast}=useApp();
  const exportBackup=()=>{const data=Object.fromEntries(backupKeys.filter(key=>localStorage.getItem(key)!==null).map(key=>[key,JSON.parse(localStorage.getItem(key))]));const payload={app:'CSP Warehouse',version:1,exportedAt:new Date().toISOString(),data},url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`csp-warehouse-backup-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url);setToast('ดาวน์โหลดไฟล์สำรอง JSON แล้ว')};
  return <><PageHeader title="ตั้งค่าระบบ" subtitle="กำหนดค่าพื้นฐานและจัดการข้อมูลระบบ"/><div className="settings-layout"><div className="settings-tabs">{tabs.map(([name,Icon],index)=><button className={tab===index?'active':''} key={name} onClick={()=>{setTab(index);setError('')}}><Icon/>{name}</button>)}</div><div className="card settings-content"><h2>{tabs[tab][0]}</h2><p>จัดการค่าที่ใช้ร่วมกันภายในระบบ</p>{error&&<div className="alert">{error}</div>}
    {tab===0&&<div className="setting-list">{warehouseGroups.map((group,index)=><div key={group.id}><span className="order">{index+1}</span><div><b>{group.name}</b><small>รหัส: {group.id}</small></div><span className="badge green">ใช้งาน</span></div>)}</div>}
    {tab===1&&<div className="setting-list">{units.map((unit,index)=><div key={unit}><span className="order">{index+1}</span><b>{unit}</b><span className="badge green">ใช้งาน</span></div>)}</div>}
    {tab===2&&<div className="setting-list">{['ส่งให้สาขา','เบิกใช้งาน','คืน Supplier','สินค้าเสียหาย','ปรับปรุง Stock'].map((name,index)=><div key={name}><span className="order">{index+1}</span><b>{name}</b><span className="badge green">ใช้งาน</span></div>)}</div>}
    {tab===3&&<div className="form-grid"><label>จำนวนรายการต่อหน้า<select><option>10</option><option>20</option><option>50</option></select></label><label>ความหนาแน่นตาราง<select><option>ปกติ</option><option>กระชับ</option></select></label></div>}
    {tab===4&&<div className="form-grid"><label>รับสินค้า<input value="RCV" readOnly/></label><label>จ่ายสินค้า<input value="ISS" readOnly/></label><label>โอนสินค้า<input value="TRF" readOnly/></label><label>รูปแบบวันที่<input value="YYYYMMDD" readOnly/></label></div>}
    {tab===5&&<div className="backup-box"><Users/><h3>ผู้ดูแลระบบเดิม</h3><p>เข้าสู่ระบบด้วยชื่อผู้ใช้ admin และรหัสผ่านเดิมของระบบ ข้อมูลทำงานภายในเบราว์เซอร์นี้</p></div>}
    {tab===6&&<div className="backup-box"><DatabaseBackup/><h3>สำรองข้อมูลปัจจุบันเป็น JSON</h3><p>ข้อมูลหลักบันทึกอยู่ในเบราว์เซอร์นี้ ดาวน์โหลดไฟล์สำรองไว้ก่อนคืนค่าข้อมูลเดิมหรือย้ายเครื่อง</p><div className="actions backup-actions"><button className="btn primary" onClick={exportBackup}><Download/> ดาวน์โหลด Backup</button><button className="btn danger-btn" onClick={()=>setConfirm(true)}><RotateCcw/> คืนค่าข้อมูลเดิม</button></div></div>}
    {tab<5&&<button className="btn primary settings-save" onClick={()=>setToast('บันทึกการตั้งค่าแล้ว')}><Save/> บันทึกการตั้งค่า</button>}
  </div></div>{confirm&&<ConfirmModal title="คืนค่าข้อมูลเดิม" text="ข้อมูลที่แก้ไขในเบราว์เซอร์นี้จะถูกแทนที่ด้วยข้อมูลเริ่มต้นเดิม ต้องการดำเนินการหรือไม่" onClose={()=>setConfirm(false)} onConfirm={()=>{reset();setConfirm(false)}}/>}</>;
}
