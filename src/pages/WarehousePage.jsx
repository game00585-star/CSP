import {useMemo,useRef,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import * as XLSX from 'xlsx';
import {Boxes,PackageCheck,TriangleAlert,PackageX,Plus,Pencil,Eye,ScrollText,Upload,Trash2} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {warehouseGroups,units} from '../data/constants';
import {fmt,stockStatus} from '../utils/helpers';
import {PageHeader,StatCard,Toolbar,StatusBadge,ExportButton,Pagination,Empty,Modal,ConfirmModal} from '../components/common';
import ProductForm from './ProductForm';

const cell=(row,...names)=>names.map(name=>row[name]).find(value=>value!==undefined&&value!==null&&value!=='');

export default function WarehousePage(){
  const {group}=useParams(),nav=useNavigate();
  const {products,addProduct,removeProduct,setToast}=useApp();
  const fileInput=useRef(null);
  const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[unit,setUnit]=useState('');
  const [page,setPage]=useState(1),[size,setSize]=useState(10),[editing,setEditing]=useState(null),[view,setView]=useState(null),[preview,setPreview]=useState([]),[selected,setSelected]=useState([]),[confirmDelete,setConfirmDelete]=useState(false);
  const g=warehouseGroups.find(item=>item.path===group)||warehouseGroups[0];
  const list=useMemo(()=>products.filter(p=>p.warehouseGroup===g.id&&(!search||`${p.barcode}${p.productCode}${p.productName}`.toLowerCase().includes(search.toLowerCase()))&&(!status||stockStatus(p)===status)&&(!unit||p.unit===unit)),[products,g.id,search,status,unit]);
  const stats={stock:list.reduce((sum,p)=>sum+p.currentStock,0),low:list.filter(p=>stockStatus(p)==='ใกล้หมด').length,out:list.filter(p=>p.currentStock===0).length};
  const selectedInList=selected.filter(id=>list.some(product=>product.id===id));
  const allSelected=list.length>0&&list.every(product=>selected.includes(product.id));
  const toggleAll=()=>setSelected(allSelected?selected.filter(id=>!list.some(product=>product.id===id)):[...new Set([...selected,...list.map(product=>product.id)])]);
  const toggleOne=id=>setSelected(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  const deleteSelected=()=>{selectedInList.forEach(id=>removeProduct(id));setSelected(current=>current.filter(id=>!selectedInList.includes(id)));setConfirmDelete(false);setToast(`ลบสินค้าแล้ว ${selectedInList.length} รายการ`);};

  const readExcel=event=>{
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file)return;
    const reader=new FileReader();
    reader.onload=result=>{
      try{
        const workbook=XLSX.read(result.target.result,{type:'array'});
        const sheet=workbook.Sheets[workbook.SheetNames[0]];
        const rawRows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false});
        const headerIndex=rawRows.findIndex(row=>row.some(value=>String(value).trim()==='รหัสสินค้า')&&row.some(value=>String(value).trim().includes('รายละเอียด')));
        let firstDataRow=2;
        let rows;
        if(headerIndex>=0){
          const headers=rawRows[headerIndex].map(value=>String(value).trim());
          firstDataRow=headerIndex+2;
          rows=rawRows.slice(headerIndex+1).filter(row=>row.some(value=>String(value).trim())).map(row=>Object.fromEntries(headers.map((header,index)=>[header,row[index]??''])));
        }else{
          rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});
        }
        const seen=new Set();
        setPreview(rows.map((row,index)=>{
          const productCode=String(cell(row,'รหัสสินค้า','Product Code','productCode')||'').trim();
          const barcode=String(cell(row,'Barcode','บาร์โค้ด')||productCode).trim();
          const productName=String(cell(row,'รายละเอียด (ไทย)','รายละเอียด','ชื่อสินค้า','Product Name','productName')||'').trim();
          const productGroup=String(cell(row,'กลุ่ม','กลุ่มคลัง','Warehouse Group')||g.id).trim().toUpperCase();
          const productUnit=String(cell(row,'หน่วยนับ','หน่วย','Unit','unit')||units[0]).trim();
          const productType=String(cell(row,'ประเภท','Type')||'').trim();
          const currentStock=Number(cell(row,'Stock เริ่มต้น','Stock','currentStock')||0);
          const minStock=Number(cell(row,'ขั้นต่ำ','Min Stock','minStock')||0);
          const maxStock=Number(cell(row,'ขั้นสูง','Max Stock','maxStock')||100);
          const duplicate=seen.has(barcode)||seen.has(productCode)||products.some(p=>p.barcode===barcode||p.productCode===productCode);
          seen.add(barcode);seen.add(productCode);
          const errors=[];
          if(!barcode)errors.push('ไม่มี Barcode');
          if(!productCode)errors.push('ไม่มีรหัสสินค้า');
          if(!productName)errors.push('ไม่มีชื่อสินค้า');
          if(productGroup!==g.id)errors.push(`กลุ่ม ${productGroup} ไม่ตรงกับคลัง ${g.id}`);
          if(!units.includes(productUnit))errors.push('หน่วยไม่ถูกต้อง');
          if([currentStock,minStock,maxStock].some(Number.isNaN)||currentStock<0||minStock<0||maxStock<minStock)errors.push('ข้อมูล Stock ไม่ถูกต้อง');
          if(duplicate)errors.push('Barcode หรือรหัสสินค้าซ้ำ');
          return {_row:firstDataRow+index,barcode,productCode,productName,unit:productUnit,currentStock,minStock,maxStock,note:[productType,String(cell(row,'หมายเหตุ','Note')||'')].filter(Boolean).join(' · '),errors,_valid:errors.length===0};
        }));
      }catch{
        setToast('ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const importRows=()=>{
    const validRows=preview.filter(row=>row._valid);
    validRows.forEach(row=>addProduct({...row,warehouseGroup:g.id}));
    setPreview([]);setPage(1);
    setToast(`นำเข้าสินค้าเข้า ${g.name} สำเร็จ ${validRows.length} รายการ`);
  };

  return <>
    <PageHeader title={`คลังสินค้า · ${g.name}`} subtitle="ตรวจสอบยอดคงเหลือและสถานะสินค้า" actions={<><input ref={fileInput} hidden type="file" accept=".xlsx,.xls" onChange={readExcel}/><button className="btn secondary" onClick={()=>fileInput.current?.click()}><Upload/> Import Excel</button><button className="btn primary" onClick={()=>setEditing({warehouseGroup:g.id})}><Plus/> เพิ่มสินค้า</button></>}/>
    <div className="stats-grid compact"><StatCard icon={Boxes} label="จำนวนรายการ" value={list.length} unit="สินค้า"/><StatCard icon={PackageCheck} label="Stock คงเหลือ" value={fmt(stats.stock)} unit="หน่วย" color="green"/><StatCard icon={TriangleAlert} label="ใกล้หมด" value={stats.low} unit="รายการ" color="orange"/><StatCard icon={PackageX} label="หมด" value={stats.out} unit="รายการ" color="red"/></div>
    <div className="card"><Toolbar search={search} setSearch={setSearch}><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">ทุกสถานะ</option><option>ปกติ</option><option>ใกล้หมด</option><option>หมด</option></select><select value={unit} onChange={e=>setUnit(e.target.value)}><option value="">ทุกหน่วย</option>{units.map(item=><option key={item}>{item}</option>)}</select><button className="btn ghost" onClick={()=>{setSearch('');setStatus('');setUnit('')}}>ล้างตัวกรอง</button>{selectedInList.length>0&&<button className="btn danger-btn" onClick={()=>setConfirmDelete(true)}><Trash2/> ลบที่เลือก ({selectedInList.length})</button>}<ExportButton rows={list} name={`CSP-stock-${g.path}`}/></Toolbar>
      <div className="table-wrap"><table><thead><tr><th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={`เลือกสินค้าทั้งหมดในคลัง ${g.name}`}/></th><th>#</th><th>Barcode / รหัส</th><th>ชื่อสินค้า</th><th>หน่วย</th><th>คงเหลือ</th><th>ต่ำสุด / สูงสุด</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{list.slice((page-1)*size,page*size).map((p,index)=><tr key={p.id} className={selected.includes(p.id)?'selected-row':''}><td><input type="checkbox" checked={selected.includes(p.id)} onChange={()=>toggleOne(p.id)} aria-label={`เลือก ${p.productName}`}/></td><td>{(page-1)*size+index+1}</td><td><b>{p.barcode}</b><small>{p.productCode}</small></td><td>{p.productName}</td><td>{p.unit}</td><td className="num">{fmt(p.currentStock)}</td><td>{p.minStock} / {p.maxStock}</td><td><StatusBadge status={stockStatus(p)}/></td><td><div className="row-actions"><button onClick={()=>setView(p)} title="ดู"><Eye/></button><button onClick={()=>setEditing(p)} title="แก้ไข"><Pencil/></button><button onClick={()=>nav(`/stock-card?product=${p.id}`)} title="Stock Card"><ScrollText/></button></div></td></tr>)}</tbody></table>{!list.length&&<Empty/>}</div>
      <Pagination page={page} setPage={setPage} total={list.length} size={size} setSize={setSize}/>
    </div>
    {editing&&<ProductForm product={editing} onClose={()=>setEditing(null)}/>}
    {view&&<Modal title="รายละเอียดสินค้า" onClose={()=>setView(null)}><div className="detail-grid">{[['Barcode',view.barcode],['รหัสสินค้า',view.productCode],['ชื่อสินค้า',view.productName],['กลุ่มคลัง',g.name],['หน่วย',view.unit],['Stock ปัจจุบัน',fmt(view.currentStock)],['ขั้นต่ำ',view.minStock],['ขั้นสูง',view.maxStock]].map(item=><div key={item[0]}><small>{item[0]}</small><b>{item[1]}</b></div>)}</div></Modal>}
    {confirmDelete&&<ConfirmModal title="ยืนยันการลบสินค้า" text={`ต้องการลบสินค้าที่เลือก ${selectedInList.length} รายการออกจากคลัง ${g.name} หรือไม่? ข้อมูล Stock Card เดิมจะยังถูกเก็บไว้`} onClose={()=>setConfirmDelete(false)} onConfirm={deleteSelected}/>}
    {preview.length>0&&<Modal title={`ตัวอย่างข้อมูลนำเข้า · ${g.name}`} onClose={()=>setPreview([])} wide><div className="import-summary"><b>ถูกต้อง {preview.filter(row=>row._valid).length} รายการ</b><span>ผิดพลาด {preview.filter(row=>!row._valid).length} รายการ</span></div><div className="table-wrap preview"><table><thead><tr><th>แถว</th><th>Barcode / รหัส</th><th>ชื่อสินค้า</th><th>หน่วย</th><th>Stock</th><th>ผลตรวจสอบ</th></tr></thead><tbody>{preview.map(row=><tr key={row._row}><td>{row._row}</td><td><b>{row.barcode||'—'}</b><small>{row.productCode||'—'}</small></td><td>{row.productName||'—'}</td><td>{row.unit}</td><td>{row.currentStock}</td><td>{row._valid?<span className="badge green">พร้อมนำเข้า</span>:<span className="badge red" title={row.errors.join(', ')}>{row.errors.join(', ')}</span>}</td></tr>)}</tbody></table></div><div className="modal-actions"><button className="btn ghost" onClick={()=>setPreview([])}>ยกเลิก</button><button className="btn primary" disabled={!preview.some(row=>row._valid)} onClick={importRows}>นำเข้า {preview.filter(row=>row._valid).length} รายการ</button></div></Modal>}
  </>;
}
