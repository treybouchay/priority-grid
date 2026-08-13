-- Priority Grid / Presence — blob sync (one row per user)
-- Run in Supabase SQL Editor after creating your project.

create table if not exists public.app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists app_state_updated_at_idx on public.app_state (updated_at desc);

alter table public.app_state enable row level security;

create policy "Users select own app_state"
  on public.app_state
  for select
  using (auth.uid() = user_id);

create policy "Users insert own app_state"
  on public.app_state
  for insert
  with check (auth.uid() = user_id);

create policy "Users update own app_state"
  on public.app_state
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: live updates when another device saves (Settings → Database → Replication)
-- alter publication supabase_realtime add table app_state;
