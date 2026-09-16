import {useMemo,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowDownToLine,ArrowUpFromLine,ArrowRightLeft,Eye,PencilLine,Trash2,FilePenLine} from 'lucide-react';
import {PageHeader,Modal,ConfirmModal,Empty} from '../components/common';
import {fmt} from '../utils/helpers';
import {useApp} from '../context/AppContext';

const draftKey='csp_transaction_drafts';
const types={receive:{label:'รับสินค้าเข้าคลัง',path:'/receive',Icon:ArrowDownToLine},issue:{label:'จ่ายสินค้าออกจากคลัง',path:'/issue',Icon:ArrowUpFromLine},transfer:{label:'โอนระหว่างคลัง',path:'/transfer',Icon:ArrowRightLeft}};
const readDrafts=()=>{try{const stored=JSON.parse(localStorage.getItem(draftKey)||'{}');return Object.entries(stored).filter(([,draft])=>draft&&Array.isArray(draft.items)).map(([type,draft])=>({...draft,type}))}catch{return[]}};

export default function DraftsPage(){
  const navigate=useNavigate(),{setToast}=useApp();
  const [drafts,setDrafts]=useState(readDrafts),[view,setView]=useState(null),[deleting,setDeleting]=useState(null);
  const totalItems=useMemo(()=>drafts.reduce((sum,draft)=>sum+draft.items.length,0),[drafts]);
  const removeDraft=()=>{const stored=JSON.parse(localStorage.getItem(draftKey)||'{}');delete stored[deleting.type];localStorage.setItem(draftKey,JSON.stringify(stored));setDrafts(readDrafts());setDeleting(null);setToast('ลบแบบร่างแล้ว')};
  return <><PageHeader title="บันทึกแบบร่าง" subtitle={`เอกสารที่ยังไม่ยืนยัน ${drafts.length} ฉบับ · ${totalItems} รายการ`}/><div className="card drafts-list"><div className="table-wrap"><table><thead><tr><th>ประเภท</th><th>เลขที่เอกสาร</th><th>วันที่เอกสาร</th><th>คลัง</th><th>จำนวนรายการ</th><th>บันทึกล่าสุด</th><th>จัดการ</th></tr></thead><tbody>{drafts.map(draft=>{const meta=types[draft.type]||types.receive,Icon=meta.Icon;return <tr key={draft.type}><td><span className={`draft-type ${draft.type}`}><Icon/>{meta.label}</span></td><td><b>{draft.doc||'—'}</b></td><td>{draft.date||'—'}</td><td>{draft.group||'—'}{draft.type==='transfer'&&draft.dest?` → ${draft.dest}`:''}</td><td>{draft.items.length} รายการ</td><td>{draft.savedAt?new Date(draft.savedAt).toLocaleString('th-TH'):'—'}</td><td><div className="row-actions"><button onClick={()=>setView(draft)} title="ดูรายละเอียด"><Eye/></button><button onClick={()=>navigate(meta.path)} title="แก้ไขแบบร่าง"><PencilLine/></button><button className="danger" onClick={()=>setDeleting(draft)} title="ลบแบบร่าง"><Trash2/></button></div></td></tr>})}</tbody></table>{!drafts.length&&<Empty text="ยังไม่มีเอกสารแบบร่าง"/>}</div></div>
  {view&&<Modal title={`รายละเอียดแบบร่าง · ${view.doc}`} onClose={()=>setView(null)} wide><div className="draft-detail-head"><div><small>ประเภท</small><b>{types[view.type]?.label}</b></div><div><small>วันที่</small><b>{view.date}</b></div><div><small>คลัง</small><b>{view.group}{view.type==='transfer'?` → ${view.dest}`:''}</b></div><div><small>หมายเหตุ</small><b>{view.remark||'—'}</b></div></div><div className="table-wrap"><table><thead><tr><th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>Lot</th><th>จำนวน</th><th>หน่วย</th></tr></thead><tbody>{view.items.map((item,index)=><tr key={`${item.id}-${index}`}><td>{item.productCode}</td><td>{item.productName}</td><td>{item.lotNo||'—'}</td><td className="num">{fmt(item.qty)}</td><td>{item.unit}</td></tr>)}</tbody></table></div><div className="modal-actions"><button className="btn ghost" onClick={()=>setView(null)}>ปิด</button><button className="btn primary" onClick={()=>navigate(types[view.type].path)}><FilePenLine/> เปิดแก้ไขแบบร่าง</button></div></Modal>}
  {deleting&&<ConfirmModal title="ลบแบบร่าง" text={`ต้องการลบแบบร่าง ${deleting.doc} หรือไม่? การลบนี้ไม่กระทบ Stock เนื่องจากเอกสารยังไม่ได้ยืนยัน`} onClose={()=>setDeleting(null)} onConfirm={removeDraft}/>}</>;
}
