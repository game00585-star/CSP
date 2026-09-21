import {useState} from 'react';
import {FileChartColumnIncreasing,Presentation} from 'lucide-react';
import {Modal} from './common';

const THAI_FONT='Tahoma';
const cleanText=value=>String(value||'').replace(/\s+/g,' ').trim();
const safeName=value=>String(value||'CSP-Warehouse-Presentation').replace(/[\\/:*?"<>|]/g,'-');
const pageTitle=()=>document.querySelector('main h1,main .page-title h1,main header h1')?.textContent?.trim()||document.title||'CSP Warehouse Management System';
const pageMetrics=()=>[...document.querySelectorAll('.stats-grid>*,.map-summary>*,.count-summary-stats>*')].slice(0,12).map(item=>cleanText(item.textContent)).filter(Boolean);

const contain=(sourceWidth,sourceHeight,maxWidth,maxHeight)=>{
  const ratio=Math.min(maxWidth/sourceWidth,maxHeight/sourceHeight);
  return {w:sourceWidth*ratio,h:sourceHeight*ratio};
};

const svgPngData=svg=>new Promise((resolve,reject)=>{
  const box=svg.getBoundingClientRect(),width=Math.max(1,Math.round(box.width)),height=Math.max(1,Math.round(box.height));
  const copy=svg.cloneNode(true);
  copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',width);copy.setAttribute('height',height);
  if(!copy.getAttribute('viewBox'))copy.setAttribute('viewBox',`0 0 ${width} ${height}`);
  copy.querySelectorAll('text,tspan').forEach(node=>{node.setAttribute('font-family','Tahoma, Arial, sans-serif');node.style.fontFamily='Tahoma, Arial, sans-serif'});
  const source=new XMLSerializer().serializeToString(copy),blob=new Blob([source],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),image=new Image();
  image.onload=()=>{const scale=3,canvas=document.createElement('canvas');canvas.width=width*scale;canvas.height=height*scale;const context=canvas.getContext('2d');context.scale(scale,scale);context.fillStyle='#FFFFFF';context.fillRect(0,0,width,height);context.drawImage(image,0,0,width,height);URL.revokeObjectURL(url);resolve({data:canvas.toDataURL('image/png'),width,height})};
  image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('ไม่สามารถแปลงกราฟเป็นรูปภาพได้'))};image.src=url;
});

const chartDetails=card=>{
  if(!card)return[];
  const selectors=['.map-donut > div:last-child','.map-chart-legend span','.recharts-legend-item-text','.same-month-note'];
  return [...card.querySelectorAll(selectors.join(','))].map(item=>cleanText(item.textContent)).filter((value,index,list)=>value&&list.indexOf(value)===index).slice(0,8);
};

const addHeader=(pptx,slide,titleText)=>{
  slide.background={color:'F8FAFC'};
  slide.addText(titleText,{x:.6,y:.28,w:12.1,h:.42,fontFace:THAI_FONT,fontSize:20,bold:true,color:'123B68',margin:0,fit:'shrink'});
  slide.addShape(pptx.ShapeType.line,{x:.6,y:.9,w:12.1,h:0,line:{color:'CBD5E1',width:1}});
};

export default function PowerPointExport({name='CSP-Warehouse-Presentation'}){
  const [open,setOpen]=useState(false),[title,setTitle]=useState(''),[summary,setSummary]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const exportPpt=async()=>{
    setBusy(true);setError('');
    try{
      const charts=[...document.querySelectorAll('.recharts-wrapper svg')];
      if(!charts.length)throw new Error('ไม่พบกราฟในหน้าปัจจุบัน');
      const {default:PptxGenJS}=await import('pptxgenjs'),pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='CSP Foods Supply Co., Ltd.';pptx.subject='รายงานจากระบบ CSP Warehouse';pptx.title=title||pageTitle();pptx.company='CSP Foods Supply Co., Ltd.';pptx.lang='th-TH';pptx.theme={headFontFace:THAI_FONT,bodyFontFace:THAI_FONT,lang:'th-TH'};
      let slide=pptx.addSlide();slide.background={color:'F3F7FC'};slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:1.15,fill:{color:'123B68'},line:{color:'123B68'}});slide.addText('CSP Warehouse Management System',{x:.65,y:.3,w:12,h:.45,fontFace:THAI_FONT,fontSize:15,bold:true,color:'FFFFFF',margin:0});slide.addText(title||pageTitle(),{x:.9,y:2.25,w:11.5,h:.85,fontFace:THAI_FONT,fontSize:27,bold:true,color:'10213D',align:'center',valign:'mid',margin:0,fit:'shrink'});slide.addText(`จัดทำเมื่อ ${new Date().toLocaleString('th-TH')}`,{x:.9,y:3.35,w:11.5,h:.35,fontFace:THAI_FONT,fontSize:12,color:'64748B',align:'center',margin:0});
      slide=pptx.addSlide();addHeader(pptx,slide,'สรุปสำหรับนำไปใช้งานต่อ');slide.addShape(pptx.ShapeType.roundRect,{x:.65,y:1.25,w:12,h:2.05,rectRadius:.05,fill:{color:'EEF4FB'},line:{color:'D7E3F1',width:1}});slide.addText(summary.trim()||'ผู้ใช้ไม่ได้ระบุข้อความสรุปเพิ่มเติม',{x:.95,y:1.55,w:11.4,h:1.45,fontFace:THAI_FONT,fontSize:16,color:'1E293B',margin:.05,valign:'top',breakLine:false,fit:'shrink'});const metrics=pageMetrics();if(metrics.length){slide.addText('ตัวเลขสำคัญจากหน้ารายงาน',{x:.7,y:3.75,w:11.9,h:.35,fontFace:THAI_FONT,fontSize:16,bold:true,color:'123B68',margin:0});slide.addText(metrics.map(value=>({text:`• ${value}\n`,options:{bullet:false}})),{x:.85,y:4.2,w:11.5,h:2.45,fontFace:THAI_FONT,fontSize:12.5,color:'334155',margin:.04,breakLine:false,fit:'shrink'})}
      for(const [index,svg] of charts.entries()){
        const card=svg.closest('.card')||svg.closest('section')||svg.parentElement,titleText=cleanText(card?.querySelector('h2,h3')?.textContent)||`กราฟที่ ${index+1}`,details=chartDetails(card),png=await svgPngData(svg),chartSlide=pptx.addSlide();addHeader(pptx,chartSlide,titleText);
        chartSlide.addShape(pptx.ShapeType.roundRect,{x:.55,y:1.15,w:8.45,h:5.65,rectRadius:.04,fill:{color:'FFFFFF'},line:{color:'DCE5EF',width:1}});
        const fitted=contain(png.width,png.height,7.95,5.05),imageX=.8+(7.95-fitted.w)/2,imageY=1.45+(5.05-fitted.h)/2;
        chartSlide.addImage({data:png.data,x:imageX,y:imageY,w:fitted.w,h:fitted.h});
        chartSlide.addShape(pptx.ShapeType.roundRect,{x:9.25,y:1.15,w:3.53,h:5.65,rectRadius:.04,fill:{color:'EEF4FB'},line:{color:'D7E3F1',width:1}});chartSlide.addText('สรุปข้อมูล',{x:9.55,y:1.48,w:2.93,h:.35,fontFace:THAI_FONT,fontSize:16,bold:true,color:'123B68',margin:0});
        const detailRuns=details.length?details.map(value=>({text:`• ${value}\n`,options:{bullet:false}})):[{text:'• กราฟแสดงข้อมูลตามตัวกรองที่เลือก\n',options:{bullet:false}},{text:`• วันที่ออกรายงาน ${new Date().toLocaleDateString('th-TH')}\n`,options:{bullet:false}}];
        chartSlide.addText(detailRuns,{x:9.55,y:2,w:2.93,h:3.85,fontFace:THAI_FONT,fontSize:12.5,color:'334155',margin:.03,breakLine:false,valign:'top',fit:'shrink'});chartSlide.addText(`แหล่งข้อมูล: ${pageTitle()}`,{x:9.55,y:6.18,w:2.93,h:.32,fontFace:THAI_FONT,fontSize:8.5,color:'64748B',margin:0,fit:'shrink'});
      }
      await pptx.writeFile({fileName:`${safeName(name)}.pptx`});setOpen(false);
    }catch(exportError){setError(exportError.message||'สร้าง PowerPoint ไม่สำเร็จ')}finally{setBusy(false)}
  };
  return <><button className="btn secondary" onClick={()=>{setTitle(pageTitle());setOpen(true)}}><Presentation size={17}/> Export PowerPoint</button>{open&&<Modal title="สร้าง PowerPoint จากกราฟทั้งหมด" onClose={()=>!busy&&setOpen(false)}><div className="ppt-export-form"><div className="ppt-export-icon"><FileChartColumnIncreasing/></div><p>ระบบจะสร้างหน้าปก หน้าสรุป และสไลด์แยกสำหรับกราฟทุกกราฟที่แสดงอยู่ในหน้าปัจจุบัน</p><label>ชื่อรายงาน<input value={title} onChange={event=>setTitle(event.target.value)} placeholder="ชื่อรายงาน PowerPoint"/></label><label>ข้อความสรุปที่ต้องการนำไปใช้ต่อ<textarea value={summary} onChange={event=>setSummary(event.target.value)} placeholder="ตัวอย่าง: สรุปการใช้พื้นที่คลัง จุดที่เต็ม ปริมาณสินค้า และข้อเสนอแนะสำหรับการประชุม"/></label>{error&&<div className="alert full">{error}</div>}</div><div className="modal-actions"><button className="btn ghost" disabled={busy} onClick={()=>setOpen(false)}>ยกเลิก</button><button className="btn primary" disabled={busy||!title.trim()} onClick={exportPpt}><Presentation/> {busy?'กำลังสร้างไฟล์...':'สร้าง PowerPoint'}</button></div></Modal>}</>;
}
