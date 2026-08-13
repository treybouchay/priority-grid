-- Add sync history table if you already ran the original schema.
-- Paste into Supabase SQL Editor and Run.

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

drop policy if exists "Users select own app_state_history" on public.app_state_history;
create policy "Users select own app_state_history"
  on public.app_state_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own app_state_history" on public.app_state_history;
create policy "Users insert own app_state_history"
  on public.app_state_history
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own app_state_history" on public.app_state_history;
create policy "Users delete own app_state_history"
  on public.app_state_history
  for delete
  using (auth.uid() = user_id);
