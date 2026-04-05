# Yuta Staff — Ứng dụng chấm công

Ứng dụng PWA chấm công (clock-in / clock-out) cho nhà hàng Yuta.  
Dữ liệu được lưu cục bộ qua **IndexedDB (Dexie)** và đồng bộ lên **Google Sheets** ngay khi có kết nối internet.

---

## Kiến trúc

```
Trình duyệt (PWA)
│
├── IndexedDB (Dexie)          ← lưu trữ cục bộ offline-first
│   ├── staff                  ← danh sách nhân viên
│   ├── shifts                 ← ca làm việc
│   └── sync_queue             ← hàng đợi đồng bộ
│
└── /api/sync  (Next.js API)   ← nhận sự kiện và ghi lên
        │
        └── Google Sheets      ← sheet "shifts" (báo cáo tập trung)
```

**Luồng đồng bộ:**
1. Ca làm việc được ghi vào IndexedDB ngay lập tức (offline-first).
2. Một sự kiện được thêm vào `sync_queue`.
3. `flushSyncQueue()` gửi từng sự kiện đến `POST /api/sync`.
4. API Route của Next.js ghi / cập nhật dòng tương ứng trên Google Sheets qua Google API (Service Account JWT).
5. Nếu mất kết nối, hàng đợi sẽ được xả tự động khi có mạng trở lại.

---

## Yêu cầu

| Công cụ | Phiên bản tối thiểu |
|---|---|
| Node.js | 18+ |
| pnpm | 10+ |

---

## Biến môi trường

Tạo file `.env.local` ở thư mục gốc của dự án:

```env
GOOGLE_SHEET_ID=<ID của Google Sheet>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<email của service account>
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
```

> **Lưu ý:** Private key phải có các ký tự xuống dòng được mã hóa thành `\n` trong file `.env.local`. Chúng sẽ được giải mã bởi `replace(/\\n/g, "\n")` trong code.

---

## Cấu hình Google Sheets — từng bước

### 1. Tạo Google Sheet

1. Truy cập [sheets.google.com](https://sheets.google.com) và tạo file mới.
2. Đổi tên tab đầu tiên thành **`shifts`** (phân biệt chữ hoa/thường).
3. Thêm tiêu đề cột ở dòng 1:

   | A | B | C | D | E | F | G | H | I |
   |---|---|---|---|---|---|---|---|---|
   | id | staff_id | staff_name | date | start_time | end_time | duration_minutes | notes | updated_at |

4. Sao chép **ID** của Sheet từ URL:  
   `https://docs.google.com/spreadsheets/d/**<SHEET_ID>**/edit`

### 2. Tạo Service Account Google

1. Truy cập [Google Cloud Console](https://console.cloud.google.com).
2. Tạo project mới (hoặc dùng project sẵn có).
3. Bật **API Google Sheets**:  
   *APIs & Services → Library → "Google Sheets API" → Enable*
4. Tạo service account:  
   *APIs & Services → Credentials → Create Credentials → Service Account*
   - Đặt tên (vd. `yuta-sheets-sync`)
   - Role: *Editor* (hoặc role tùy chỉnh với quyền `spreadsheets.values.read` và `spreadsheets.values.write`)
5. Trong service account vừa tạo, vào tab **Keys**:  
   *Add Key → Create new key → JSON*  
   → Tải file `.json` về máy

### 3. Chia sẻ Sheet với Service Account

1. Mở Google Sheet.
2. Nhấn **Chia sẻ** (Share).
3. Dán email của service account (vd. `yuta-sheets-sync@ten-project.iam.gserviceaccount.com`).
4. Cấp quyền **Người chỉnh sửa** (Editor).
5. Xác nhận.

### 4. Điền biến môi trường

Trong file JSON tải về ở bước 2, lấy các giá trị:

```json
{
  "client_email": "...",      → GOOGLE_SERVICE_ACCOUNT_EMAIL
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n..."  → GOOGLE_PRIVATE_KEY
}
```

Sao chép các giá trị này vào `.env.local`.

---

## Cài đặt và chạy

```bash
# Cài đặt dependencies
pnpm install

# Chạy môi trường dev (PWA bị tắt khi dev)
pnpm dev

# Build production
pnpm build

# Chạy production
pnpm start
```

---

## Triển khai (khuyến nghị Vercel)

1. Đẩy repo lên GitHub / GitLab.
2. Import project trên [vercel.com](https://vercel.com).
3. Vào *Settings → Environment Variables*, thêm 3 biến:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
4. Deploy. Ứng dụng sẽ chạy trên HTTPS — bắt buộc để cài đặt PWA.

> **Lưu ý Vercel / GOOGLE_PRIVATE_KEY:** Dán key nguyên gốc vào field của Vercel (giữ nguyên ký tự xuống dòng thật). Vercel tự xử lý escape.

---

## Truy cập manager

| URL | Vai trò |
|---|---|
| `/` | Màn hình chấm công (nhân viên) |
| `/manager` | Bảng điều khiển quản lý |

PIN manager mặc định là `0000` — đổi trong `src/app/manager/page.tsx` (hằng số `MANAGER_PIN`) trước khi đưa lên production.

---

## Cấu trúc dữ liệu Google Sheet (tab `staff`)

Tab `staff` chứa danh sách nhân viên — được quản lý thủ công trực tiếp trên Google Sheets, sau đó đồng bộ về app qua nút **↓ Đồng bộ từ Google Sheets** trong trang Manager.

| Cột | Trường | Ví dụ | Ghi chú |
|---|---|---|---|
| A | `id` | `staff_001` | ID duy nhất, tự đặt |
| B | `name` | `Jean Dupont` | Tên hiển thị |
| C | `role` | `Serveur` | Vị trí / chức danh |
| D | `pin` | `1234` | PIN 4 chữ số để chấm công |
| E | `active` | `true` | `false` = vô hiệu hoá |

> **Dòng 1** là header (bị bỏ qua khi đọc). Dữ liệu bắt đầu từ dòng 2.  
> Cột `E` bỏ trống hoặc bất kỳ giá trị nào khác `false` đều được coi là **active**.

---

## Cấu trúc dữ liệu Google Sheet (tab `shifts`)

| Cột | Trường | Ví dụ |
|---|---|---|
| A | `id` | `550e8400-e29b-...` |
| B | `staff_id` | `staff_001` |
| C | `staff_name` | `Jean Dupont` |
| D | `date` | `2026-04-05` |
| E | `start_time` | `2026-04-05T10:00:00.000Z` |
| F | `end_time` | `2026-04-05T18:30:00.000Z` |
| G | `duration_minutes` | `510` |
| H | `notes` | *(để trống)* |
| I | `updated_at` | `2026-04-05T18:30:01.123Z` |

---

## Hoạt động offline

Ứng dụng là **PWA** (Progressive Web App):
- Lần truy cập đầu tiên sẽ cache ứng dụng qua Service Worker.
- Chấm công luôn được lưu cục bộ, kể cả khi mất internet.
- Đồng bộ lên Google Sheets tự động khi có mạng trở lại, hoặc thủ công qua nút **Synchroniser** trong bảng điều khiển manager.
- Thanh trạng thái đầu trang hiển thị tình trạng kết nối và số sự kiện đang chờ đồng bộ.
