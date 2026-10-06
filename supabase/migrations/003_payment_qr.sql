-- ============================================================
-- CƠM CHUNG - Migration 003: Ảnh QR chuyển khoản 📱
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- (sau khi đã chạy 001, 002)
-- ============================================================

-- URL public của ảnh QR (null = chưa có, ẩn khối QR)
alter table public.groups add column payment_qr_url text;

-- Bucket public chứa ảnh QR (giới hạn 5MB, chỉ nhận ảnh)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-qr',
  'payment-qr',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Bucket public nên ai cũng xem được ảnh qua URL.
-- GHI: chỉ admin đã đăng nhập mới upload/xoá được.
create policy "admin write payment-qr" on storage.objects
  for all to authenticated
  using (bucket_id = 'payment-qr')
  with check (bucket_id = 'payment-qr');
