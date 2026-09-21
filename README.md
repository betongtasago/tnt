# Tasago TNT Fleet Control

Hệ thống web quản lý hồ sơ xe bồn của Tasago, tập trung vào thông tin phương tiện, tài xế, số khung, đăng kiểm, bảo hiểm và nhắc hạn tự động qua email. Ứng dụng chạy trên React + Vite, API serverless trên Vercel và Supabase PostgreSQL là nguồn dữ liệu trung tâm.

## Tính năng

- Dashboard tổng quan số lượng xe, trạng thái vận hành và cảnh báo giấy tờ.
- Hồ sơ xe bồn với biển số, mã xe, tài xế, điện thoại, số khung, kích thước, dung tích, trọng lượng, định mức, nhãn hiệu, xuất xứ, năm sản xuất, sở hữu, trạm, ngày xe về, đăng kiểm và bảo hiểm.
- Tự động phân loại giấy tờ: còn hiệu lực, cần gia hạn, sắp hết hạn và đã hết hạn.
- Vercel Cron gọi `/api/cron-notify` hằng ngày để gửi cảnh báo qua Gmail HTTPS relay.
- Tài khoản admin/member, đổi mật khẩu, đổi tên hiển thị, đăng xuất và hạn chế member khỏi cấu hình email.
- Supabase Realtime/Broadcast và polling dự phòng để đồng bộ thay đổi giữa các phiên đăng nhập.
- Xuất Excel `.xlsx` chuyên nghiệp gồm sheet Tổng quan và Danh sách xe, đầy đủ cột, bộ lọc, cố định hàng tiêu đề và màu cảnh báo.
- **Nhập dữ liệu từ ảnh bằng AI:** tải ảnh bảng dữ liệu lên, AI nhận dạng cột/dòng, cho xem trước và sửa nhanh, sau đó người dùng xác nhận để đồng bộ vào Supabase.
- Giao diện responsive cho máy tính và điện thoại, có logo TSG-TNT và hình xe bồn nền đăng nhập.

## Luồng nhập bảng từ ảnh bằng AI

1. Đăng nhập và mở mục **Danh sách xe** hoặc Dashboard.
2. Bấm **Nhập ảnh AI**.
3. Chọn ảnh PNG, JPG hoặc WEBP của bảng xe bồn.
4. Bấm **Nhận dạng bằng AI**.
5. Kiểm tra các dòng trong bảng xem trước; có thể sửa nhanh biển số, tài xế, kích thước, nhãn hiệu, sở hữu, hạn đăng kiểm, hạn bảo hiểm và số khung.
6. Bấm **Đồng bộ vào dữ liệu**. Các dòng đã xác nhận được chuẩn hóa thành hồ sơ xe và ghi qua `/api/state` vào Supabase.

### Giới hạn và kiểm soát chi phí AI

Để giữ chi phí trong phạm vi yêu cầu tối đa 300 tín dụng, mỗi yêu cầu chỉ xử lý **một ảnh**, giới hạn ảnh **5 MB**, tối đa **300 dòng**, không tự động retry và chỉ gọi AI một lần. Kết quả không được ghi tự động: người dùng luôn phải xem trước và xác nhận. Ảnh không rõ hoặc dòng không có biển số sẽ bị loại khỏi kết quả để tránh tạo dữ liệu đoán.

Mặc định endpoint dùng model multimodal `gemini-3.6-flash` khi chạy trực tiếp bằng `GEMINI_API_KEY`; với OpenAI-compatible API có thể dùng `AI_VISION_MODEL` như `gemini-3-flash-preview`; có thể thay bằng model vision tương thích OpenAI qua `AI_VISION_MODEL`. API AI không được gọi từ trình duyệt và không được đưa secret vào biến `VITE_*`.

## Công nghệ

- Frontend: React 19, TypeScript, Vite.
- Backend: Vercel Functions trên Node.js.
- Database: Supabase PostgreSQL, bảng `app_state` lưu JSONB và `app_users` lưu tài khoản.
- Đồng bộ: Supabase Realtime Broadcast và polling dự phòng.
- Excel: `xlsx-js-style`.
- AI vision: API Chat Completions tương thích OpenAI, trả JSON schema có cấu trúc.
- Email: Gmail Apps Script HTTPS relay và Vercel Cron.

## Chạy local

Yêu cầu Node.js 18+ và npm.

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`. Kiểm tra production build:

```bash
npm run lint
npm run build
npm start
```

## Biến môi trường server

Không commit các secret sau vào GitHub:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AUTH_SECRET=long-random-secret

# AI vision: dùng một provider tương thích OpenAI
AI_API_KEY=your-ai-key
AI_API_BASE=https://api.openai.com/v1
AI_VISION_MODEL=gemini-3-flash-preview
# Hoặc dùng trực tiếp Gemini API:
GEMINI_API_KEY=your-gemini-key

# Email/Vercel Cron
GMAIL_RELAY_URL=https://script.google.com/macros/s/your-id/exec
GMAIL_RELAY_SECRET=your-relay-secret
CRON_SECRET=your-cron-secret
APP_URL=https://tnt-tasago.vercel.app
```

`OPENAI_API_KEY` và `OPENAI_API_BASE` cũng được chấp nhận làm fallback cho AI. Trong production, chỉ đặt `AI_API_KEY`, `AI_API_BASE` và các secret ở Vercel Project Settings → Environment Variables. Không đặt service role key hoặc AI key vào `VITE_SUPABASE_*` hay frontend.

## Supabase migrations

Chạy các migration trong thư mục [`supabase/migrations`](./supabase/migrations) theo thứ tự tên file:

- `202609190001_create_fleet_state.sql`: bảng trạng thái đội xe.
- `202609190002_add_admin_password_hash.sql`: mật khẩu admin.
- `202609190003_create_app_users.sql`: tài khoản member/admin.
- `202609190004_add_admin_display_name.sql`: tên hiển thị admin.

Ứng dụng dùng service role ở server để đọc/ghi `app_state`; frontend không truy cập bằng service role. Khi đồng bộ ảnh, dữ liệu đi qua API có xác thực rồi mới được ghi vào Supabase.

## Gmail relay và Cron

Tạo Google Apps Script Web App từ file `scripts/gmail-relay/Code.gs` của dự án, đặt `RELAY_SECRET`, triển khai quyền **Anyone with the link**, sau đó nhập URL và secret vào Vercel. Cron trong `vercel.json` chạy `/api/cron-notify` lúc `00:00 UTC`, tương đương khoảng 07:00 giờ Việt Nam. Endpoint kiểm tra `CRON_SECRET`, đọc dữ liệu Supabase và chỉ gửi các xe đến ngưỡng cảnh báo.

## API chính

| Endpoint | Mục đích |
|---|---|
| `POST /api/login` | Đăng nhập admin/member |
| `POST /api/register` | Đăng ký member |
| `POST /api/change-password` | Đổi mật khẩu tài khoản hiện tại |
| `POST /api/change-profile` | Đổi tên hiển thị |
| `GET/PUT /api/state` | Đọc/ghi hồ sơ xe và cấu hình |
| `POST /api/import-image` | AI nhận dạng ảnh bảng, tối đa 300 dòng |
| `GET /api/health` | Kiểm tra health function |
| `GET /api/cron-notify` | Chạy nhắc hạn theo Vercel Cron |

## Deploy Vercel

Repository GitHub: `betongtasago/tnt`. Kết nối repository với Vercel, đặt đầy đủ biến môi trường Production, chạy migration Supabase và Redeploy. Vercel tự build bằng:

```bash
npm run build
```

Alias production hiện tại: <https://tnt-tasago.vercel.app>

## Bảo mật và vận hành

- Service role key Supabase, AI key, Gmail relay secret và cron secret chỉ nằm ở server.
- Member không thể đọc hoặc sửa cấu hình email từ API.
- Import ảnh yêu cầu token đăng nhập và không ghi dữ liệu nếu chưa có bước xác nhận trên giao diện.
- Dữ liệu OCR cần được đối chiếu với ảnh gốc trước khi sử dụng làm hồ sơ chính thức.
- Khi thay đổi schema, tạo migration mới thay vì sửa migration đã chạy trên production.

## Bản quyền

**CÔNG TY CỔ PHẦN ĐẦU TƯ TASAGO**  
TSG-TNT — *Cất cánh vươn cao*
