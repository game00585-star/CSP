import {useMemo,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {ArrowLeft,Boxes,MapPinned,Plus,Save,Trash2,TriangleAlert} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {warehouseGroups,units} from '../data/constants';
import {fmt} from '../utils/helpers';
import {PageHeader,Modal} from '../components/common';

const emptyLocation=group=>({warehouseGroup:group,name:'',capacity:50,unit:'กิโลกรัม'});
export default function StorageMapPage(){
  const {group}=useParams(),navigate=useNavigate(),{storageLocations,lots,saveStorageLocation,removeStorageLocation}=useApp();
  const warehouse=warehouseGroups.find(item=>item.path===group)||warehouseGroups.find(item=>item.id===group)||warehouseGroups[0];
  const locations=storageLocations.filter(item=>item.warehouseGroup===warehouse.id);
  const usage=useMemo(()=>Object.fromEntries(locations.map(location=>[location.id,lots.filter(lot=>lot.locationId===location.id&&lot.quantityRemaining>0).reduce((sum,lot)=>sum+(+lot.quantityRemaining||0),0)])),[locations,lots]);
  const [editing,setEditing]=useState(null),[error,setError]=useState('');
  const open=location=>{setEditing(location?{...location}:emptyLocation(warehouse.id));setError('')};
  const submit=()=>{if(!editing.name.trim()||+editing.capacity<=0){setError('กรุณาระบุชื่อจุดเก็บและลิมิตมากกว่า 0');return}if((usage[editing.id]||0)>+editing.capacity){setError(`ลิมิตต้องไม่น้อยกว่ายอดที่เก็บอยู่ ${fmt(usage[editing.id])} ${editing.unit}`);return}saveStorageLocation(editing);setEditing(null)};
  const remove=()=>{try{removeStorageLocation(editing.id);setEditing(null)}catch(removeError){setError(removeError.message)}};
  return <><PageHeader title={`แผนที่จุดเก็บ · ${warehouse.name}`} subtitle="คลิกช่องบนแผนที่เพื่อตั้งชื่อ หน่วย และลิมิต Over Stock" actions={<><button className="btn ghost" onClick={()=>navigate(`/warehouse/${warehouse.path}`)}><ArrowLeft/> กลับคลังสินค้า</button><button className="btn primary" onClick={()=>open(null)}><Plus/> เพิ่มช่องในแผนที่</button></>}/>
    <div className="map-warehouse-tabs">{warehouseGroups.map(item=><button key={item.id} className={item.id===warehouse.id?'active':''} onClick={()=>navigate(`/warehouse-map/${item.path}`)}><MapPinned/>{item.name}<small>{storageLocations.filter(location=>location.warehouseGroup===item.id).length} จุด</small></button>)}</div>
    <div className="map-summary"><div><MapPinned/><span><small>จุดเก็บทั้งหมด</small><b>{locations.length} จุด</b></span></div><div><Boxes/><span><small>มีสินค้าอยู่</small><b>{locations.filter(item=>(usage[item.id]||0)>0).length} จุด</b></span></div><div><TriangleAlert/><span><small>เต็ม / Over Stock</small><b>{locations.filter(item=>(usage[item.id]||0)>=item.capacity).length} จุด</b></span></div></div>
    <div className="warehouse-map card"><div className="map-grid">{locations.map(location=>{const used=usage[location.id]||0,percent=location.capacity?Math.round(used/location.capacity*100):0,state=percent>100?'over':percent>=90?'full':percent>=70?'warning':'normal';return <button type="button" className={`storage-cell ${state}`} key={location.id} onClick={()=>open(location)}><span className="rack left"/><span className="rack right"/><span className="location-code">{location.name}</span><span className="location-usage">{fmt(used)} / {fmt(location.capacity)} {location.unit}</span><span className="capacity-track"><i style={{width:`${Math.min(percent,100)}%`}}/></span><span className="location-status">{percent>100?'OVER STOCK':percent>=100?'เต็ม':`ใช้งาน ${percent}%`}</span></button>})}{!locations.length&&<button type="button" className="storage-cell add-cell" onClick={()=>open(null)}><Plus/><b>เพิ่มจุดเก็บแรก</b></button>}</div></div>
    {editing&&<Modal title={editing.id?`ตั้งค่าจุดเก็บ ${editing.name}`:'เพิ่มช่องในแผนที่'} onClose={()=>setEditing(null)}><div className="storage-form"><label>ชื่อจุดเก็บ<input value={editing.name} onChange={event=>setEditing({...editing,name:event.target.value})} placeholder="เช่น Cold 1, PK-01"/></label><label>ลิมิตสูงสุด<input type="number" min="1" value={editing.capacity} onChange={event=>setEditing({...editing,capacity:event.target.value})}/></label><label>หน่วย<select value={editing.unit} onChange={event=>setEditing({...editing,unit:event.target.value})}>{units.map(unit=><option key={unit}>{unit}</option>)}</select></label>{editing.id&&<div className="storage-current"><span>ปริมาณที่เก็บอยู่</span><b>{fmt(usage[editing.id]||0)} {editing.unit}</b></div>}{error&&<div className="alert full">{error}</div>}</div><div className="modal-actions">{editing.id&&<button className="btn danger-btn" onClick={remove}><Trash2/> ลบจุดเก็บ</button>}<button className="btn ghost" onClick={()=>setEditing(null)}>ยกเลิก</button><button className="btn primary" onClick={submit}><Save/> บันทึก</button></div></Modal>}
  </>;
}
