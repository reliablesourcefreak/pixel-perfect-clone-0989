
-- Extensions
create extension if not exists pg_trgm;

-- ============ API KEYS ============
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default array['read']::text[],
  is_active boolean not null default true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_api_keys_user on public.api_keys(user_id);
create index idx_api_keys_hash on public.api_keys(key_hash);
alter table public.api_keys enable row level security;
create policy "Users view own api keys" on public.api_keys for select using (auth.uid() = user_id);
create policy "Users insert own api keys" on public.api_keys for insert with check (auth.uid() = user_id);
create policy "Users update own api keys" on public.api_keys for update using (auth.uid() = user_id);
create policy "Users delete own api keys" on public.api_keys for delete using (auth.uid() = user_id);

create table public.api_key_usage (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  day date not null default current_date,
  request_count integer not null default 0,
  unique (api_key_id, day)
);
alter table public.api_key_usage enable row level security;
create policy "Users view own key usage" on public.api_key_usage for select using (
  exists (select 1 from public.api_keys k where k.id = api_key_usage.api_key_id and k.user_id = auth.uid())
);

-- ============ WEBHOOKS ============
create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  url text not null,
  events text[] not null default array['*']::text[],
  secret text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_webhooks_user on public.webhooks(user_id);
alter table public.webhooks enable row level security;
create policy "Users view own webhooks" on public.webhooks for select using (auth.uid() = user_id);
create policy "Users insert own webhooks" on public.webhooks for insert with check (auth.uid() = user_id);
create policy "Users update own webhooks" on public.webhooks for update using (auth.uid() = user_id);
create policy "Users delete own webhooks" on public.webhooks for delete using (auth.uid() = user_id);
create trigger trg_webhooks_updated before update on public.webhooks for each row execute function public.update_updated_at_column();

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  response_status integer,
  response_body text,
  attempt_count integer not null default 0,
  delivered_at timestamptz,
  next_retry_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_wd_webhook on public.webhook_deliveries(webhook_id);
create index idx_wd_pending on public.webhook_deliveries(next_retry_at) where delivered_at is null;
alter table public.webhook_deliveries enable row level security;
create policy "Users view own deliveries" on public.webhook_deliveries for select using (
  exists (select 1 from public.webhooks w where w.id = webhook_deliveries.webhook_id and w.user_id = auth.uid())
);

-- ============ AUDIT LOG ============
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_user_time on public.audit_log(user_id, created_at desc);
alter table public.audit_log enable row level security;
create policy "Users view own audit" on public.audit_log for select using (auth.uid() = user_id);
create policy "Users insert own audit" on public.audit_log for insert with check (auth.uid() = user_id);

-- ============ BACKGROUND JOBS ============
create table public.background_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  progress integer not null default 0,
  result jsonb,
  error text,
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_jobs_user on public.background_jobs(user_id, created_at desc);
create index idx_jobs_pending on public.background_jobs(scheduled_at) where status = 'pending';
alter table public.background_jobs enable row level security;
create policy "Users view own jobs" on public.background_jobs for select using (auth.uid() = user_id);
create policy "Users insert own jobs" on public.background_jobs for insert with check (auth.uid() = user_id);
create policy "Users update own jobs" on public.background_jobs for update using (auth.uid() = user_id);

-- ============ REVISIONS ============
create table public.artwork_revisions (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null,
  user_id uuid not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index idx_artrev_art on public.artwork_revisions(artwork_id, created_at desc);
alter table public.artwork_revisions enable row level security;
create policy "Users view own art revisions" on public.artwork_revisions for select using (auth.uid() = user_id);
create policy "Users insert own art revisions" on public.artwork_revisions for insert with check (auth.uid() = user_id);

create table public.codex_revisions (
  id uuid primary key default gen_random_uuid(),
  codex_entry_id uuid not null,
  user_id uuid not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index idx_codrev_e on public.codex_revisions(codex_entry_id, created_at desc);
alter table public.codex_revisions enable row level security;
create policy "Users view own codex revisions" on public.codex_revisions for select using (auth.uid() = user_id);
create policy "Users insert own codex revisions" on public.codex_revisions for insert with check (auth.uid() = user_id);

create table public.story_revisions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null,
  user_id uuid not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index idx_strev_s on public.story_revisions(story_id, created_at desc);
alter table public.story_revisions enable row level security;
create policy "Users view own story revisions" on public.story_revisions for select using (auth.uid() = user_id);
create policy "Users insert own story revisions" on public.story_revisions for insert with check (auth.uid() = user_id);

-- ============ SOFT DELETE ============
alter table public.artworks add column if not exists deleted_at timestamptz;
alter table public.codex_entries add column if not exists deleted_at timestamptz;
alter table public.stories add column if not exists deleted_at timestamptz;
alter table public.collections add column if not exists deleted_at timestamptz;
create index if not exists idx_artworks_deleted on public.artworks(deleted_at);
create index if not exists idx_codex_deleted on public.codex_entries(deleted_at);
create index if not exists idx_stories_deleted on public.stories(deleted_at);
create index if not exists idx_collections_deleted on public.collections(deleted_at);

-- ============ SEARCH INDEXES ============
create index if not exists idx_artworks_title_trgm on public.artworks using gin (title gin_trgm_ops);
create index if not exists idx_tags_tag_trgm on public.artwork_tags using gin (tag gin_trgm_ops);
create index if not exists idx_codex_title_trgm on public.codex_entries using gin (title gin_trgm_ops);
create index if not exists idx_codex_content_fts on public.codex_entries using gin (to_tsvector('english', coalesce(content,'') || ' ' || coalesce(ai_summary,'')));
create index if not exists idx_stories_title_trgm on public.stories using gin (title gin_trgm_ops);
create index if not exists idx_stories_desc_fts on public.stories using gin (to_tsvector('english', coalesce(description,'') || ' ' || coalesce(ai_summary,'')));
create index if not exists idx_collections_name_trgm on public.collections using gin (name gin_trgm_ops);
