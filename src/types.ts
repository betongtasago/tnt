export type VehicleStatus = 'active' | 'maintenance' | 'inactive';
export type ExpiryState = 'expired' | 'urgent' | 'warning' | 'valid' | 'unknown';
export interface Vehicle { id:string; plateNumber:string; vehicleCode:string; brand:string; model:string; capacityM3:number; dimensions:string; curbWeightKg:number; norm:number; driverName:string; driverPhone:string; chassisNumber:string; origin:string; manufactureYear:number; ownership:string; station:string; vehicleArrivalDate:string; inspectionExpiry:string; insuranceExpiry:string; insuranceProvider:string; insurancePolicyNumber:string; status:VehicleStatus; notes:string; createdAt:string; updatedAt:string; }
export interface NotificationConfig { autoEmailEnabled:boolean; emailRecipients:string[]; emailSender:string; reminderDaysBefore:number; autoSendHour:number; autoSendMinute:number; }
export interface NotificationLog { id:string; timestamp:string; recipients:string[]; vehicleIds:string[]; status:'success'|'failed'|'simulated'; message:string; }
export interface AppState { vehicles:Vehicle[]; config:NotificationConfig; notificationLogs:NotificationLog[]; lastCronDate:string; lastCronLog:string; updatedAt?:string; }
export type VehicleForm = Omit<Vehicle,'id'|'createdAt'|'updatedAt'>;
export interface AuthUser { username:string; role:string; displayName:string; }
export const emptyConfig:NotificationConfig={autoEmailEnabled:true,emailRecipients:[],emailSender:'Tasago Fleet',reminderDaysBefore:30,autoSendHour:7,autoSendMinute:0};
export const emptyState:AppState={vehicles:[],config:emptyConfig,notificationLogs:[],lastCronDate:'',lastCronLog:'',updatedAt:''};
export const emptyVehicleForm:VehicleForm={plateNumber:'',vehicleCode:'',brand:'',model:'',capacityM3:0,dimensions:'',curbWeightKg:0,norm:0,driverName:'',driverPhone:'',chassisNumber:'',origin:'',manufactureYear:0,ownership:'',station:'',vehicleArrivalDate:'',inspectionExpiry:'',insuranceExpiry:'',insuranceProvider:'',insurancePolicyNumber:'',status:'active',notes:''};
export function normalizeVehicle(x:Partial<Vehicle>):Vehicle { const now=new Date().toISOString(); return {id:x.id||crypto.randomUUID(),plateNumber:x.plateNumber||'',vehicleCode:x.vehicleCode||'',brand:x.brand||'',model:x.model||'',capacityM3:Number(x.capacityM3||0),dimensions:x.dimensions||'',curbWeightKg:Number(x.curbWeightKg||0),norm:Number(x.norm||0),driverName:x.driverName||'',driverPhone:x.driverPhone||'',chassisNumber:x.chassisNumber||'',origin:x.origin||'',manufactureYear:Number(x.manufactureYear||0),ownership:x.ownership||'',station:x.station||'',vehicleArrivalDate:x.vehicleArrivalDate||'',inspectionExpiry:x.inspectionExpiry||'',insuranceExpiry:x.insuranceExpiry||'',insuranceProvider:x.insuranceProvider||'',insurancePolicyNumber:x.insurancePolicyNumber||'',status:x.status||'active',notes:x.notes||'',createdAt:x.createdAt||now,updatedAt:now}; }
export function sanitizeState(x:any):AppState{return {vehicles:Array.isArray(x?.vehicles)?x.vehicles.map(normalizeVehicle):[],config:{...emptyConfig,...(x?.config||{})},notificationLogs:Array.isArray(x?.notificationLogs)?x.notificationLogs:[],lastCronDate:x?.lastCronDate||'',lastCronLog:x?.lastCronLog||'',updatedAt:x?.updatedAt||''};}
export function expiryState(date:string,reminderDays=30,today=new Date()):ExpiryState{if(!date)return'unknown';const t=new Date(`${date}T00:00:00`),n=new Date(today.getFullYear(),today.getMonth(),today.getDate()),d=Math.ceil((t.getTime()-n.getTime())/86400000);if(d<0)return'expired';if(d<=7)return'urgent';if(d<=reminderDays)return'warning';return'valid';}
export function daysUntil(date:string,today=new Date()){if(!date)return null;const t=new Date(`${date}T00:00:00`),n=new Date(today.getFullYear(),today.getMonth(),today.getDate());return Math.ceil((t.getTime()-n.getTime())/86400000);}
export function formatDate(v?:string){if(!v)return'Chưa cập nhật';const [y,m,d]=v.split('-');return y&&m&&d?`${d}/${m}/${y}`:v;}
export function getVehicleAlert(v:Vehicle,days=30):ExpiryState{const a=expiryState(v.inspectionExpiry,days),b=expiryState(v.insuranceExpiry,days),r:any={unknown:0,valid:1,warning:2,urgent:3,expired:4};return r[a]>=r[b]?a:b;}
export function getAlertText(v:Vehicle,days=30){return [['Đăng kiểm',v.inspectionExpiry],['Bảo hiểm',v.insuranceExpiry]].map(([label,date])=>{const s=expiryState(date,days),d=daysUntil(date);return s!=='valid'&&s!=='unknown'?`${label}: ${s==='expired'?'đã hết hạn':`còn ${d} ngày`}`:''}).filter(Boolean).join(' · ')||'Các giấy tờ còn hiệu lực';}
export const statusLabel={active:'Đang hoạt động',maintenance:'Bảo dưỡng',inactive:'Ngừng hoạt động'} as Record<VehicleStatus,string>;
export const statusTone={active:'valid',maintenance:'warning',inactive:'muted'} as Record<VehicleStatus,string>;
export function isAlert(v:Vehicle,days=30){return['expired','urgent','warning'].includes(getVehicleAlert(v,days));}
export function formatTime(v:string){return new Date(v).toLocaleString('vi-VN');}
export function getAuthToken(){return localStorage.getItem('tnt_auth_token')||'';} export function setAuthToken(v:string|null){v?localStorage.setItem('tnt_auth_token',v):localStorage.removeItem('tnt_auth_token');}
export function getAuthUser():AuthUser|null{try{return JSON.parse(localStorage.getItem('tnt_auth_user')||'null')}catch{return null;}} export function setAuthUser(v:AuthUser|null){v?localStorage.setItem('tnt_auth_user',JSON.stringify(v)):localStorage.removeItem('tnt_auth_user');}
export function getApiUrl(){return(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');}
export async function api(path:string,init:RequestInit={}){const h=new Headers(init.headers);h.set('Content-Type','application/json');const t=getAuthToken();if(t)h.set('Authorization',`Bearer ${t}`);return fetch(`${getApiUrl()}${path}`,{...init,headers:h});}
export async function exportVehicles(vs:Vehicle[],reminderDays=30){
  const XLSX=await import('xlsx-js-style');
  const rows=vs.map((v,i)=>({
    'STT':i+1,'Biển số':v.plateNumber,'Mã xe':v.vehicleCode,'Họ tên tài xế':v.driverName,'Số điện thoại':v.driverPhone,
    'Kích thước':v.dimensions,'Dung tích (m³)':v.capacityM3||'','Trọng lượng xe (kg)':v.curbWeightKg||'','Định mức':v.norm||'',
    'Nhãn hiệu':v.brand,'Dòng xe':v.model,'Xuất xứ':v.origin,'Năm sản xuất':v.manufactureYear||'','Sở hữu':v.ownership,
    'Số khung xe':v.chassisNumber,'Ngày xe về':formatDate(v.vehicleArrivalDate),'Trạm':v.station,
    'Ngày hết hạn đăng kiểm':formatDate(v.inspectionExpiry),'Trạng thái đăng kiểm':labelExcel(expiryState(v.inspectionExpiry,reminderDays)),
    'Ngày hết hạn bảo hiểm':formatDate(v.insuranceExpiry),'Trạng thái bảo hiểm':labelExcel(expiryState(v.insuranceExpiry,reminderDays)),
    'Nhà bảo hiểm':v.insuranceProvider,'Số hợp đồng bảo hiểm':v.insurancePolicyNumber,'Trạng thái xe':statusLabel[v.status],'Ghi chú':v.notes
  }));
  const headers=['STT','Biển số','Mã xe','Họ tên tài xế','Số điện thoại','Kích thước','Dung tích (m³)','Trọng lượng xe (kg)','Định mức','Nhãn hiệu','Dòng xe','Xuất xứ','Năm sản xuất','Sở hữu','Số khung xe','Ngày xe về','Trạm','Ngày hết hạn đăng kiểm','Trạng thái đăng kiểm','Ngày hết hạn bảo hiểm','Trạng thái bảo hiểm','Nhà bảo hiểm','Số hợp đồng bảo hiểm','Trạng thái xe','Ghi chú'];
  const ws=XLSX.utils.json_to_sheet(rows,{header:headers});
  const headerStyle={font:{bold:true,color:'FFFFFF',name:'Aptos',sz:11},fill:{fgColor:{rgb:'173B63'}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:{bottom:{style:'medium',color:{rgb:'48C9D7'}}}};
  headers.forEach((h,col)=>{const cell=ws[XLSX.utils.encode_cell({r:0,c:col})];if(cell)cell.s=headerStyle;});
  for(let r=1;r<=rows.length;r++){
    const band=r%2===0?'F4F8FC':'FFFFFF';
    for(let c=0;c<headers.length;c++){const addr=XLSX.utils.encode_cell({r,c});if(ws[addr])ws[addr].s={font:{name:'Aptos',sz:10,color:{rgb:'20384D'}},fill:{fgColor:{rgb:band}},alignment:{vertical:'center',wrapText:true},border:{bottom:{style:'thin',color:{rgb:'E4EBF1'}}}};}
    ['Trạng thái đăng kiểm','Trạng thái bảo hiểm','Trạng thái xe'].forEach(h=>{const c=headers.indexOf(h),addr=XLSX.utils.encode_cell({r,c}),cell=ws[addr];if(!cell)return;const value=String(cell.v||'');const color=value.includes('Đã hết')?'FCE4E7':value.includes('Sắp')||value.includes('Cần')?'FFF1D1':value.includes('Đang hoạt')?'E3F7EF':'EEF2F5';cell.s={font:{bold:true,name:'Aptos',sz:10,color:{rgb:'20384D'}},fill:{fgColor:{rgb:color}},alignment:{horizontal:'center',vertical:'center',wrapText:true}};});
  }
  ws['!cols']=headers.map(h=>({wch:['STT','Năm sản xuất','Định mức'].includes(h)?12:h.includes('Ghi chú')?28:h.includes('tài xế')||h.includes('bảo hiểm')?23:18}));
  ws['!autofilter']={ref:`A1:${XLSX.utils.encode_col(headers.length-1)}${Math.max(rows.length+1,2)}`};ws['!freeze']={xSplit:0,ySplit:1};ws['!rows']=[{hpt:30},...rows.map(()=>({hpt:24}))];
  const summary=[['BÁO CÁO QUẢN LÝ XE BỒN',''],['Thời điểm xuất file',new Date().toLocaleString('vi-VN')],['Tổng số xe',vs.length],['Đang hoạt động',vs.filter(v=>v.status==='active').length],['Cần xử lý giấy tờ',vs.filter(v=>isAlert(v,reminderDays)).length],['Đã hết hạn',vs.filter(v=>getVehicleAlert(v,reminderDays)==='expired').length],['Ghi chú','File được xuất từ Tasago Fleet Control']];
  const overview=XLSX.utils.aoa_to_sheet(summary);overview['!cols']=[{wch:28},{wch:42}];overview['A1'].s={font:{bold:true,color:{rgb:'FFFFFF'},name:'Aptos',sz:16},fill:{fgColor:{rgb:'173B63'}},alignment:{vertical:'center'}};overview['B1'].s=overview['A1'].s;overview['!merges']=[{s:{r:0,c:0},e:{r:0,c:1}}];for(let r=1;r<summary.length;r++){overview[`A${r+1}`].s={font:{bold:true,name:'Aptos',sz:11,color:{rgb:'365268'}},fill:{fgColor:{rgb:'EAF3FA'}}};overview[`B${r+1}`].s={font:{name:'Aptos',sz:11,color:{rgb:'20384D'}}};}overview['!rows']=[{hpt:32},...summary.slice(1).map(()=>({hpt:24}))];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,overview,'Tổng quan');XLSX.utils.book_append_sheet(wb,ws,'Danh sách xe');
  XLSX.writeFile(wb,`tasago-xe-bon-${new Date().toISOString().slice(0,10)}.xlsx`,{compression:true});
}
function labelExcel(s:ExpiryState){return s==='expired'?'Đã hết hạn':s==='urgent'?'Sắp hết hạn':s==='warning'?'Cần gia hạn':s==='valid'?'Còn hiệu lực':'Chưa cập nhật';}
export const initialState:AppState={...emptyState,vehicles:[normalizeVehicle({id:'demo-1',plateNumber:'51D-123.45',vehicleCode:'BT-01',brand:'Hino',model:'700',capacityM3:10,driverName:'Nguyễn Văn Minh',driverPhone:'0901000001',station:'Tasago Hóc Môn',inspectionExpiry:'2026-10-04',insuranceExpiry:'2026-11-18',insuranceProvider:'Bảo Việt',insurancePolicyNumber:'BV-2026-0001'}),normalizeVehicle({id:'demo-2',plateNumber:'51D-678.90',vehicleCode:'BT-02',brand:'Isuzu',model:'FVM',capacityM3:8,driverName:'Trần Quốc Huy',driverPhone:'0901000002',station:'Tasago Xuyên Á',inspectionExpiry:'2026-09-25',insuranceExpiry:'2026-09-20',insuranceProvider:'PVI',insurancePolicyNumber:'PVI-2026-0088'})]};
