const AUTH_KEY='csp_auth';

const defaultUser={id:'admin',userId:'admin',username:'admin',name:'ผู้ดูแลระบบ',role:'APPROVER',roleLabel:'Admin'};

export const authenticate=(username,password)=>{
  if(String(username).trim().toLowerCase()!=='admin'||String(password)!=='1234')throw new Error('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
  return defaultUser;
};

export const getAuthSession=()=>{
  try{return JSON.parse(localStorage.getItem(AUTH_KEY)||sessionStorage.getItem(AUTH_KEY))||null}catch{return null}
};

export const setAuthSession=(user,remember=true)=>{
  const session={...defaultUser,...user};
  localStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(AUTH_KEY);
  (remember?localStorage:sessionStorage).setItem(AUTH_KEY,JSON.stringify(session));
};

export const clearAuthSession=()=>{localStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(AUTH_KEY)};
export const getUsers=()=>[defaultUser];
export const saveUsers=()=>{};
export const createPasswordHash=value=>String(value||'');
