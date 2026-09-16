import {NavLink} from 'react-router-dom';

export default function ReportNavigation({children}){
  return <div className="report-tabs">
    {children}
    <NavLink to="/stock-card" className={({isActive})=>isActive?'active':''}>Stock Card</NavLink>
    <NavLink to="/lot-balance" className={({isActive})=>isActive?'active':''}>Lot คงเหลือ</NavLink>
  </div>;
}
