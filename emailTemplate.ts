import type {Vehicle} from './src/types';
import {formatDate,getAlertText,expiryState} from './src/types';

type FleetEmailOptions={title?:string;intro?:string;preheader?:string};
const esc=(v:any)=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const statusLabel=(state:string)=>state==='expired'?'Đã hết hạn':state==='urgent'?'Sắp hết hạn':state==='warning'?'Cần gia hạn':'Còn hiệu lực';
const statusColor=(state:string)=>state==='expired'?'#b42318':state==='urgent'?'#b54708':'#9a6700';

export function buildFleetEmail(vs:Vehicle[],days:number,options:FleetEmailOptions={}){
  const title=options.title||'Cảnh báo hạn giấy tờ xe bồn';
  const intro=options.intro||`Các hồ sơ dưới đây cần được kiểm tra trong ngưỡng ${days} ngày.`;
  const preheader=options.preheader||intro;
  const rows=vs.map(v=>{
    const inspection=expiryState(v.inspectionExpiry,days);
    const insurance=expiryState(v.insuranceExpiry,days);
    const alert= getAlertText(v,days);
    return `<tr>
      <td style="padding:18px 20px;border-bottom:1px solid #e8eef3;vertical-align:top"><div style="font-weight:800;color:#173b63;font-size:14px">${esc(v.plateNumber)}</div><div style="color:#74879a;font-size:12px;margin-top:4px">${esc(v.vehicleCode||'Chưa có mã xe')}</div></td>
      <td style="padding:18px 20px;border-bottom:1px solid #e8eef3;vertical-align:top"><div style="color:#294255;font-size:13px">${esc(v.station||'Chưa gán trạm')}</div><div style="color:#74879a;font-size:12px;margin-top:4px">${esc(v.driverName||'Chưa cập nhật tài xế')}</div></td>
      <td style="padding:18px 20px;border-bottom:1px solid #e8eef3;vertical-align:top"><div style="color:${statusColor(inspection)};font-weight:800;font-size:13px">${formatDate(v.inspectionExpiry)}</div><div style="color:#74879a;font-size:11px;margin-top:4px">${statusLabel(inspection)}</div></td>
      <td style="padding:18px 20px;border-bottom:1px solid #e8eef3;vertical-align:top"><div style="color:${statusColor(insurance)};font-weight:800;font-size:13px">${formatDate(v.insuranceExpiry)}</div><div style="color:#74879a;font-size:11px;margin-top:4px">${statusLabel(insurance)}</div></td>
      <td style="padding:18px 20px;border-bottom:1px solid #e8eef3;vertical-align:top"><span style="display:inline-block;padding:6px 9px;border-radius:999px;background:#fff1f0;color:#b42318;font-size:11px;font-weight:800;line-height:1.3">${esc(alert)}</span></td>
    </tr>`;
  }).join('');
  const empty=`<tr><td colspan="5" style="padding:28px 20px;text-align:center;color:#74879a">Không có xe cần cảnh báo trong lần kiểm tra này.</td></tr>`;
  const text=[title,'',intro,'',...(vs.length?vs.map(v=>`${v.plateNumber} - ${getAlertText(v,days)} | Đăng kiểm: ${formatDate(v.inspectionExpiry)} | Bảo hiểm: ${formatDate(v.insuranceExpiry)}`):['Không có xe cần cảnh báo.'])].join('\n');
  const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head><body style="margin:0;padding:0;background:#f3f7fb;font-family:Arial,Helvetica,sans-serif;color:#20384d"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div><div style="padding:32px 12px;background:#f3f7fb"><div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid #e2eaf0;border-radius:20px;overflow:hidden;box-shadow:0 12px 35px rgba(28,62,91,.08)"><div style="padding:30px 32px;background:linear-gradient(120deg,#173b63,#24668b 65%,#25a98b);color:#fff"><div style="font-size:11px;letter-spacing:2px;font-weight:800;opacity:.78">TASAGO FLEET CONTROL</div><h1 style="margin:12px 0 8px;font-size:25px;line-height:1.2">${esc(title)}</h1><p style="margin:0;color:#d9f5f1;font-size:14px;line-height:1.6">${esc(intro)}</p></div><div style="padding:26px 32px"><div style="margin-bottom:20px;padding:15px 17px;background:#eef8f6;border:1px solid #d6eee8;border-radius:12px;color:#276b63;font-size:13px;line-height:1.5"><strong>${vs.length}</strong> hồ sơ được đưa vào báo cáo lần này.</div><div style="overflow-x:auto"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;min-width:650px;border:1px solid #e8eef3;border-radius:12px;border-collapse:separate;border-spacing:0;overflow:hidden"><thead><tr style="background:#f7fafc"><th align="left" style="padding:13px 20px;color:#74879a;font-size:10px;letter-spacing:.8px;text-transform:uppercase">Phương tiện</th><th align="left" style="padding:13px 20px;color:#74879a;font-size:10px;letter-spacing:.8px;text-transform:uppercase">Trạm / tài xế</th><th align="left" style="padding:13px 20px;color:#74879a;font-size:10px;letter-spacing:.8px;text-transform:uppercase">Đăng kiểm</th><th align="left" style="padding:13px 20px;color:#74879a;font-size:10px;letter-spacing:.8px;text-transform:uppercase">Bảo hiểm</th><th align="left" style="padding:13px 20px;color:#74879a;font-size:10px;letter-spacing:.8px;text-transform:uppercase">Trạng thái</th></tr></thead><tbody>${rows||empty}</tbody></table></div></div><div style="padding:19px 32px;background:#f7fafc;border-top:1px solid #e8eef3;color:#8798a6;font-size:11px;line-height:1.6">Email tự động từ <strong style="color:#426076">Tasago Fleet Control</strong> · Vui lòng kiểm tra và cập nhật hồ sơ trên hệ thống.</div></div></div></body></html>`;
  return {text,html};
}
