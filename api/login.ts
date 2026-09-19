import {issueToken,validLogin} from './_auth';

export const config={runtime:'nodejs20.x'};

export default async function handler(req:any,res:any){
  if(req.method!=='POST')return res.status(405).json({message:'Method Not Allowed'});
  try{
    const raw=typeof req.body==='string'?req.body:(req.body||{});
    const body=typeof raw==='string'?JSON.parse(raw||'{}'):raw;
    const username=String(body?.username||'').trim();
    const password=String(body?.password||'');
    if(!validLogin(username,password))return res.status(401).json({message:'Sai tài khoản hoặc mật khẩu.'});
    return res.status(200).json({token:issueToken('admin'),user:{username:'admin',role:'admin',displayName:'Quản trị viên Tasago'}});
  }catch(error:any){
    console.error('login_error',error);
    return res.status(400).json({message:'Dữ liệu đăng nhập không hợp lệ.'});
  }
}
