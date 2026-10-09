import {browserLocalPersistence,browserSessionPersistence,setPersistence,signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {auth,firebaseConfigured} from '../services/firebase';

const AUTH_KEY='csp_auth';

export const authenticate=async(email,password,remember=true)=>{
  if(!firebaseConfigured||!auth)throw new Error('ยังไม่ได้ตั้งค่า Firebase Environment Variables');
  await setPersistence(auth,remember?browserLocalPersistence:browserSessionPersistence);
  const credential=await signInWithEmailAndPassword(auth,String(email).trim(),password);
  return{id:credential.user.uid,userId:credential.user.uid,username:credential.user.email,email:credential.user.email,name:credential.user.displayName||credential.user.email?.split('@')[0]||'ผู้ใช้งาน',role:'APPROVER',roleLabel:'Admin'};
};

export const getAuthSession=()=>{
  try{return JSON.parse(localStorage.getItem(AUTH_KEY)||sessionStorage.getItem(AUTH_KEY))||null}catch{return null}
};

export const setAuthSession=(user,remember=true)=>{
  const session={userId:user.userId||user.id,username:user.username||user.email,email:user.email||user.username,name:user.name,role:user.role||'APPROVER',roleLabel:user.roleLabel||'Admin'};
  localStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(AUTH_KEY);
  (remember?localStorage:sessionStorage).setItem(AUTH_KEY,JSON.stringify(session));
};

export const clearAuthSession=async()=>{
  localStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(AUTH_KEY);
  if(auth)await signOut(auth).catch(()=>{});
};

// User administration is handled by Firebase Authentication Console.
export const getUsers=()=>[];
export const saveUsers=()=>{};
export const createPasswordHash=value=>String(value||'');
