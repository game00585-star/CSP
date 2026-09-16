import {NavLink} from 'react-router-dom';

export default function ReportNavigation({children,hideLinks=false}){
  return <div className="report-tabs">
    {children}
    {!hideLinks&&<><NavLink to="/stock-card" className={({isActive})=>isActive?'active':''}>Stock Card</NavLink>
    <NavLink to="/lot-balance" className={({isActive})=>isActive?'active':''}>Lot คงเหลือ</NavLink></>}
  </div>;
}
