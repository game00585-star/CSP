import {useMemo,useRef,useState} from 'react';
import {Box,RotateCcw,ZoomIn,Warehouse} from 'lucide-react';
import {warehouseGroups} from '../data/constants';
import './warehouse3d.css';
import './warehouse3d-v2.css';

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export default function Warehouse3D({products=[],compact=false,onSelect}){
  const defaultZoom=compact?.98:1.24;
  const [rotation,setRotation]=useState({x:-16,y:-28}),[zoom,setZoom]=useState(defaultZoom),[selected,setSelected]=useState('all');
  const drag=useRef(null);
  const groups=useMemo(()=>warehouseGroups.map((group,index)=>{
    const current=products.filter(product=>product.warehouseGroup===group.id);
    return {...group,index,count:current.length,stock:current.reduce((sum,product)=>sum+Number(product.currentStock||0),0)};
  }),[products]);
  const start=event=>{drag.current={x:event.clientX,y:event.clientY,rotation};event.currentTarget.setPointerCapture?.(event.pointerId)};
  const move=event=>{if(!drag.current)return;setRotation({x:clamp(drag.current.rotation.x-(event.clientY-drag.current.y)*.22,-38,8),y:drag.current.rotation.y+(event.clientX-drag.current.x)*.28})};
  const stop=()=>{drag.current=null};
  const reset=()=>{setRotation({x:-16,y:-28});setZoom(defaultZoom);setSelected('all')};
  const totalStock=groups.reduce((sum,group)=>sum+group.stock,0),totalProducts=groups.reduce((sum,group)=>sum+group.count,0);
  const choose=group=>{setSelected(group.id);onSelect?.(group)};
  return <section className={`warehouse-3d ${compact?'warehouse-3d-compact':''}`}>
    {!compact&&<div className="warehouse-command-panel"><span>LIVE FACILITY VIEW</span><h2>ศูนย์ควบคุมคลังสินค้า</h2><p>ภาพรวมทุกคลังจากข้อมูลปัจจุบัน</p><div className="command-metric"><i><Warehouse/></i><div><small>จำนวนคลัง</small><b>{groups.length} คลัง</b></div></div><div className="command-metric"><i><Box/></i><div><small>รายการสินค้า</small><b>{totalProducts.toLocaleString('th-TH')} รายการ</b></div></div><div className="command-stock"><small>Stock คงเหลือรวม</small><b>{totalStock.toLocaleString('th-TH')}</b><span>หน่วย</span></div><em>ลากเพื่อหมุน · เลื่อนเพื่อซูม</em></div>}
    <div className="warehouse-3d-toolbar">
      {!compact&&<select value={selected} onChange={event=>setSelected(event.target.value)} aria-label="เลือกกลุ่มคลัง"><option value="all">ทุกกลุ่มคลัง</option>{groups.map(group=><option value={group.id} key={group.id}>{group.name} · {group.count} รายการ</option>)}</select>}
      <button type="button" onClick={()=>setZoom(value=>clamp(value+.12,.72,1.6))} aria-label="ซูมเข้า"><ZoomIn/></button>
      <button type="button" onClick={reset} aria-label="คืนค่ามุมมอง"><RotateCcw/></button>
    </div>
    <div className="warehouse-3d-viewport" onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onWheel={event=>setZoom(value=>clamp(value-event.deltaY*.0008,.72,1.6))}>
      <div className="warehouse-3d-world" style={{transform:`translate(-50%,-50%) scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`}}>
        <div className="warehouse-floor"><i/><i/><i/><i/><i/></div>
        <div className="warehouse-building"><span className="building-front"><Warehouse/><b>CSP</b></span><span className="building-side"/><span className="building-roof"/></div>
        {groups.map(group=><button type="button" key={group.id} className={`warehouse-rack rack-${group.index+1} ${selected!=='all'&&selected!==group.id?'muted':''} ${selected===group.id?'selected':''}`} onClick={event=>{event.stopPropagation();choose(group)}} title={`${group.name}: ${group.count} รายการ`}>
          <span className="rack-face"><b>{group.name}</b><small>{group.count} SKU</small></span><span className="rack-side"/><span className="rack-top"/>
          {[0,1,2].map(level=><i key={level} style={{'--level':level}}><Box/></i>)}
        </button>)}
        <div className="warehouse-loader"><span/><b/></div>
      </div>
      <div className="warehouse-grid-glow"/>
    </div>
    {!compact&&<div className="warehouse-3d-legend">{groups.map(group=><button type="button" key={group.id} className={selected===group.id?'active':''} onClick={()=>choose(group)}><i/><span>{group.name}</span><b>{group.count}</b></button>)}</div>}
  </section>;
}
