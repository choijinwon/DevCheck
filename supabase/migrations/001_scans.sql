-- Run in Supabase SQL editor if you enable scan persistence.
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  issues jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.scans enable row level security;

-- No anon policies: only the Next.js API (service role) accesses this table.
