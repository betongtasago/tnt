export type UserRole='admin'|'member';
export type SessionUser={username:string;role:UserRole;displayName:string};
const secret=()=>process.env.AUTH_SECRET||'tnt-development-secret-change-me';
function checksum(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
export function hashPassword(password:string){return checksum(`${password}.${secret()}`);}
export function issueToken(user:SessionUser){const body=Buffer.from(JSON.stringify({u:user.username,r:user.role,n:user.displayName,exp:Date.now()+30*86400000})).toString('base64url');return `${body}.${checksum(`${body}.${secret()}`)}`;}
export function readUser(req:any):SessionUser|null{const raw=String(req.headers?.authorization||'').replace(/^Bearer\s+/,'');const [body,sig]=raw.split('.');if(!body||!sig||sig!==checksum(`${body}.${secret()}`))return null;try{const p=JSON.parse(Buffer.from(body,'base64url').toString());return p.exp>Date.now()?{username:String(p.u),role:p.r==='admin'?'admin':'member',displayName:String(p.n||p.u)}:null;}catch{return null;}}
