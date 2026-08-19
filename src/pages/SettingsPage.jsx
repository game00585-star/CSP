import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Warehouse,Scale,Tags,TableProperties,Hash,DatabaseBackup,RotateCcw,Save,MapPinned,ArrowUpRight} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {warehouseGroups,units} from '../data/constants';
import {PageHeader,ConfirmModal} from '../components/common';

const tabs=[['กลุ่มคลัง',Warehouse],['แผนที่จุดเก็บ',MapPinned],['หน่วยสินค้า',Scale],['ประเภทการจ่าย',Tags],['หน้าตาตาราง',TableProperties],['เลขที่เอกสาร',Hash],['สำรองข้อมูล',DatabaseBackup]];
export default function SettingsPage(){
  const [tab,setTab]=useState(0),[confirm,setConfirm]=useState(false),navigate=useNavigate();
  const {reset,setToast,storageLocations,lots}=useApp();
  return <><PageHeader title="ตั้งค่าระบบ" subtitle="กำหนดค่าพื้นฐาน จุดเก็บ และลิมิตคลังสินค้า"/><div className="settings-layout"><div className="settings-tabs">{tabs.map(([name,Icon],index)=><button className={tab===index?'active':''} key={name} onClick={()=>setTab(index)}><Icon/>{name}</button>)}</div><div className="card settings-content"><h2>{tabs[tab][0]}</h2><p>จัดการค่าที่ใช้ร่วมกันภายในระบบ</p>
    {tab===0&&<div className="setting-list">{warehouseGroups.map((group,index)=><div key={group.id}><span className="order">{index+1}</span><div><b>{group.name}</b><small>รหัส: {group.id}</small></div><span className="badge green">ใช้งาน</span></div>)}</div>}
    {tab===1&&<div className="map-setting-list">{warehouseGroups.map(group=>{const count=storageLocations.filter(location=>location.warehouseGroup===group.id).length,used=storageLocations.filter(location=>location.warehouseGroup===group.id&&lots.some(lot=>lot.locationId===location.id&&lot.quantityRemaining>0)).length;return <button key={group.id} onClick={()=>navigate(`/warehouse-map/${group.path}`)}><span className="map-setting-icon"><MapPinned/></span><span><b>{group.name}</b><small>{count} จุดเก็บ · ใช้งาน {used} จุด</small></span><span className="map-setting-action">ตั้งค่า / เพิ่มช่อง <ArrowUpRight/></span></button>})}</div>}
    {tab===2&&<div className="setting-list">{units.map((unit,index)=><div key={unit}><span className="order">{index+1}</span><b>{unit}</b><span className="badge green">ใช้งาน</span></div>)}</div>}
    {tab===3&&<div className="setting-list">{['ส่งให้สาขา','เบิกใช้งาน','คืน Supplier','สินค้าเสียหาย','ปรับปรุง Stock'].map((name,index)=><div key={name}><span className="order">{index+1}</span><b>{name}</b><span className="badge green">ใช้งาน</span></div>)}</div>}
    {tab===4&&<div className="form-grid"><label>จำนวนรายการต่อหน้า<select><option>10</option><option>20</option><option>50</option></select></label><label>ความหนาแน่นตาราง<select><option>ปกติ</option><option>กระชับ</option></select></label></div>}
    {tab===5&&<div className="form-grid"><label>รับสินค้า<input value="RCV" readOnly/></label><label>จ่ายสินค้า<input value="ISS" readOnly/></label><label>โอนสินค้า<input value="TRF" readOnly/></label><label>รูปแบบวันที่<input value="YYYYMMDD" readOnly/></label></div>}
    {tab===6&&<div className="backup-box"><DatabaseBackup/><h3>ข้อมูล Mock ในอุปกรณ์นี้</h3><p>ข้อมูลสินค้า จุดเก็บ และ Stock Card บันทึกอยู่ใน localStorage ของเบราว์เซอร์</p><button className="btn danger-btn" onClick={()=>setConfirm(true)}><RotateCcw/> คืนค่า Mock Data</button></div>}
    {tab!==1&&tab<6&&<button className="btn primary settings-save" onClick={()=>setToast('บันทึกการตั้งค่าแล้ว')}><Save/> บันทึกการตั้งค่า</button>}
  </div></div>{confirm&&<ConfirmModal title="คืนค่าข้อมูลตัวอย่าง" text="ข้อมูลที่แก้ไขทั้งหมด รวมถึงแผนที่จุดเก็บ จะถูกแทนที่ด้วย Mock Data เริ่มต้น ต้องการดำเนินการหรือไม่" onClose={()=>setConfirm(false)} onConfirm={()=>{reset();setConfirm(false)}}/>}</>;
}
