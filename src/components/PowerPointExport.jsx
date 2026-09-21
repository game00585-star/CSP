import {useState} from 'react';
import {FileChartColumnIncreasing,Presentation} from 'lucide-react';
import {Modal} from './common';

const svgData=svg=>{
  const copy=svg.cloneNode(true),box=svg.getBoundingClientRect();
  copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',Math.max(1,Math.round(box.width)));copy.setAttribute('height',Math.max(1,Math.round(box.height)));
  const text=new XMLSerializer().serializeToString(copy),bytes=new TextEncoder().encode(text);let binary='';bytes.forEach(byte=>{binary+=String.fromCharCode(byte)});
  return`data:image/svg+xml;base64,${btoa(binary)}`;
};
const safeName=value=>String(value||'CSP-Warehouse-Presentation').replace(/[\\/:*?"<>|]/g,'-');
const pageTitle=()=>document.querySelector('main h1,main .page-title h1,main header h1')?.textContent?.trim()||document.title||'CSP Warehouse Management System';
const pageMetrics=()=>[...document.querySelectorAll('.stats-grid>*,.map-summary>*,.count-summary-stats>*')].slice(0,12).map(item=>item.textContent.replace(/\s+/g,' ').trim()).filter(Boolean);

export default function PowerPointExport({name='CSP-Warehouse-Presentation'}){
  const [open,setOpen]=useState(false),[title,setTitle]=useState(''),[summary,setSummary]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const exportPpt=async()=>{
    setBusy(true);setError('');
    try{
      const charts=[...document.querySelectorAll('.recharts-wrapper svg')];
      if(!charts.length)throw new Error('ไม่พบกราฟในหน้าปัจจุบัน');
      const {default:PptxGenJS}=await import('pptxgenjs'),pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='CSP Foods Supply Co., Ltd.';pptx.subject='รายงานจากระบบ CSP Warehouse';pptx.title=title||pageTitle();pptx.company='CSP Foods Supply Co., Ltd.';pptx.lang='th-TH';pptx.theme={headFontFace:'Tahoma',bodyFontFace:'Tahoma',lang:'th-TH'};
      let slide=pptx.addSlide();slide.background={color:'F3F7FC'};slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:1.15,fill:{color:'123B68'},line:{color:'123B68'}});slide.addText('CSP Warehouse Management System',{x:.65,y:.3,w:12,h:.45,fontFace:'Tahoma',fontSize:15,bold:true,color:'FFFFFF'});slide.addText(title||pageTitle(),{x:.7,y:2.2,w:11.9,h:.8,fontFace:'Tahoma',fontSize:28,bold:true,color:'10213D',align:'center'});slide.addText(`จัดทำเมื่อ ${new Date().toLocaleString('th-TH')}`,{x:.7,y:3.2,w:11.9,h:.35,fontFace:'Tahoma',fontSize:12,color:'64748B',align:'center'});
      slide=pptx.addSlide();slide.addText('สรุปสำหรับนำไปใช้งานต่อ',{x:.55,y:.35,w:12.2,h:.45,fontFace:'Tahoma',fontSize:22,bold:true,color:'123B68'});slide.addShape(pptx.ShapeType.line,{x:.55,y:.95,w:12.2,h:0,line:{color:'CBD5E1',width:1}});slide.addText(summary.trim()||'ผู้ใช้ไม่ได้ระบุข้อความสรุปเพิ่มเติม',{x:.7,y:1.25,w:11.9,h:2.2,fontFace:'Tahoma',fontSize:17,color:'1E293B',breakLine:false,margin:.12,valign:'top'});const metrics=pageMetrics();if(metrics.length){slide.addText('ตัวเลขสำคัญจากหน้ารายงาน',{x:.7,y:3.75,w:11.9,h:.35,fontFace:'Tahoma',fontSize:16,bold:true,color:'123B68'});slide.addText(metrics.map(value=>({text:`• ${value}\n`,options:{bullet:false}})),{x:.85,y:4.2,w:11.5,h:2.6,fontFace:'Tahoma',fontSize:13,color:'334155',breakLine:false,margin:.06})}
      charts.forEach((svg,index)=>{const card=svg.closest('.card')||svg.parentElement,titleText=card?.querySelector('h2,h3')?.textContent?.trim()||`กราฟที่ ${index+1}`;const chartSlide=pptx.addSlide();chartSlide.addText(titleText,{x:.55,y:.3,w:12.2,h:.45,fontFace:'Tahoma',fontSize:20,bold:true,color:'123B68'});chartSlide.addShape(pptx.ShapeType.line,{x:.55,y:.9,w:12.2,h:0,line:{color:'CBD5E1',width:1}});chartSlide.addImage({data:svgData(svg),x:.7,y:1.15,w:11.9,h:5.75});chartSlide.addText(`แหล่งข้อมูล: ${pageTitle()} · ${new Date().toLocaleDateString('th-TH')}`,{x:.7,y:7.05,w:11.9,h:.2,fontFace:'Tahoma',fontSize:8,color:'94A3B8',align:'right'})});
      await pptx.writeFile({fileName:`${safeName(name)}.pptx`});setOpen(false);
    }catch(exportError){setError(exportError.message||'สร้าง PowerPoint ไม่สำเร็จ')}finally{setBusy(false)}
  };
  return <><button className="btn secondary" onClick={()=>{setTitle(pageTitle());setOpen(true)}}><Presentation size={17}/> Export PowerPoint</button>{open&&<Modal title="สร้าง PowerPoint จากกราฟทั้งหมด" onClose={()=>!busy&&setOpen(false)}><div className="ppt-export-form"><div className="ppt-export-icon"><FileChartColumnIncreasing/></div><p>ระบบจะสร้างหน้าปก หน้าสรุป และสไลด์แยกสำหรับกราฟทุกกราฟที่แสดงอยู่ในหน้าปัจจุบัน</p><label>ชื่อรายงาน<input value={title} onChange={event=>setTitle(event.target.value)} placeholder="ชื่อรายงาน PowerPoint"/></label><label>ข้อความสรุปที่ต้องการนำไปใช้ต่อ<textarea value={summary} onChange={event=>setSummary(event.target.value)} placeholder="ตัวอย่าง: สรุปการใช้พื้นที่คลัง จุดที่เต็ม ปริมาณสินค้า และข้อเสนอแนะสำหรับการประชุม"/></label>{error&&<div className="alert full">{error}</div>}</div><div className="modal-actions"><button className="btn ghost" disabled={busy} onClick={()=>setOpen(false)}>ยกเลิก</button><button className="btn primary" disabled={busy||!title.trim()} onClick={exportPpt}><Presentation/> {busy?'กำลังสร้างไฟล์...':'สร้าง PowerPoint'}</button></div></Modal>}</>;
}
