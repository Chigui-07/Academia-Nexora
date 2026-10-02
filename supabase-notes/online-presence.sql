-- Academia Nexora v0.23 — Presencia en línea privada para Administración

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;

-- Los alumnos no pueden leer la lista de presencia.
-- Solo Administración puede consultarla directamente.
drop policy if exists user_presence_admin_select on public.user_presence;
create policy user_presence_admin_select
on public.user_presence
for select
to authenticated
using (public.has_role('admin'));

create or replace function private.heartbeat_user_presence(p_active boolean default true)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_presence(user_id, last_seen_at, last_active_at, updated_at)
  values (
    v_user_id,
    now(),
    case when p_active then now() else now() - interval '6 minutes' end,
    now()
  )
  on conflict (user_id) do update
    set last_seen_at = now(),
        last_active_at = case
          when p_active then now()
          else least(public.user_presence.last_active_at, now() - interval '6 minutes')
        end,
        updated_at = now();
end;
$$;

create or replace function public.heartbeat_user_presence(p_active boolean default true)
returns void
language sql
set search_path = public, private, pg_temp
as $$
  select private.heartbeat_user_presence(p_active);
$$;

create or replace function private.get_admin_presence()
returns table(
  user_id uuid,
  display_name text,
  username text,
  student_code text,
  last_seen_at timestamptz,
  last_active_at timestamptz,
  presence_status text
)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_role('admin') then
    raise exception 'Admin role required';
  end if;

  return query
  select
    p.id,
    coalesce(nullif(trim(p.display_name), ''), nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), p.username, 'Usuario')::text,
    p.username::text,
    p.student_code::text,
    up.last_seen_at,
    up.last_active_at,
    case
      when up.last_seen_at is null or up.last_seen_at < now() - interval '2 minutes' then 'offline'
      when up.last_active_at < now() - interval '5 minutes' then 'idle'
      else 'online'
    end::text
  from public.profiles p
  left join public.user_presence up on up.user_id = p.id
  order by
    case
      when up.last_seen_at is not null
        and up.last_seen_at >= now() - interval '2 minutes'
        and up.last_active_at >= now() - interval '5 minutes' then 0
      when up.last_seen_at is not null
        and up.last_seen_at >= now() - interval '2 minutes' then 1
      else 2
    end,
    lower(coalesce(nullif(trim(p.display_name), ''), p.username, 'usuario'));
end;
$$;

create or replace function public.get_admin_presence()
returns table(
  user_id uuid,
  display_name text,
  username text,
  student_code text,
  last_seen_at timestamptz,
  last_active_at timestamptz,
  presence_status text
)
language sql
set search_path = public, private, pg_temp
as $$
  select * from private.get_admin_presence();
$$;

revoke all on public.user_presence from anon;
revoke all on public.user_presence from authenticated;
grant select on public.user_presence to authenticated;

grant execute on function public.heartbeat_user_presence(boolean) to authenticated;
grant execute on function public.get_admin_presence() to authenticated;
