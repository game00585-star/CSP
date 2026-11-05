import {useState} from 'react';
import {useNavigate,Navigate} from 'react-router-dom';
import {Warehouse,Eye,EyeOff,LockKeyhole,UserRound} from 'lucide-react';
import {authenticate,getAuthSession,setAuthSession} from '../utils/auth';
import Warehouse3D from '../components/Warehouse3D';

export default function LoginPage(){
  const [user,setUser]=useState(''),[pass,setPass]=useState(''),[show,setShow]=useState(false),[remember,setRemember]=useState(true),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const nav=useNavigate();
  if(getAuthSession())return <Navigate to="/warehouse-periods" replace/>;
  const submit=event=>{event.preventDefault();setError('');setLoading(true);try{const matched=authenticate(user,pass);setAuthSession(matched,remember);nav('/warehouse-periods')}catch(loginError){setError(loginError?.message||'ไม่สามารถเข้าสู่ระบบได้')}finally{setLoading(false)}};
  return <div className="login-page">
    <section className="login-visual">
      <Warehouse3D compact/>
      <div className="visual-content">
        <div className="visual-logo"><Warehouse/></div><p className="eyebrow">CSP WAREHOUSE OPERATIONS</p>
        <h1>คลังที่เคลื่อนไหว<br/>อย่างเป็นระบบ</h1><p>จัดการสินค้า รับเข้า จ่ายออก และโอนคลังอย่างแม่นยำในพื้นที่ทำงานเดียว</p>
        <div className="visual-stats"><div><b>5</b><span>กลุ่มคลัง</span></div><div><b>Stock Card</b><span>ติดตามการเคลื่อนไหว</span></div></div>
      </div>
    </section>
    <section className="login-form-wrap"><form onSubmit={submit} className="login-card">
      <div className="login-card-head"><div className="login-mark"><Warehouse/></div><span>SECURE ACCESS</span></div>
      <h2>ยินดีต้อนรับกลับ</h2><p>เข้าสู่ระบบจัดการคลังสินค้า CSP</p>{error&&<div className="alert">{error}</div>}
      <label>ชื่อผู้ใช้งาน<div className="input-icon"><UserRound/><input value={user} onChange={event=>setUser(event.target.value)} placeholder="กรอกชื่อผู้ใช้งาน" autoComplete="username" required/></div></label>
      <label>รหัสผ่าน<div className="input-icon"><LockKeyhole/><input type={show?'text':'password'} value={pass} onChange={event=>setPass(event.target.value)} placeholder="กรอกรหัสผ่าน" autoComplete="current-password" required/><button type="button" onClick={()=>setShow(!show)} aria-label="แสดงหรือซ่อนรหัสผ่าน">{show?<EyeOff/>:<Eye/>}</button></div></label>
      <div className="remember"><label><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/> จดจำการเข้าสู่ระบบ</label></div>
      <button className="btn primary login-btn" disabled={loading}>{loading?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}</button><small className="secure">ระบบภายในสำหรับพนักงาน CSP Foods Supply เท่านั้น</small>
    </form></section>
  </div>;
}
