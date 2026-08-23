import {useMemo,useRef,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import * as XLSX from 'xlsx';
import {Boxes,PackageCheck,TriangleAlert,PackageX,Plus,Pencil,Eye,ScrollText,Upload,Trash2,MapPinned,TableProperties,Save} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {warehouseGroups,units} from '../data/constants';
import {fmt,stockStatus} from '../utils/helpers';
import {PageHeader,StatCard,Toolbar,StatusBadge,ExportButton,Pagination,Empty,Modal,ConfirmModal} from '../components/common';
import ProductForm from './ProductForm';
import './warehouseExcel.css';
import './warehouseEnhancements.css';

const cell=(row,...names)=>names.map(name=>row[name]).find(value=>value!==undefined&&value!==null&&value!=='');
const excelColumns={
  PK:['ลำดับ','รหัสสินค้า','ยอดยกมา','ชื่อสินค้า','กก./กระสอบ','จำนวนสินค้าคงเหลือ','หน่วย','จำนวนกระสอบ/ลัง','กลุ่มสินค้า','Remark','วันผลิต','วันหมดอายุ','วันหมดอายุที่เหลือ\n(UP DATE )','IN','OUT','MIN','MAX','Comment'],
  IN:['ลำดับ','รหัสสินค้า','ยอดยกมา','ชื่อสินค้า','กก./กระสอบ/ลัง/ถุง','จำนวนสินค้าคงเหลือ','หน่วย','จำนวนกระสอบ/ลัง','กลุ่มสินค้า','Allergen/Non Allergen','Remark','sheif life','LOT วันที่รับเข้า','วันผลิต','วันหมดอายุ','วันหมดอายุที่เหลือ\n(UP DATE )','IN','OUT','MIN','MAX','Comment']
};
const generalColumns=['ลำดับ','รหัสสินค้า','ยอดยกมา','ชื่อสินค้า','หน่วย','คงเหลือ','ต่ำสุด / สูงสุด','สถานะ','แผนที่จุดเก็บ'];
const readHeaderNames=()=>{try{return JSON.parse(localStorage.getItem('csp_warehouse_table_headers'))||{}}catch{return{}}};
const excelValue=(product,column,index)=>{
  if(column==='รหัสสินค้า')return product.productCode;
  if(column==='ชื่อสินค้า')return product.productName;
  if(column==='ยอดยกมา')return fmt(product.openingBalance??product.excelRow?.[2]??product.currentStock);
  if(column==='จำนวนสินค้าคงเหลือ')return fmt(product.currentStock);
  if(column==='จำนวนกระสอบ/ลัง'){const sourceDivisor=String(product.excelRow?.[4]??'').replaceAll(',','').match(/\d+(?:\.\d+)?/),divisor=Number(product.packSize||sourceDivisor?.[0]||0);return divisor>0?(Number(product.currentStock||0)/divisor).toLocaleString('th-TH',{maximumFractionDigits:4}):'—'}
  if(column==='MIN')return fmt(product.minStock);
  if(column==='MAX')return fmt(product.maxStock);
  const value=product.excelRow?.[index];
  return value===undefined||value===null||value===''?'—':typeof value==='number'?fmt(value):String(value);
};

export default function WarehousePage(){
  const {group}=useParams(),nav=useNavigate();
  const {products,addProduct,updateProduct,removeProduct,setToast}=useApp();
  const fileInput=useRef(null);
  const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[unit,setUnit]=useState('');
  const [page,setPage]=useState(1),[size,setSize]=useState(10),[editing,setEditing]=useState(null),[view,setView]=useState(null),[preview,setPreview]=useState([]),[selected,setSelected]=useState([]),[confirmDelete,setConfirmDelete]=useState(false),[headerNames,setHeaderNames]=useState(readHeaderNames),[editingHeaders,setEditingHeaders]=useState(null);
  const g=warehouseGroups.find(item=>item.path===group)||warehouseGroups[0];
  const sourceColumns=excelColumns[g.id]||null;
  const tableColumns=sourceColumns?[...sourceColumns,'แผนที่จุดเก็บ']:generalColumns;
  const displayHeader=(column,index)=>headerNames[g.id]?.[index]||column;
  const list=useMemo(()=>products.filter(p=>p.warehouseGroup===g.id&&(!search||`${p.productName} ${p.productCode}`.toLowerCase().includes(search.toLowerCase()))&&(!status||stockStatus(p)===status)&&(!unit||p.unit===unit)),[products,g.id,search,status,unit]);
  const stats={stock:list.reduce((sum,p)=>sum+p.currentStock,0),low:list.filter(p=>stockStatus(p)==='ใกล้หมด').length,out:list.filter(p=>p.currentStock===0).length};
  const selectedInList=selected.filter(id=>list.some(product=>product.id===id));
  const allSelected=list.length>0&&list.every(product=>selected.includes(product.id));
  const toggleAll=()=>setSelected(allSelected?selected.filter(id=>!list.some(product=>product.id===id)):[...new Set([...selected,...list.map(product=>product.id)])]);
  const toggleOne=id=>setSelected(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  const deleteSelected=()=>{selectedInList.forEach(id=>removeProduct(id));setSelected(current=>current.filter(id=>!selectedInList.includes(id)));setConfirmDelete(false);setToast(`ลบสินค้าแล้ว ${selectedInList.length} รายการ`);};
  const openHeaderEditor=()=>setEditingHeaders(tableColumns.map((column,index)=>headerNames[g.id]?.[index]||column));
  const saveHeaders=()=>{const next={...headerNames,[g.id]:editingHeaders};setHeaderNames(next);localStorage.setItem('csp_warehouse_table_headers',JSON.stringify(next));setEditingHeaders(null);setToast(`บันทึกชื่อหัวตาราง ${g.name} แล้ว`)};
  const openMapAssignment=()=>{sessionStorage.setItem('csp_map_product_selection',JSON.stringify(selectedInList));nav(`/warehouse-map/${g.path}?assign=1`)};

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
        const headerIndex=rawRows.findIndex(row=>row.some(value=>String(value).trim()==='รหัสสินค้า')&&row.some(value=>['รายละเอียด (ไทย)','รายละเอียด','ชื่อสินค้า'].includes(String(value).trim())));
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
          const productUnit=String(cell(row,'หน่วยนับ','หน่วย','Unit','unit')||units[0]).trim()||units[0];
          const productType=String(cell(row,'ประเภท','Type')||'').trim();
          const number=value=>{const match=String(value??'').replaceAll(',','').match(/-?\d+(?:\.\d+)?/);return match?Number(match[0]):0};
          const packSize=number(cell(row,'กก./กระสอบ','กก./กระสอบ/ลัง/ถุง'));
          const currentStock=number(cell(row,'Stock เริ่มต้น','Stock','คงเหลือ','จำนวนสินค้าคงเหลือ','currentStock'));
          const openingBalance=number(cell(row,'ยอดยกมา','ยอดยกมาเดือน 7/69','Opening Balance','openingBalance')??currentStock);
          const minStock=number(cell(row,'ขั้นต่ำ','MIN','Min Stock','minStock'));
          const maxValue=cell(row,'ขั้นสูง','MAX','Max Stock','maxStock'),maxStock=maxValue==null||maxValue===''?100:number(maxValue);
          const identity=`${productCode.toLowerCase()}|${productName.toLowerCase()}`;
          const sourceRow=firstDataRow+index;
          const existing=products.find(p=>(String(p.sourceFile||'').toLowerCase()===file.name.toLowerCase()&&p.sourceRow===sourceRow)||(p.warehouseGroup===g.id&&p.productCode.trim().toLowerCase()===productCode.toLowerCase()&&p.productName.trim().toLowerCase()===productName.toLowerCase()));
          const duplicateRow=seen.has(identity);
          seen.add(identity);
          const errors=[];
          if(!barcode)errors.push('ไม่มี Barcode');
          if(!productCode)errors.push('ไม่มีรหัสสินค้า');
          if(!productName)errors.push('ไม่มีชื่อสินค้า');
          if([currentStock,minStock,maxStock].some(Number.isNaN)||currentStock<0||minStock<0||maxStock<minStock)errors.push('ข้อมูล Stock ไม่ถูกต้อง');
          if(duplicateRow)errors.push('ข้อมูลซ้ำภายในไฟล์');
          const excelRow=(excelColumns[g.id]||[]).map(header=>header==='จำนวนกระสอบ/ลัง'?'':header==='ยอดยกมา'?openingBalance:cell(row,header)??'');
          return {_row:sourceRow,sourceFile:file.name,sourceRow,barcode,productCode,productName,unit:productUnit,packSize,openingBalance,currentStock,minStock,maxStock,excelRow,note:[productType,String(cell(row,'หมายเหตุ','Note','Comment')||'')].filter(Boolean).join(' · '),existingId:existing?.id,errors,_valid:errors.length===0};
        }));
      }catch{
        setToast('ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const importRows=()=>{
    const validRows=preview.filter(row=>row._valid);
    validRows.forEach(row=>row.existingId?updateProduct(row.existingId,{...products.find(product=>product.id===row.existingId),...row,warehouseGroup:g.id}):addProduct({...row,warehouseGroup:g.id}));
    setPreview([]);setPage(1);
    setToast(`นำเข้าตามไฟล์เข้า ${g.name} สำเร็จ ${validRows.length} รายการ (เพิ่มใหม่ ${validRows.filter(row=>!row.existingId).length} / อัปเดตเดิม ${validRows.filter(row=>row.existingId).length})`);
  };

  return <div className="warehouse-page warehouse-page-expanded">
    <PageHeader title={`ยอดยกมา · ${g.name}`} subtitle="ตรวจสอบยอดยกมา ยอดคงเหลือ และสถานะสินค้า" actions={<><button className="btn ghost" onClick={openHeaderEditor}><TableProperties/> แก้ไขชื่อหัวตาราง</button><button className="btn ghost" onClick={()=>nav(`/warehouse-map/${g.path}`)}><MapPinned/> แผนที่จุดเก็บ</button><input ref={fileInput} hidden type="file" accept=".xlsx,.xls" onChange={readExcel}/><button className="btn secondary" onClick={()=>fileInput.current?.click()}><Upload/> Import Excel</button><button className="btn primary" onClick={()=>setEditing({warehouseGroup:g.id,excelRow:sourceColumns?.map(()=>''),unit:'กิโลกรัม',openingBalance:0,currentStock:0,minStock:0,maxStock:100})}><Plus/> เพิ่มสินค้า</button></>}/>
    <div className="stats-grid compact"><StatCard icon={Boxes} label="จำนวนรายการ" value={list.length} unit="สินค้า"/><StatCard icon={PackageCheck} label="Stock คงเหลือ" value={fmt(stats.stock)} unit="หน่วย" color="green"/><StatCard icon={TriangleAlert} label="ใกล้หมด" value={stats.low} unit="รายการ" color="orange"/><StatCard icon={PackageX} label="หมด" value={stats.out} unit="รายการ" color="red"/></div>
    <div className="card"><Toolbar search={search} setSearch={setSearch}><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">ทุกสถานะ</option><option>ปกติ</option><option>ใกล้หมด</option><option>หมด</option></select><select value={unit} onChange={e=>setUnit(e.target.value)}><option value="">ทุกหน่วย</option>{units.map(item=><option key={item}>{item}</option>)}</select><button className="btn ghost" onClick={()=>{setSearch('');setStatus('');setUnit('')}}>ล้างตัวกรอง</button>{selectedInList.length>0&&<button className="btn danger-btn" onClick={()=>setConfirmDelete(true)}><Trash2/> ลบที่เลือก ({selectedInList.length})</button>}<ExportButton rows={list} name={`CSP-stock-${g.path}`}/></Toolbar>
      <div className={`table-wrap ${sourceColumns?'excel-source-table':''}`}><table><thead>{sourceColumns?<tr><th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={`เลือกสินค้าทั้งหมดในคลัง ${g.name}`}/></th>{sourceColumns.map((column,index)=><th key={column}>{displayHeader(column,index)}</th>)}<th>{displayHeader('แผนที่จุดเก็บ',sourceColumns.length)}</th><th>จัดการ</th></tr>:<tr><th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={`เลือกสินค้าทั้งหมดในคลัง ${g.name}`}/></th>{generalColumns.map((column,index)=><th key={column}>{displayHeader(column,index)}</th>)}<th>จัดการ</th></tr>}</thead><tbody>{list.slice((page-1)*size,page*size).map((p,index)=>sourceColumns?<tr key={p.id} className={selected.includes(p.id)?'selected-row':''}><td><input type="checkbox" checked={selected.includes(p.id)} onChange={()=>toggleOne(p.id)} aria-label={`เลือก ${p.productName}`}/></td>{sourceColumns.map((column,columnIndex)=><td key={column} className={['ยอดยกมา','กก./กระสอบ','กก./กระสอบ/ลัง/ถุง','จำนวนสินค้าคงเหลือ','จำนวนกระสอบ/ลัง','IN','OUT','MIN','MAX'].includes(column)?'num':''}>{column==='ลำดับ'?(page-1)*size+index+1:excelValue(p,column,columnIndex)}</td>)}<td><span className={p.defaultLocationName?'badge green':'badge orange'}>{p.defaultLocationName||'ยังไม่จัดเก็บ'}</span></td><td><div className="row-actions"><button onClick={()=>setView(p)} title="ดู"><Eye/></button><button onClick={()=>setEditing(p)} title="แก้ไข"><Pencil/></button><button onClick={()=>nav(`/stock-card?product=${p.id}`)} title="Stock Card"><ScrollText/></button></div></td></tr>:<tr key={p.id} className={selected.includes(p.id)?'selected-row':''}><td><input type="checkbox" checked={selected.includes(p.id)} onChange={()=>toggleOne(p.id)} aria-label={`เลือก ${p.productName}`}/></td><td>{(page-1)*size+index+1}</td><td>{p.productCode}</td><td className="num">{fmt(p.openingBalance??p.currentStock)}</td><td>{p.productName}</td><td>{p.unit}</td><td className="num">{fmt(p.currentStock)}</td><td>{p.minStock} / {p.maxStock}</td><td><StatusBadge status={stockStatus(p)}/></td><td><span className={p.defaultLocationName?'badge green':'badge orange'}>{p.defaultLocationName||'ยังไม่จัดเก็บ'}</span></td><td><div className="row-actions"><button onClick={()=>setView(p)} title="ดู"><Eye/></button><button onClick={()=>setEditing(p)} title="แก้ไข"><Pencil/></button><button onClick={()=>nav(`/stock-card?product=${p.id}`)} title="Stock Card"><ScrollText/></button></div></td></tr>)}</tbody></table>{!list.length&&<Empty/>}</div>
      <Pagination page={page} setPage={setPage} total={list.length} size={size} setSize={setSize}/>
    </div>
    {editing&&<ProductForm product={editing} columns={excelColumns[editing.warehouseGroup]||sourceColumns} onClose={()=>setEditing(null)}/>}
    {view&&<Modal title="รายละเอียดสินค้า" onClose={()=>setView(null)}><div className="detail-grid">{[['Barcode',view.barcode],['รหัสสินค้า',view.productCode],['ชื่อสินค้า',view.productName],['กลุ่มคลัง',g.name],['หน่วย',view.unit],['Stock ปัจจุบัน',fmt(view.currentStock)],['ขั้นต่ำ',view.minStock],['ขั้นสูง',view.maxStock]].map(item=><div key={item[0]}><small>{item[0]}</small><b>{item[1]}</b></div>)}</div></Modal>}
    {confirmDelete&&<ConfirmModal title="ยืนยันการลบสินค้า" text={`ต้องการลบสินค้าที่เลือก ${selectedInList.length} รายการออกจากคลัง ${g.name} หรือไม่? ข้อมูล Stock Card เดิมจะยังถูกเก็บไว้`} onClose={()=>setConfirmDelete(false)} onConfirm={deleteSelected}/>}
    {selectedInList.length>0&&<button className="map-assign-floating" onClick={openMapAssignment}><MapPinned/> นำสินค้าที่เลือก ({selectedInList.length}) ไปจัดลงแผนที่</button>}
    {editingHeaders&&<Modal title={`แก้ไขชื่อหัวตาราง · ${g.name}`} onClose={()=>setEditingHeaders(null)} wide><div className="header-name-grid">{tableColumns.map((column,index)=><label key={`${column}-${index}`}><small>ชื่อเดิม: {column}</small><input value={editingHeaders[index]||''} onChange={event=>setEditingHeaders(current=>current.map((value,itemIndex)=>itemIndex===index?event.target.value:value))}/></label>)}</div><div className="modal-actions"><button className="btn ghost" onClick={()=>setEditingHeaders(tableColumns)}>คืนค่าชื่อเดิม</button><button className="btn ghost" onClick={()=>setEditingHeaders(null)}>ยกเลิก</button><button className="btn primary" onClick={saveHeaders}><Save/> บันทึกชื่อหัวตาราง</button></div></Modal>}
    {preview.length>0&&<Modal title={`ตัวอย่างข้อมูลนำเข้า · ${g.name}`} onClose={()=>setPreview([])} wide><div className="import-summary"><b>พร้อมนำเข้า {preview.filter(row=>row._valid).length} รายการ</b><span>เพิ่มใหม่ {preview.filter(row=>row._valid&&!row.existingId).length} · อัปเดตเดิม {preview.filter(row=>row._valid&&row.existingId).length} · ผิดพลาด {preview.filter(row=>!row._valid).length}</span></div><div className="table-wrap preview"><table><thead><tr><th>แถว</th><th>Barcode / รหัส</th><th>ชื่อสินค้า</th><th>หน่วย</th><th>Stock ในไฟล์</th><th>ผลตรวจสอบ</th></tr></thead><tbody>{preview.map(row=><tr key={row._row}><td>{row._row}</td><td><b>{row.barcode||'—'}</b><small>{row.productCode||'—'}</small></td><td>{row.productName||'—'}</td><td>{row.unit}</td><td>{row.currentStock}</td><td>{row._valid?<span className="badge green">{row.existingId?'อัปเดตข้อมูลเดิม':'เพิ่มรายการใหม่'}</span>:<span className="badge red" title={row.errors.join(', ')}>{row.errors.join(', ')}</span>}</td></tr>)}</tbody></table></div><div className="modal-actions"><button className="btn ghost" onClick={()=>setPreview([])}>ยกเลิก</button><button className="btn primary" disabled={!preview.some(row=>row._valid)} onClick={importRows}>นำเข้า {preview.filter(row=>row._valid).length} รายการ</button></div></Modal>}
  </div>;
}
