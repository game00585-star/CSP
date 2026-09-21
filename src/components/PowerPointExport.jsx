import {useState} from 'react';
import {FileChartColumnIncreasing,Presentation} from 'lucide-react';
import {Modal} from './common';

const THAI_FONT='Tahoma';
const cleanText=value=>String(value||'').replace(/\s+/g,' ').trim();
const pptColor=value=>{const rgb=String(value||'').match(/\d+/g);return rgb?.length>=3?rgb.slice(0,3).map(number=>Number(number).toString(16).padStart(2,'0')).join('').toUpperCase():String(value||'#64748B').replace('#','')};
const safeName=value=>String(value||'CSP-Warehouse-Presentation').replace(/[\\/:*?"<>|]/g,'-');
const pageTitle=()=>document.querySelector('main h1,main .page-title h1,main header h1')?.textContent?.trim()||document.title||'CSP Warehouse Management System';

const contain=(sourceWidth,sourceHeight,maxWidth,maxHeight)=>{
  const ratio=Math.min(maxWidth/sourceWidth,maxHeight/sourceHeight);
  return {w:sourceWidth*ratio,h:sourceHeight*ratio};
};

const svgPngData=(svg,cropElement)=>new Promise((resolve,reject)=>{
  const clientBox=svg.getBoundingClientRect(),cropBox=cropElement?.getBBox?.(),left=cropBox?.x??0,top=cropBox?.y??0,width=Math.max(1,Math.round(cropBox?.width||clientBox.width)),height=Math.max(1,Math.round(cropBox?.height||clientBox.height));
  const copy=svg.cloneNode(true);
  copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',width);copy.setAttribute('height',height);
  copy.setAttribute('viewBox',`${left} ${top} ${width} ${height}`);
  copy.querySelectorAll('text,tspan').forEach(node=>{node.setAttribute('font-family','Tahoma, Arial, sans-serif');node.style.fontFamily='Tahoma, Arial, sans-serif'});
  const source=new XMLSerializer().serializeToString(copy),blob=new Blob([source],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),image=new Image();
  image.onload=()=>{const scale=3,canvas=document.createElement('canvas');canvas.width=width*scale;canvas.height=height*scale;const context=canvas.getContext('2d');context.scale(scale,scale);context.fillStyle='#FFFFFF';context.fillRect(0,0,width,height);context.drawImage(image,0,0,width,height);URL.revokeObjectURL(url);resolve({data:canvas.toDataURL('image/png'),width,height})};
  image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('ไม่สามารถแปลงกราฟเป็นรูปภาพได้'))};image.src=url;
});

const donutData=card=>({
  total:cleanText(card?.querySelector('.map-donut > div:last-child')?.textContent),
  legend:[...(card?.querySelectorAll('.map-chart-legend span')||[])].map(item=>({text:cleanText(item.textContent),color:item.querySelector('i')?.style.backgroundColor||'#64748B'})),
});

const addHeader=(pptx,slide,titleText)=>{
  slide.background={color:'F8FAFC'};
  slide.addText(titleText,{x:.6,y:.28,w:12.1,h:.42,fontFace:THAI_FONT,fontSize:20,bold:true,color:'123B68',margin:0,fit:'shrink'});
  slide.addShape(pptx.ShapeType.line,{x:.6,y:.9,w:12.1,h:0,line:{color:'CBD5E1',width:1}});
};

export default function PowerPointExport({name='CSP-Warehouse-Presentation'}){
  const [open,setOpen]=useState(false),[title,setTitle]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const exportPpt=async()=>{
    setBusy(true);setError('');
    try{
      const charts=[...document.querySelectorAll('.recharts-wrapper svg')];
      if(!charts.length)throw new Error('ไม่พบกราฟในหน้าปัจจุบัน');
      const {default:PptxGenJS}=await import('pptxgenjs'),pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='CSP Foods Supply Co., Ltd.';pptx.subject='รายงานจากระบบ CSP Warehouse';pptx.title=title||pageTitle();pptx.company='CSP Foods Supply Co., Ltd.';pptx.lang='th-TH';pptx.theme={headFontFace:THAI_FONT,bodyFontFace:THAI_FONT,lang:'th-TH'};
      for(const [index,svg] of charts.entries()){
        const card=svg.closest('.card')||svg.closest('section')||svg.parentElement,titleText=cleanText(card?.querySelector('h2,h3')?.textContent)||`กราฟที่ ${index+1}`,isDonut=Boolean(card?.querySelector('.map-donut')),donut=donutData(card),png=await svgPngData(svg,isDonut?svg.querySelector('.recharts-pie'):null),chartSlide=pptx.addSlide();addHeader(pptx,chartSlide,titleText);
        const fitted=contain(png.width,png.height,isDonut?3.35:11.5,isDonut?3.35:5.55),imageX=(13.333-fitted.w)/2,imageY=isDonut?1.45:1.25+(5.55-fitted.h)/2;
        chartSlide.addImage({data:png.data,x:imageX,y:imageY,w:fitted.w,h:fitted.h});
        if(isDonut){
          chartSlide.addText(donut.total||'0 จุด',{x:5.75,y:2.82,w:1.83,h:.65,fontFace:THAI_FONT,fontSize:20,bold:true,color:'0F2745',align:'center',valign:'mid',margin:0,fit:'shrink'});
          const legendWidth=Math.min(9.5,Math.max(4,donut.legend.length*2.15)),startX=(13.333-legendWidth)/2,itemWidth=legendWidth/Math.max(1,donut.legend.length);
          donut.legend.forEach((item,itemIndex)=>{const x=startX+(itemIndex*itemWidth),color=pptColor(item.color);chartSlide.addShape(pptx.ShapeType.ellipse,{x,y:5.42,w:.12,h:.12,fill:{color},line:{color}});chartSlide.addText(item.text,{x:x+.18,y:5.34,w:itemWidth-.2,h:.3,fontFace:THAI_FONT,fontSize:10.5,color:'475569',margin:0,fit:'shrink'})});
        }
      }
      await pptx.writeFile({fileName:`${safeName(name)}.pptx`});setOpen(false);
    }catch(exportError){setError(exportError.message||'สร้าง PowerPoint ไม่สำเร็จ')}finally{setBusy(false)}
  };
  return <><button className="btn secondary" onClick={()=>{setTitle(pageTitle());setOpen(true)}}><Presentation size={17}/> Export PowerPoint</button>{open&&<Modal title="สร้าง PowerPoint จากกราฟทั้งหมด" onClose={()=>!busy&&setOpen(false)}><div className="ppt-export-form"><div className="ppt-export-icon"><FileChartColumnIncreasing/></div><p>ระบบจะสร้างสไลด์แยกเฉพาะกราฟทุกกราฟที่แสดงอยู่ในหน้าปัจจุบัน</p><label>ชื่อไฟล์ PowerPoint<input value={title} onChange={event=>setTitle(event.target.value)} placeholder="ชื่อไฟล์ PowerPoint"/></label>{error&&<div className="alert full">{error}</div>}</div><div className="modal-actions"><button className="btn ghost" disabled={busy} onClick={()=>setOpen(false)}>ยกเลิก</button><button className="btn primary" disabled={busy||!title.trim()} onClick={exportPpt}><Presentation/> {busy?'กำลังสร้างไฟล์...':'สร้าง PowerPoint'}</button></div></Modal>}</>;
}
