-- ============================================================
-- 今天吃什么 · Supabase 数据库结构
-- 在 Supabase 控制台 → SQL Editor 中完整粘贴本文件并运行一次即可。
-- 作用：建表 + 开启行级安全(RLS) + 仅允许操作自己的数据。
-- ============================================================

-- ① 收藏表（想吃清单）
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id text not null,
  shop_name text not null,
  shop_address text default '',
  shop_lng double precision,
  shop_lat double precision,
  category text default '',
  created_at timestamptz default now()
);

-- ② 抽签历史表（时间线）
create table if not exists public.draw_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id text not null,
  shop_name text not null,
  shop_address text default '',
  shop_lng double precision,
  shop_lat double precision,
  category text default '',
  drawn_at timestamptz default now()
);

-- ③ 开启行级安全（RLS）：前端 anon key 受此策略约束，只能读写自己的数据
alter table public.favorites enable row level security;
alter table public.draw_history enable row level security;

-- ④ 策略：仅本人可操作
drop policy if exists "favorites_owner" on public.favorites;
create policy "favorites_owner" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "history_owner" on public.draw_history;
create policy "history_owner" on public.draw_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ⑤ 常用查询索引（加速）
create index if not exists favorites_user_idx on public.favorites(user_id);
create index if not exists history_user_idx on public.draw_history(user_id, drawn_at desc);
