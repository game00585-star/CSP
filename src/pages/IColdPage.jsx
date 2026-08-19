import {useState} from 'react';
import {ExternalLink,Thermometer,TriangleAlert} from 'lucide-react';
import {PageHeader} from '../components/common';

const icoldUrl='https://i-elitech.com/';
const openICold=()=>window.open(icoldUrl,'_blank','noopener,noreferrer');

export default function IColdPage(){
  const [failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
  return <div className="icold-page">
    <PageHeader title="อุณหภูมิคลัง (iCold)" subtitle="ตรวจสอบอุณหภูมิคลังสินค้าผ่านระบบ Elitech iCold" actions={<button className="btn primary" onClick={openICold}><ExternalLink/> เปิด iCold ในหน้าต่างใหม่</button>}/>
    <section className="icold-shell card">
      {!failed&&<><div className={`icold-loading ${loaded?'hidden':''}`}><Thermometer/><b>กำลังเชื่อมต่อ Elitech iCold</b><span>โปรดรอสักครู่...</span></div><iframe src={icoldUrl} title="Elitech iCold" onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} allow="fullscreen" referrerPolicy="strict-origin-when-cross-origin"/></>}
      {failed&&<IColdFallback/>}
    </section>
    {!failed&&<div className="icold-help"><TriangleAlert/><span>หากพื้นที่ด้านบนว่างหรือเว็บไซต์ปฏิเสธการแสดงผล แสดงว่า Elitech iCold ไม่อนุญาตให้ฝังผ่าน iframe</span><button className="btn secondary" onClick={()=>setFailed(true)}>หน้า iCold ไม่แสดง</button></div>}
  </div>;
}

function IColdFallback(){return <div className="icold-fallback"><span className="icold-fallback-icon"><Thermometer/></span><h2>ไม่สามารถแสดง Elitech iCold ภายในหน้านี้ได้</h2><p>Elitech iCold ไม่อนุญาตให้แสดงภายในเว็บไซต์นี้ กรุณากดปุ่มด้านล่างเพื่อเปิดระบบ iCold</p><button className="btn primary" onClick={openICold}><ExternalLink/> เปิด Elitech iCold</button></div>}
