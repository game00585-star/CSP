import {useState} from 'react';
import {useApp} from '../context/AppContext';
import {warehouseGroups,units} from '../data/constants';
import {Modal} from '../components/common';

const numberFrom=value=>{const match=String(value??'').replaceAll(',','').match(/-?\d+(?:\.\d+)?/);return match?Number(match[0]):0};
const computedColumns=new Set(['ลำดับ','จำนวนกระสอบ/ลัง']);

export default function ProductForm({product,columns,onClose}){
  const {products,addProduct,updateProduct}=useApp(),editing=Boolean(product.id);
  const [f,setF]=useState({barcode:'',productCode:'',productName:'',warehouseGroup:'RM',unit:'กิโลกรัม',currentStock:0,minStock:0,maxStock:100,note:'',excelRow:columns?.map(()=>''),...product}),[error,setError]=useState('');
  const change=event=>setF(current=>({...current,[event.target.name]:event.target.value}));
  const columnValue=(column,index)=>{
    if(column==='รหัสสินค้า')return f.productCode;
    if(column==='ชื่อสินค้า')return f.productName;
    if(column==='จำนวนสินค้าคงเหลือ')return f.currentStock;
    if(column==='หน่วย')return f.unit;
    if(column==='MIN')return f.minStock;
    if(column==='MAX')return f.maxStock;
    return f.excelRow?.[index]??'';
  };
  const changeColumn=(column,index,value)=>setF(current=>{
    const excelRow=[...(current.excelRow||columns.map(()=>''))];excelRow[index]=value;
    const next={...current,excelRow};
    if(column==='รหัสสินค้า')next.productCode=value;
    if(column==='ชื่อสินค้า')next.productName=value;
    if(column==='จำนวนสินค้าคงเหลือ')next.currentStock=numberFrom(value);
    if(column==='หน่วย')next.unit=value;
    if(column==='MIN')next.minStock=numberFrom(value);
    if(column==='MAX')next.maxStock=numberFrom(value);
    if(column==='กก./กระสอบ'||column==='กก./กระสอบ/ลัง/ถุง')next.packSize=numberFrom(value);
    return next;
  });
  const submit=event=>{
    event.preventDefault();
    if(!String(f.productName||'').trim())return setError('กรุณากรอกชื่อสินค้า');
    if(!String(f.productCode||'').trim())return setError('กรุณากรอกรหัสสินค้า');
    if(+f.currentStock<0||+f.minStock<0)return setError('จำนวนต้องไม่ติดลบ');
    if(+f.maxStock<+f.minStock)return setError('Stock ขั้นสูงต้องไม่น้อยกว่าขั้นต่ำ');
    if(products.some(p=>p.id!==f.id&&p.warehouseGroup===f.warehouseGroup&&p.productCode.trim().toLowerCase()===f.productCode.trim().toLowerCase()&&p.productName.trim().toLowerCase()===f.productName.trim().toLowerCase()))return setError('รหัสสินค้าและชื่อสินค้านี้มีอยู่แล้วในคลัง');
    const data={...f,barcode:f.barcode||f.productCode,currentStock:+f.currentStock,minStock:+f.minStock,maxStock:+f.maxStock};
    editing?updateProduct(f.id,data):addProduct(data);onClose();
  };
  return <Modal title={editing?'แก้ไขข้อมูลสินค้า':'เพิ่มสินค้าใหม่'} onClose={onClose} wide><form onSubmit={submit} className="form-grid product-detail-form">{error&&<div className="alert full">{error}</div>}{columns?<><div className="full product-form-note">แก้ไขรายละเอียดตามคอลัมน์ของตารางได้ทุกช่อง ยกเว้น “ลำดับ” และ “จำนวนกระสอบ/ลัง” ซึ่งระบบคำนวณให้อัตโนมัติ</div>{columns.map((column,index)=>computedColumns.has(column)?null:<label key={`${column}-${index}`} className={column==='ชื่อสินค้า'?'full':''}>{column}<input type={['จำนวนสินค้าคงเหลือ','IN','OUT','MIN','MAX'].includes(column)?'number':'text'} step="any" value={columnValue(column,index)} onChange={event=>changeColumn(column,index,event.target.value)}/></label>)}</>:<><label>รหัสสินค้า<input required name="productCode" value={f.productCode} onChange={change}/></label><label className="full">ชื่อสินค้า<input required name="productName" value={f.productName} onChange={change}/></label><label>กลุ่มคลัง<select name="warehouseGroup" value={f.warehouseGroup} onChange={change}>{warehouseGroups.map(group=><option value={group.id} key={group.id}>{group.name}</option>)}</select></label><label>หน่วย<select name="unit" value={f.unit} onChange={change}>{units.map(unit=><option key={unit}>{unit}</option>)}</select></label><label>Stock ปัจจุบัน<input type="number" min="0" step="any" name="currentStock" value={f.currentStock} onChange={change}/></label><label>Stock ขั้นต่ำ<input type="number" min="0" step="any" name="minStock" value={f.minStock} onChange={change}/></label><label>Stock ขั้นสูง<input type="number" min="0" step="any" name="maxStock" value={f.maxStock} onChange={change}/></label><label className="full">หมายเหตุ<textarea name="note" value={f.note} onChange={change}/></label></>}<div className="modal-actions full"><button type="button" className="btn ghost" onClick={onClose}>ยกเลิก</button><button className="btn primary">บันทึกข้อมูล</button></div></form></Modal>;
}
