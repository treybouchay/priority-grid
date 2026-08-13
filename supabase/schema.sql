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

-- Sync history / restore points (keep recent snapshots per user)
create table if not exists public.app_state_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  task_count integer not null default 0,
  reason text not null default 'auto',
  created_at timestamptz not null default now()
);

create index if not exists app_state_history_user_created_idx
  on public.app_state_history (user_id, created_at desc);

alter table public.app_state_history enable row level security;

create policy "Users select own app_state_history"
  on public.app_state_history
  for select
  using (auth.uid() = user_id);

create policy "Users insert own app_state_history"
  on public.app_state_history
  for insert
  with check (auth.uid() = user_id);

create policy "Users delete own app_state_history"
  on public.app_state_history
  for delete
  using (auth.uid() = user_id);

-- Optional: live updates when another device saves (Settings → Database → Replication)
-- alter publication supabase_realtime add table app_state;
