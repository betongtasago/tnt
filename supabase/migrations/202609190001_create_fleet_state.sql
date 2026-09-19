create table if not exists public.app_state (
  id text primary key,
  vehicles jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb,
  notification_logs jsonb not null default '[]'::jsonb,
  last_cron_date text not null default '',
  last_cron_log text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.app_state add column if not exists vehicles jsonb not null default '[]'::jsonb;
alter table public.app_state add column if not exists config jsonb not null default '{}'::jsonb;
alter table public.app_state add column if not exists notification_logs jsonb not null default '[]'::jsonb;
alter table public.app_state add column if not exists last_cron_date text not null default '';
alter table public.app_state add column if not exists last_cron_log text not null default '';
alter table public.app_state add column if not exists updated_at timestamptz not null default now();

alter table public.app_state enable row level security;
revoke all on public.app_state from anon, authenticated;
grant all on public.app_state to service_role;
