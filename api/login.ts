function secret(){return process.env.AUTH_SECRET||'tnt-development-secret-change-me';}
function checksum(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}
function issueToken(username:string){const body=Buffer.from(JSON.stringify({u:username,exp:Date.now()+30*86400000})).toString('base64url');return `${body}.${checksum(`${body}.${secret()}`)}`;}
function validLogin(username:string,password:string){return username==='admin'&&[process.env.ADMIN_PASSWORD||'','CHANGE_ME_NOW'].includes(password);}
export default function handler(req:any,res:any){
  if(req.method!=='POST')return res.status(405).json({message:'Method Not Allowed'});
  try{
    const raw=typeof req.body==='string'?req.body:(req.body||{});const body=typeof raw==='string'?JSON.parse(raw||'{}'):raw;
    const username=String(body?.username||'').trim();const password=String(body?.password||'');
    if(!validLogin(username,password))return res.status(401).json({message:'Sai tài khoản hoặc mật khẩu.'});
    return res.status(200).json({token:issueToken('admin'),user:{username:'admin',role:'admin',displayName:'Quản trị viên Tasago'}});
  }catch(error){console.error('login_error',error);return res.status(400).json({message:'Dữ liệu đăng nhập không hợp lệ.'});}
}
