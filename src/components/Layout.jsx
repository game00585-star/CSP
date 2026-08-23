import {useEffect,useState} from 'react';
import {NavLink,useLocation,useNavigate,Outlet} from 'react-router-dom';
import {LayoutDashboard,Warehouse,PackagePlus,PackageMinus,ArrowRightLeft,ScrollText,ChartNoAxesCombined,Settings,LogOut,Menu,Bell,ChevronDown,ChevronLeft,PanelLeftClose,FileClock,ListChecks,MapPinned,Thermometer,ClipboardCheck,CalendarRange} from 'lucide-react';
import {warehouseGroups} from '../data/constants';
import {useApp} from '../context/AppContext';

const menu=[['/dashboard','Dashboard',LayoutDashboard],['/warehouse-periods','รอบเดือนคลัง',CalendarRange],['/warehouse-map/all','แผนที่จุดเก็บ',MapPinned],['/icold','อุณหภูมิคลัง (iCold)',Thermometer],['/receive','รับสินค้าเข้าคลัง',PackagePlus],['/issue','จ่ายสินค้าออกจากคลัง',PackageMinus],['/transfer','โอนระหว่างคลัง',ArrowRightLeft],['/stock-count','นับสต็อกสินค้า',ClipboardCheck],['/stock-card','Stock Card',ScrollText],['/reports','รายงาน',ChartNoAxesCombined],['/change-requests','รายการแก้ไข',ListChecks],['/audit-log','Audit Log',FileClock],['/settings','ตั้งค่า',Settings]];
const titles={dashboard:'Dashboard','warehouse-periods':'รอบเดือนคลัง',warehouse:'ยอดยกมา','warehouse-map':'แผนที่จุดเก็บ',icold:'อุณหภูมิคลัง (iCold)',receive:'รับสินค้าเข้าคลัง',issue:'จ่ายสินค้าออกจากคลัง',transfer:'โอนระหว่างคลัง','stock-count':'นับสต็อกสินค้า','stock-card':'Stock Card',products:'ข้อมูลสินค้า',reports:'รายงาน','change-requests':'รายการแก้ไข','audit-log':'Audit Log',settings:'ตั้งค่า'};

export default function Layout(){
  const [collapsed,setCollapsed]=useState(false),[mobile,setMobile]=useState(false),[wareOpen,setWareOpen]=useState(true),[userOpen,setUserOpen]=useState(false);
  const nav=useNavigate(),loc=useLocation(),{toast,activePeriod,viewingPeriod}=useApp(),currentPeriod=activePeriod||viewingPeriod,locked=!currentPeriod;
  useEffect(()=>{if(locked&&loc.pathname!=='/warehouse-periods')nav('/warehouse-periods',{replace:true})},[locked,loc.pathname,nav]);
  const logout=()=>{localStorage.removeItem('csp_auth');nav('/login')},title=titles[loc.pathname.split('/')[1]]||'CSP Warehouse';
  const visibleMenu=locked?menu.filter(([to])=>to==='/warehouse-periods'):menu;
  return <div className="app-shell">
    <aside className={`sidebar ${collapsed?'collapsed':''} ${mobile?'mobile-open':''}`}>
      <div className="brand"><div className="brand-mark"><Warehouse/></div>{!collapsed&&<div><b>CSP Warehouse</b><small>CSP Foods Supply Co., Ltd.</small></div>}<button className="mobile-close" onClick={()=>setMobile(false)}><ChevronLeft/></button></div>
      <nav>{!locked&&<><NavLink to="/dashboard" className="nav-item"><LayoutDashboard/><span>Dashboard</span></NavLink><button className="nav-item nav-button" onClick={()=>setWareOpen(!wareOpen)}><Warehouse/><span>ยอดยกมา</span><ChevronDown className={wareOpen?'rot':''}/></button>{wareOpen&&!collapsed&&<div className="subnav">{warehouseGroups.map(group=><NavLink key={group.id} to={`/warehouse/${group.path}`}>{group.name}</NavLink>)}</div>}</>}{visibleMenu.filter(([to])=>to!=='/dashboard').map(([to,label,Icon])=><NavLink key={to} to={to} className={({isActive})=>`nav-item ${(isActive||(to.startsWith('/warehouse-map')&&loc.pathname.startsWith('/warehouse-map/')))?'active':''}`}><Icon/><span>{label}</span></NavLink>)}</nav>
      <button className="nav-item logout" onClick={logout}><LogOut/><span>ออกจากระบบ</span></button>
    </aside>
    {mobile&&<div className="drawer-backdrop" onClick={()=>setMobile(false)}/>}<div className="main-wrap"><header><button className="icon-btn desktop-toggle" onClick={()=>setCollapsed(!collapsed)} aria-label="เปิดปิดเมนู"><PanelLeftClose/></button><button className="icon-btn mobile-toggle" onClick={()=>setMobile(true)} aria-label="เปิดเมนู"><Menu/></button><div className="header-title"><b>{title}</b><small>CSP Warehouse Management System · {title}</small></div>{activePeriod&&<span className="header-period"><CalendarRange/> รอบ {activePeriod.month}</span>}<div className="header-right"><button className="icon-btn notify"><Bell/><i>3</i></button><button className="user" onClick={()=>setUserOpen(!userOpen)}><span>ผ</span><div><b>ผู้ดูแลระบบ</b><small>Admin</small></div><ChevronDown/></button>{userOpen&&<div className="user-menu"><button onClick={logout}><LogOut/> ออกจากระบบ</button></div>}</div></header><main><Outlet/></main><footer>© 2026 CSP Foods Supply Co., Ltd.</footer></div>{toast&&<div className="toast">✓ {toast}</div>}
  </div>;
}
