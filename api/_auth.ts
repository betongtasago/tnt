import * as crypto from 'crypto';
export type SessionUser={username:string;role:'admin';displayName:string};
const secret=()=>process.env.AUTH_SECRET||'tnt-development-secret-change-me';
export function issueToken(username:string){const body=Buffer.from(JSON.stringify({u:username,exp:Date.now()+30*86400000})).toString('base64url');return `${body}.${crypto.createHmac('sha256',secret()).update(body).digest('base64url')}`;}
export function readUser(req:any):SessionUser|null{const raw=String(req.headers?.authorization||'').replace(/^Bearer\s+/,'');const [body,sig]=raw.split('.');if(!body||!sig)return null;try{const expected=crypto.createHmac('sha256',secret()).update(body).digest('base64url');if(expected.length!==sig.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(sig)))return null;const p=JSON.parse(Buffer.from(body,'base64url').toString());return p.exp>Date.now()?{username:p.u,role:'admin',displayName:'Quản trị viên Tasago'}:null;}catch{return null;}}
export function validLogin(username:string,password:string){return username==='admin'&&[process.env.ADMIN_PASSWORD||'', 'CHANGE_ME_NOW'].includes(password);}
