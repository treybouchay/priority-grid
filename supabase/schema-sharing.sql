-- Shared spaces: personal accounts stay private; share selected lists between members.
-- Run in Supabase SQL Editor after schema.sql (and schema-history.sql if you use history).

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Shared',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.space_members (
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create table if not exists public.space_invites (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  unique (space_id, email)
);

create table if not exists public.space_state (
  space_id uuid primary key references public.spaces (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists space_members_user_idx on public.space_members (user_id);
create index if not exists space_invites_email_idx on public.space_invites (lower(email), status);

alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.space_invites enable row level security;
alter table public.space_state enable row level security;

create or replace function public.is_space_member(sid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_members m
    where m.space_id = sid
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.create_space(space_name text default 'Shared')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sid uuid;
  label text := nullif(trim(space_name), '');
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if label is null then
    label := 'Shared';
  end if;

  insert into public.spaces (name, created_by)
  values (left(label, 64), uid)
  returning id into sid;

  insert into public.space_members (space_id, user_id, role)
  values (sid, uid, 'owner');

  insert into public.space_state (space_id, payload, updated_at)
  values (sid, jsonb_build_object('version', 1, 'updatedAt', now(), 'contexts', '[]'::jsonb, 'tasks', '{}'::jsonb, 'deleted', '{}'::jsonb), now());

  return sid;
end;
$$;

create or replace function public.invite_to_space(sid uuid, invite_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  em text := lower(trim(invite_email));
  invite_id uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if em is null or em = '' or position('@' in em) = 0 then
    raise exception 'invalid email';
  end if;
  if not public.is_space_member(sid) then
    raise exception 'not a member of this space';
  end if;

  insert into public.space_invites (space_id, email, invited_by, status)
  values (sid, em, uid, 'pending')
  on conflict (space_id, email) do update
    set status = 'pending',
        invited_by = excluded.invited_by,
        created_at = now()
  returning id into invite_id;

  return invite_id;
end;
$$;

create or replace function public.accept_space_invite(invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  em text := lower(coalesce(auth.jwt() ->> 'email', ''));
  inv public.space_invites%rowtype;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select * into inv
  from public.space_invites
  where id = invite_id
    and status = 'pending';

  if not found then
    raise exception 'invite not found';
  end if;
  if lower(inv.email) <> em then
    raise exception 'invite email mismatch';
  end if;

  insert into public.space_members (space_id, user_id, role)
  values (inv.space_id, uid, 'member')
  on conflict do nothing;

  update public.space_invites
  set status = 'accepted'
  where id = invite_id;

  return inv.space_id;
end;
$$;

revoke all on function public.create_space(text) from public;
revoke all on function public.invite_to_space(uuid, text) from public;
revoke all on function public.accept_space_invite(uuid) from public;
grant execute on function public.create_space(text) to authenticated;
grant execute on function public.invite_to_space(uuid, text) to authenticated;
grant execute on function public.accept_space_invite(uuid) to authenticated;

drop policy if exists "Members select spaces" on public.spaces;
create policy "Members select spaces"
  on public.spaces for select
  using (public.is_space_member(id) or created_by = auth.uid());

drop policy if exists "Members select space_members" on public.space_members;
create policy "Members select space_members"
  on public.space_members for select
  using (public.is_space_member(space_id) or user_id = auth.uid());

drop policy if exists "Members select space_invites" on public.space_invites;
create policy "Members select space_invites"
  on public.space_invites for select
  using (
    public.is_space_member(space_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Members update own pending invites" on public.space_invites;
create policy "Members update own pending invites"
  on public.space_invites for update
  using (
    public.is_space_member(space_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Members select space_state" on public.space_state;
create policy "Members select space_state"
  on public.space_state for select
  using (public.is_space_member(space_id));

drop policy if exists "Members update space_state" on public.space_state;
create policy "Members update space_state"
  on public.space_state for update
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));

drop policy if exists "Members insert space_state" on public.space_state;
create policy "Members insert space_state"
  on public.space_state for insert
  with check (public.is_space_member(space_id));

-- Optional realtime for live shared-list updates
-- alter publication supabase_realtime add table space_state;

grant select on public.spaces to authenticated;
grant select on public.space_members to authenticated;
grant select, update on public.space_invites to authenticated;
grant select, insert, update on public.space_state to authenticated;
