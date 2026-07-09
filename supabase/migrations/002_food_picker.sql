-- ============================================================
-- CƠM CHUNG - Migration 002: Tính năng "Hôm nay ăn gì?" 🎲
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- (sau khi đã chạy 001_init.sql)
-- ============================================================

-- ---------- BẢNG MỚI ----------

-- Danh sách món/quán yêu thích của nhóm
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id),
  name text not null,
  note text,
  menu_url text,
  estimated_price numeric check (estimated_price is null or estimated_price >= 0),
  tag text,
  is_active boolean not null default true,
  picked_count int not null default 0,
  last_picked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Lịch sử các lần chốt món
create table public.food_picks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id),
  food_id uuid references public.foods(id),
  food_name_snapshot text not null,
  picked_at timestamptz not null default now(),
  picked_by uuid references auth.users(id),
  note text
);

-- Bữa ăn gắn với món đã chọn (không bắt buộc).
-- food_name_snapshot giữ tên món tại thời điểm tạo bữa - sau này
-- món có đổi tên thì lịch sử bữa ăn vẫn hiển thị tên cũ.
alter table public.meal_sessions
  add column food_id uuid references public.foods(id),
  add column food_name_snapshot text;

-- ---------- INDEX ----------

create index idx_foods_group on public.foods(group_id);
create index idx_foods_group_active on public.foods(group_id, is_active);
create index idx_food_picks_group_picked_at on public.food_picks(group_id, picked_at desc);

-- ---------- RLS (nhất quán với migration 001) ----------

alter table public.foods enable row level security;
alter table public.food_picks enable row level security;

-- GHI: chỉ user đã đăng nhập (admin)
create policy "admin write foods" on public.foods
  for all to authenticated using (true) with check (true);

create policy "admin write food_picks" on public.food_picks
  for all to authenticated using (true) with check (true);

-- ĐỌC PUBLIC (read-only) - giống các bảng khác.
-- Nếu đã tắt public read-only ở migration 001 thì bỏ qua (không chạy) 2 policy này.
create policy "public read foods" on public.foods
  for select to anon using (true);

create policy "public read food_picks" on public.food_picks
  for select to anon using (true);
