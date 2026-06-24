-- ALLIN1 database schema
-- Run this in the Supabase SQL editor (or `psql`) for your project.
-- The app talks to these tables only through the server-side service-role
-- client, so Row Level Security is enabled with no public policies.

-- Short links created by the URL Shortener tool.
create table if not exists public.short_urls (
  code        text primary key,
  target_url  text not null,
  clicks      integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Leads captured by the "Get early access" CTA.
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text,
  created_at  timestamptz not null default now()
);

alter table public.short_urls enable row level security;
alter table public.leads enable row level security;

-- No anon/auth policies are defined on purpose: only the service role
-- (used by Route Handlers) may read/write these tables.
