# Xe Demo · VinFast SAMCO Bình Tân

https://xedemo.vinfastsamcobinhtan.com · bản **v1.1**

## Kiến trúc
Giao diện (GitHub Pages) → Apps Script (link `/exec` trong `config.js`) → Google Sheet + Drive.
Code Apps Script (`.gs`) **không** để ở repo này; bản lưu nằm ở repo riêng tư `samco-apps-script`.
Dùng bộ chung `samco-core/v1`. Ảnh GPLX lưu trong thư mục Drive "Xe Lái Thử" (giới hạn quyền xem).

## Đường dẫn
| Link | Ai dùng | Nội dung |
|---|---|---|
| `/` | Nhân viên mượn xe | Phiếu mượn xe 2 bước, ghi ODO + pin, in Lệnh điều xe / Phiếu yêu cầu / Giấy cam kết |
| `/quanly` | Quản lý | Duyệt, nhật trình, sửa ODO có lý do, sạc pin, lệnh dịch vụ |

## File
| File | Vai trò |
|---|---|
| `index.html`, `quanly.html`, `app.js`, `print.js` | Giao diện, mẫu in |
| `config.js` | Link `/exec` của Apps Script |
| `version.json` | Số phiên bản hiện tại (app so sánh để báo "Đã có bản mới") |
| `icon.svg`, `icon-180.png`, `og-image.png` | Biểu tượng, ảnh xem trước khi gửi link |
| `logo-vinfast.jpg` | Chỉ dùng cho mẫu in |
| `CNAME` | Tên miền |

## Google Sheet
`XE_DEMO` (danh sách xe, ODO, pin) · `LAI_THU` (mỗi lượt 1 dòng) · `LENH_DV` · `_DanhMuc` · `_CauHinh`

## Cập nhật
1. Sửa Apps Script → Lưu → Triển khai → Quản lý các bản triển khai → bút chì → **Phiên bản mới** → Triển khai. Link `/exec` giữ nguyên.
2. Tải file giao diện lên repo này (nhánh `main`). GitHub Pages cập nhật sau 1–2 phút.
3. Đổi link Apps Script: chỉ sửa `config.js`.

## Phiên bản
- v1.1 (17/11/2026): đặt xe chỉ chặn khi trùng giờ, lịch đã đặt; tin nhắc tổ trưởng kèm link mở thẳng lệnh; khôi phục lệnh đã hủy; nhận lại cả lệnh dịch vụ; hạn xe (24 tháng, bảo hiểm, đăng kiểm); mở nhanh hơn; mã quản lý 4 số; chân trang phiên bản, tự báo bản mới.
- v1.0.7: sale đi xa cũng do tổ trưởng nhóm duyệt.
- v1.0.6: pin dưới 80% bắt buộc sạc lên trên 90%, bận thì báo Giang.
- v1.0.5: ô "Đi ngoại thành · anh Quang duyệt" đưa lên đầu; nhãn người duyệt giấy.
- v1.0: tách từ App Sale thành app riêng.
