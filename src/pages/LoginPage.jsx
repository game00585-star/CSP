import {useEffect,useRef,useState} from 'react';
import {useNavigate,Navigate} from 'react-router-dom';
import {Warehouse,Eye,EyeOff,LockKeyhole,UserRound} from 'lucide-react';
import {authenticate,getAuthSession,setAuthSession} from '../utils/auth';
import Warehouse3D from '../components/Warehouse3D';
import {warehouseGroups} from '../data/constants';
import './loginIntro.css';

export default function LoginPage(){
  const [user,setUser]=useState(''),[pass,setPass]=useState(''),[show,setShow]=useState(false),[remember,setRemember]=useState(true),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const [introVisible,setIntroVisible]=useState(true),[introLeaving,setIntroLeaving]=useState(false),[introError,setIntroError]=useState(false);
  const introVideo=useRef(null);
  const nav=useNavigate();
  const existingSession=getAuthSession();
  useEffect(()=>{
    if(existingSession)return undefined;
    const video=introVideo.current;
    if(!video)return undefined;
    const play=video.play();
    if(play?.catch)play.catch(()=>setIntroError(true));
    return undefined;
  },[existingSession]);
  if(existingSession)return <Navigate to="/warehouse-periods" replace/>;
  const finishIntro=()=>{
    if(introLeaving)return;
    setIntroLeaving(true);
    window.setTimeout(()=>setIntroVisible(false),650);
  };
  const submit=event=>{event.preventDefault();setError('');setLoading(true);try{const matched=authenticate(user,pass);setAuthSession(matched,remember);nav('/warehouse-periods')}catch(loginError){setError(loginError?.message||'ไม่สามารถเข้าสู่ระบบได้')}finally{setLoading(false)}};
  return <>
    {introVisible&&<section className={`login-intro${introLeaving?' is-leaving':''}`} aria-label="ภาพเปิดระบบ CSP Warehouse">
      <video ref={introVideo} className="login-intro-video" muted playsInline preload="auto" autoPlay onEnded={finishIntro} onError={()=>setIntroError(true)}>
        <source src="/media/csp-login-intro.mp4" type="video/mp4"/>
      </video>
      {introError&&<div className="login-intro-fallback" role="status"><strong>วิดีโอพร้อมเล่น</strong><span>กดเพื่อดำเนินการต่อเข้าสู่ระบบ</span></div>}
      <button type="button" className="login-intro-skip" onClick={finishIntro}>{introError?'เข้าสู่หน้า Login':'ข้ามเข้าสู่ระบบ'}</button>
      <div className="login-intro-progress" aria-hidden="true"/>
    </section>}
    <div className={`login-page login-after-intro${introVisible?' is-waiting':''}`}>
    <section className="login-visual">
      <Warehouse3D compact/>
      <div className="visual-content">
        <div className="visual-brand"><div className="visual-logo"><Warehouse/></div><div><b>CSP</b><span>Foods Supply</span></div></div><p className="eyebrow">CSP WAREHOUSE OPERATIONS</p>
        <h1>คลังที่เคลื่อนไหว<br/>อย่างเป็นระบบ</h1><p>จัดการสินค้า รับเข้า จ่ายออก และโอนคลังอย่างแม่นยำในพื้นที่ทำงานเดียว</p>
        <div className="visual-stats"><div><b>{warehouseGroups.length}</b><span>กลุ่มคลัง</span></div><div><b>Stock Card</b><span>ติดตามการเคลื่อนไหว</span></div></div>
      </div>
    </section>
    <section className="login-form-wrap"><form onSubmit={submit} className="login-card">
      <div className="login-mobile-brand"><Warehouse/><div><b>CSP</b><span>Foods Supply</span></div></div>
      <div className="login-card-head"><div className="login-mark"><Warehouse/></div><span>SECURE ACCESS</span></div>
      <h2>ยินดีต้อนรับกลับ</h2><p>เข้าสู่ระบบจัดการคลังสินค้า CSP</p>{error&&<div className="alert">{error}</div>}
      <label>ชื่อผู้ใช้งาน<div className="input-icon"><UserRound/><input value={user} onChange={event=>setUser(event.target.value)} placeholder="กรอกชื่อผู้ใช้งาน" autoComplete="username" required/></div></label>
      <label>รหัสผ่าน<div className="input-icon"><LockKeyhole/><input type={show?'text':'password'} value={pass} onChange={event=>setPass(event.target.value)} placeholder="กรอกรหัสผ่าน" autoComplete="current-password" required/><button type="button" onClick={()=>setShow(!show)} aria-label="แสดงหรือซ่อนรหัสผ่าน">{show?<EyeOff/>:<Eye/>}</button></div></label>
      <div className="remember"><label><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/> จดจำการเข้าสู่ระบบ</label></div>
      <button className="btn primary login-btn" disabled={loading}>{loading?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}</button><small className="secure">ระบบภายในสำหรับพนักงาน CSP Foods Supply เท่านั้น</small>
    </form></section>
    </div>
  </>;
}

