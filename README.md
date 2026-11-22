# Locket Module & Tự Tạo Khung Riêng (`locket-sgmodule`)

Lưu trữ module `.sgmodule`, các script `.js`, và **backend ghép khung tự động trên Vercel** để bạn tự thêm khung PNG của riêng mình ngay trên GitHub.

## 1. Link Module (cài vào Shadowrocket / Surge)

- **Bản chính (có hỗ trợ khung tự tạo của bạn + giữ nguyên 175 khung gốc):**
  ```
  https://raw.githubusercontent.com/nhattinh486-art/locket-sgmodule/main/locket.sgmodule
  ```
- **Bản gốc (nguyên bản):**
  ```
  https://raw.githubusercontent.com/nhattinh486-art/locket-sgmodule/main/locket.original.sgmodule
  ```

## 2. Triển khai Backend ghép khung (chỉ làm 1 lần, miễn phí trên Vercel)

1. Vào https://vercel.com/new (đăng nhập bằng GitHub).
2. Chọn **Import** repository `nhattinh486-art/locket-sgmodule`.
3. Giữ nguyên cấu hình mặc định và bấm **Deploy**.
4. Sau khi deploy xong, Vercel sẽ cấp domain (mặc định là `https://locket-sgmodule.vercel.app`).
   - Kiểm tra nhanh bằng cách mở `https://<domain-cua-ban>.vercel.app/api/generateFilteredImage` — thấy `{"ok":true,...}` là chạy thành công!
   - Nếu domain Vercel cấp khác `locket-sgmodule.vercel.app`, chỉ cần sửa biến `CUSTOM_BACKEND_URL` trong file `scripts/ptb_307_redirect.js` đúng theo domain của bạn.

## 3. Cách tự thêm khung mới ngay trên GitHub (không cần deploy lại)

1. Chuẩn bị file ảnh khung **PNG trong suốt ở giữa** (khuyên dùng kích thước `1080x1080`).
2. Upload ảnh vào thư mục `frames/` với tên bắt đầu bằng `my_`, ví dụ:
   `frames/my_noel_rieng.png`
3. Mở file `custom-frames.json` trên GitHub và thêm 1 mục vào mảng `frames`:
   ```json
   {
     "id": "my_noel_rieng",
     "name": "Noel Riêng 🎄",
     "groupId": "group_my_frames",
     "frameUrl": "https://raw.githubusercontent.com/nhattinh486-art/locket-sgmodule/main/frames/my_noel_rieng.png",
     "enabled": true,
     "caption": {
       "text": "Noel 🎄",
       "mode": "gradient",
       "from": "#004d25",
       "to": "#ea3434",
       "angle": 180
     }
   }
   ```
4. Bấm **Commit changes** → Thoát hẳn app Locket rồi mở lại là thấy khung mới xuất hiện ở nhóm **Khung Của Tôi ✨** và chụp ghép khung được ngay!

## Cấu trúc thư mục

- `locket.sgmodule` — Module đã trỏ toàn bộ script về GitHub này.
- `custom-frames.json` — Danh sách nhóm & khung tự tạo của bạn (dễ sửa trực tiếp trên GitHub).
- `frames/` — Thư mục chứa file ảnh khung PNG trong suốt (đã có sẵn `my_demo_frame.png`).
- `api/generateFilteredImage.js` — Endpoint nhận request từ Locket khi chụp với khung `my_*`.
- `api/render.js` — Endpoint dùng `sharp` ghép ảnh chụp với khung PNG từ `frames/`.
- `scripts/` — Các script Surge/Shadowrocket (`locketfix.js`, `ptb_307_redirect.js`, `revenuecat.js`, ...).
