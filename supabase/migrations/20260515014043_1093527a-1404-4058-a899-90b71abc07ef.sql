
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.increment_api_key_usage(_key_id uuid, _day date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.api_key_usage (api_key_id, day, request_count)
  values (_key_id, _day, 1)
  on conflict (api_key_id, day) do update set request_count = api_key_usage.request_count + 1;
end;
$$;
revoke all on function public.increment_api_key_usage(uuid, date) from public, anon, authenticated;
