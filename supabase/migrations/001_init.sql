-- ============================================================
-- CƠM CHUNG - Migration khởi tạo
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- ============================================================

-- ---------- BẢNG ----------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fun_header text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id),
  name text not null,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.meal_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id),
  date date not null,
  payer_member_id uuid references public.members(id),
  total_amount numeric not null check (total_amount > 0),
  participant_count int not null check (participant_count > 0),
  per_person_amount numeric not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.meal_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.meal_sessions(id) on delete cascade,
  member_id uuid not null references public.members(id),
  amount_due numeric not null,
  created_at timestamptz not null default now(),
  unique (session_id, member_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id),
  member_id uuid not null references public.members(id),
  amount numeric not null check (amount > 0),
  paid_at date not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Index cho các query hay dùng
create index idx_members_group on public.members(group_id);
create index idx_meal_sessions_group_date on public.meal_sessions(group_id, date desc);
create index idx_meal_participants_session on public.meal_participants(session_id);
create index idx_meal_participants_member on public.meal_participants(member_id);
create index idx_payments_group on public.payments(group_id);
create index idx_payments_member on public.payments(member_id);

-- ---------- RLS ----------

alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.meal_sessions enable row level security;
alter table public.meal_participants enable row level security;
alter table public.payments enable row level security;

-- GHI: chỉ user đã đăng nhập (admin) mới được insert/update/delete.
-- MVP: mọi user trong Supabase Auth đều là admin
-- (chỉ tạo tài khoản cho admin trong Dashboard, tắt sign-up public).

create policy "admin write groups" on public.groups
  for all to authenticated using (true) with check (true);

create policy "admin write members" on public.members
  for all to authenticated using (true) with check (true);

create policy "admin write meal_sessions" on public.meal_sessions
  for all to authenticated using (true) with check (true);

create policy "admin write meal_participants" on public.meal_participants
  for all to authenticated using (true) with check (true);

create policy "admin write payments" on public.payments
  for all to authenticated using (true) with check (true);

-- ĐỌC PUBLIC (read-only): cho phép anon SELECT để trang /debts và /meals
-- xem được không cần đăng nhập (link gửi vào nhóm chat).
--
-- ⚠️ CÁCH TẮT chế độ public read-only:
--   Chạy: drop policy "public read groups" on public.groups; (tương tự cho 4 bảng còn lại)
--   Sau đó mọi trang đều yêu cầu đăng nhập (cần bỏ /debts, /meals khỏi
--   PUBLIC_PATHS trong lib/supabase/middleware.ts).

create policy "public read groups" on public.groups
  for select to anon using (true);

create policy "public read members" on public.members
  for select to anon using (true);

create policy "public read meal_sessions" on public.meal_sessions
  for select to anon using (true);

create policy "public read meal_participants" on public.meal_participants
  for select to anon using (true);

create policy "public read payments" on public.payments
  for select to anon using (true);

-- ---------- SEED ----------
-- Tạo sẵn 1 nhóm mặc định (app hiện hỗ trợ 1 nhóm - MVP).
insert into public.groups (name, fun_header)
values ('Cơm Chung', 'Biệt đội cơm trưa 🍚');
