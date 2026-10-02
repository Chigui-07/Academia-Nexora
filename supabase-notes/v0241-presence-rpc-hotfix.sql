-- Academia Nexora v0.24.1
-- Hotfix: los wrappers publicos de presencia deben ejecutarse como SECURITY DEFINER
-- para poder delegar en las funciones privadas, que permanecen sin EXECUTE para usuarios.

create or replace function public.heartbeat_user_presence(p_active boolean default true)
returns void
language sql
security definer
set search_path = public, private, pg_temp
as $$
  select private.heartbeat_user_presence(p_active);
$$;

create or replace function public.get_presence()
returns table(
  user_id uuid,
  display_name text,
  username text,
  last_seen_at timestamptz,
  last_active_at timestamptz,
  presence_status text
)
language sql
security definer
set search_path = public, private, pg_temp
as $$
  select * from private.get_presence();
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
security definer
set search_path = public, private, pg_temp
as $$
  select * from private.get_admin_presence();
$$;

revoke all on function public.heartbeat_user_presence(boolean) from public, anon;
grant execute on function public.heartbeat_user_presence(boolean) to authenticated;

revoke all on function public.get_presence() from public, anon;
grant execute on function public.get_presence() to authenticated;

revoke all on function public.get_admin_presence() from public, anon;
grant execute on function public.get_admin_presence() to authenticated;
