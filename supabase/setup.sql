begin;
create table if not exists public.tournament_editors (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.tournament_state (
  id text primary key check (id = 'dkcup2026'),
  state jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
create table if not exists public.tournament_public (
  id text primary key check (id = 'dkcup2026'),
  state jsonb not null,
  version bigint not null,
  updated_at timestamptz not null default now()
);
alter table public.tournament_editors enable row level security;
alter table public.tournament_state enable row level security;
alter table public.tournament_public enable row level security;
revoke all on public.tournament_editors, public.tournament_state, public.tournament_public from anon, authenticated;
grant select on public.tournament_editors, public.tournament_state to authenticated;
grant select on public.tournament_public to anon, authenticated;
drop policy if exists own_editor on public.tournament_editors;
create policy own_editor on public.tournament_editors for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists editor_read on public.tournament_state;
create policy editor_read on public.tournament_state for select to authenticated using (exists (select 1 from public.tournament_editors where user_id = (select auth.uid())));
drop policy if exists public_read on public.tournament_public;
create policy public_read on public.tournament_public for select to anon, authenticated using (true);
create or replace function public.save_tournament(next_state jsonb, expected_version bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  current_version bigint;
  new_version bigint;
  snapshot jsonb;
begin
  if auth.uid() is null or not exists (select 1 from public.tournament_editors where user_id = auth.uid()) then
    raise exception 'Only authorized officials can publish changes' using errcode = '42501';
  end if;
  if next_state is null or jsonb_typeof(next_state) <> 'object'
     or jsonb_typeof(next_state->'matches') is distinct from 'array'
     or jsonb_typeof(next_state->'registration') is distinct from 'object'
     or jsonb_typeof(next_state->'confirmed'->'men') is distinct from 'boolean'
     or jsonb_typeof(next_state->'confirmed'->'women') is distinct from 'boolean'
     or octet_length(next_state::text) > 8000000 then
    raise exception 'Invalid tournament data' using errcode = '22023';
  end if;
  -- Serialize initial creation and updates; stale clients cannot overwrite another official.
  perform pg_advisory_xact_lock(20260917);
  select version into current_version from public.tournament_state where id = 'dkcup2026';
  current_version := coalesce(current_version, 0);
  if expected_version is null or expected_version <> current_version then
    raise exception 'Another official has updated the tournament. Reload before editing again.' using errcode = '40001';
  end if;
  new_version := current_version + 1;
  -- Pending pot numbers are private until that competition's draw is confirmed.
  snapshot := jsonb_set(next_state, '{registration}', jsonb_build_object(
    'men', (select jsonb_agg(case when (next_state->'confirmed'->>'men')::boolean then t else t || '{"number":null}'::jsonb end order by n) from jsonb_array_elements(next_state->'registration'->'men') with ordinality a(t,n)),
    'women', (select jsonb_agg(case when (next_state->'confirmed'->>'women')::boolean then t else t || '{"number":null}'::jsonb end order by n) from jsonb_array_elements(next_state->'registration'->'women') with ordinality a(t,n))
  ));
  insert into public.tournament_state values ('dkcup2026', next_state, new_version, now())
    on conflict (id) do update set state = excluded.state, version = excluded.version, updated_at = excluded.updated_at;
  insert into public.tournament_public values ('dkcup2026', snapshot, new_version, now())
    on conflict (id) do update set state = excluded.state, version = excluded.version, updated_at = excluded.updated_at;
  return new_version;
end;
$$;
revoke all on function public.save_tournament(jsonb,bigint) from public, anon;
grant execute on function public.save_tournament(jsonb,bigint) to authenticated;
commit;
