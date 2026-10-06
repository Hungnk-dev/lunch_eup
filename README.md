# 🍚 Cơm Chung

App tính tiền ăn nhóm nội bộ (~20 người). Mỗi ngày người đặt cơm nhập tổng tiền,
tick người ăn, hệ thống tự chia đều và cộng vào công nợ. Khi cần, admin ghi nhận
thanh toán. Cả nhóm xem công nợ qua link chung không cần đăng nhập.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + PostgreSQL) · Vercel

## Tính năng

- 🎲 **"Hôm nay ăn gì?"**: thực đơn team (thêm/sửa/ẩn món, link menu, giá, tag), random món có trọng số (ưu tiên món lâu chưa ăn), chốt món + copy gửi nhóm, lịch sử 10 lần chốt gần nhất
- 🍜 Ghi bữa ăn: chọn ngày, người đặt, tổng tiền, tick người ăn → tự chia đều (làm tròn 500đ/người); gắn kèm món/quán (tự gợi ý món đã chốt hôm nay)
- 💰 Bảng công nợ: đã ăn / đã trả / còn nợ, filter, highlight người nợ, "Sạch nợ 🎉"
- 💸 Ghi nhận thanh toán (cho phép trả một phần), lịch sử thanh toán
- 📱 Mã QR chuyển khoản: upload ở Cài đặt, hiện ở bảng công nợ cho mọi người quét
- 👥 Quản lý thành viên: thêm, sửa, ẩn (soft-delete, giữ lịch sử nợ), khôi phục
- 📋 Copy danh sách công nợ để gửi Zalo/Telegram/Slack
- ⚙️ Đổi tên nhóm + "header vui" ("Biệt đội cơm trưa", "Hội đói bụng"...)
- 🔒 Chỉ admin đăng nhập mới sửa được dữ liệu; `/debts` và `/meals` là link xem public read-only

## 1. Tạo Supabase project

1. Vào [supabase.com](https://supabase.com) → **New project** (chọn region Singapore cho nhanh).
2. Đợi project khởi tạo xong.

## 2. Chạy SQL migration

1. Mở **SQL Editor** trong Supabase Dashboard.
2. Chạy lần lượt các file trong `supabase/migrations/` theo thứ tự (copy nội dung từng file và bấm **Run**):
   - [`001_init.sql`](supabase/migrations/001_init.sql) — 5 bảng chính (`groups`, `members`, `meal_sessions`, `meal_participants`, `payments`), RLS, seed 1 nhóm mặc định.
   - [`002_food_picker.sql`](supabase/migrations/002_food_picker.sql) — tính năng "Hôm nay ăn gì?": bảng `foods`, `food_picks`, thêm cột `food_id`/`food_name_snapshot` vào `meal_sessions`.
   - [`003_payment_qr.sql`](supabase/migrations/003_payment_qr.sql) — ảnh QR chuyển khoản: cột `groups.payment_qr_url` + storage bucket `payment-qr`.

> ⚠️ **Đã cài app từ trước?** Sau khi pull code mới có tính năng "Hôm nay ăn gì?",
> bạn **bắt buộc phải chạy `002_food_picker.sql`** trong Supabase SQL Editor,
> nếu không trang `/foods` và form tạo bữa ăn sẽ báo lỗi thiếu bảng/cột.

## 3. Tạo tài khoản admin

1. Vào **Authentication → Users → Add user → Create new user**.
2. Nhập email + mật khẩu cho admin, tick **Auto Confirm User**.
3. **Quan trọng:** vào **Authentication → Sign In / Providers**, tắt **Allow new users to sign up**
   để người lạ không tự tạo tài khoản (MVP coi mọi user đã đăng nhập là admin).

## 4. Cấu hình env

```bash
cp .env.example .env.local
```

Điền 2 giá trị lấy từ **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

> Không cần `SUPABASE_SERVICE_ROLE_KEY` — mọi thao tác ghi đều đi qua session
> của admin đã đăng nhập và được RLS bảo vệ.

## 5. Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:3000 → đăng nhập bằng tài khoản admin vừa tạo → vào
**Thành viên** thêm người → **Tạo bữa ăn** và bắt đầu ghi sổ! 🎉

## 6. Deploy lên Vercel

1. Push code lên GitHub/GitLab.
2. Vào [vercel.com](https://vercel.com) → **Add New Project** → import repo (Vercel tự nhận Next.js).
3. Ở bước **Environment Variables**, thêm:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Bấm **Deploy**. Xong!
5. Gửi link `https://your-app.vercel.app/debts` vào nhóm chat — cả nhóm xem công nợ không cần đăng nhập.

## Phân quyền & chế độ public read-only

| Trang | Ai xem được |
|---|---|
| `/debts`, `/meals`, `/meals/[id]` | **Public** (read-only, gửi link cho cả nhóm) |
| `/`, `/foods`, `/members`, `/meals/new`, `/payments`, `/payments/new`, `/settings` | Chỉ admin đã đăng nhập |

Mọi thao tác ghi (thêm/sửa/ẩn/xóa/thanh toán) đều yêu cầu đăng nhập — được chặn
2 lớp: middleware + RLS policy ở database.

**Cách tắt public read-only** (bắt đăng nhập mới xem được):

1. Trong Supabase SQL Editor, chạy:
   ```sql
   drop policy "public read groups" on public.groups;
   drop policy "public read members" on public.members;
   drop policy "public read meal_sessions" on public.meal_sessions;
   drop policy "public read meal_participants" on public.meal_participants;
   drop policy "public read payments" on public.payments;
   ```
2. Trong [`lib/supabase/middleware.ts`](lib/supabase/middleware.ts), xóa `"/debts"` và `"/meals"`
   khỏi mảng `PUBLIC_PATHS`.

## Cách chia tiền & làm tròn

Mỗi người trả `tổng tiền / số người ăn`, **làm tròn đến 500đ gần nhất**
(tiền Việt hiếm khi thu lẻ dưới 500đ). Ví dụ 250.000đ chia 3 người =
83.333đ → thu 83.500đ/người. Sai lệch tối đa 250đ/người — phần lệch nhỏ coi
như người đặt cơm hưởng/chịu. Chi tiết trong [`lib/debt.ts`](lib/debt.ts).

## Cấu trúc thư mục

```
app/                 # Các page (App Router) + server actions (actions.ts)
components/
  ui/                # Button, Card, Input, ConfirmDialog, EmptyState...
  members/ meals/ debts/ payments/ settings/ foods/   # Component theo tính năng
lib/
  supabase/          # Supabase client (browser / server / middleware)
  data.ts            # Hàm đọc dữ liệu dùng chung
  debt.ts            # Logic tính công nợ + làm tròn + text copy
  food-random.ts     # Logic random món có trọng số ("Hôm nay ăn gì?")
  format.ts          # Format tiền VNĐ, ngày tháng
types/               # TypeScript types khớp schema DB
supabase/migrations/ # SQL migration
```

## Scripts

```bash
npm run dev        # Chạy dev server
npm run build      # Build production
npm run typecheck  # Kiểm tra TypeScript
```
