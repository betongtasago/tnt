import { readUser } from '../_auth.js';
import { sendViaGmailRelay } from '../../gmailRelay.js';
import { buildFleetEmail } from '../../emailTemplate.js';
import { expiryState, type Vehicle } from '../../src/types.js';

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

  const user = readUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ success: false, message: 'Chỉ quản trị viên mới được gửi email thử.' });

  try {
    const body = req.body || {};
    const recipients = (Array.isArray(body.recipients) ? body.recipients : [])
      .map((value: unknown) => String(value).trim())
      .filter(isEmail)
      .slice(0, 20);
    if (!recipients.length) return res.status(400).json({ success: false, message: 'Hãy nhập ít nhất một địa chỉ email hợp lệ.' });

    const days = Math.max(0, Math.min(365, Number(body.reminderDaysBefore ?? 30) || 30));
    const vehicles = (Array.isArray(body.vehicles) ? body.vehicles : []) as Vehicle[];
    const attention = vehicles.filter(vehicle => {
      const inspection = expiryState(vehicle.inspectionExpiry, days);
      const insurance = expiryState(vehicle.insuranceExpiry, days);
      return ['expired', 'urgent', 'warning'].includes(inspection) || ['expired', 'urgent', 'warning'].includes(insurance);
    });
    const sample = (attention.length ? attention : vehicles).slice(0, 8);
    const report = buildFleetEmail(sample, days, {
      title: 'Email thử kết nối Tasago Fleet',
      intro: attention.length
        ? `Đây là email thử nghiệm với ${attention.length} xe đang có giấy tờ cần lưu ý.`
        : 'Đây là email thử nghiệm. Hiện chưa có xe nào nằm trong ngưỡng cảnh báo.',
      preheader: 'Email thử kết nối hệ thống nhắc hạn giấy tờ xe bồn.',
    });
    const result = await sendViaGmailRelay({
      recipients,
      subject: `[TASAGO] Email thử kết nối - ${new Date().toLocaleDateString('vi-VN')}`,
      ...report,
      senderName: String(body.senderName || 'Tasago Fleet').trim().slice(0, 80),
    });

    return res.status(200).json({
      success: true,
      message: result.message || `Đã gửi email thử tới ${recipients.length} địa chỉ.`,
      recipients,
      vehicleCount: sample.length,
    });
  } catch (error: any) {
    console.error('Lỗi gửi email thử:', error);
    return res.status(502).json({ success: false, message: `Không thể gửi email thử: ${error?.message || 'lỗi không xác định'}` });
  }
}
