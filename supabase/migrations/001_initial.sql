-- Thailand Outlook — Supabase initial schema (SPEC-09)
--
-- Normalised two-table layout:
--   indicators  — one row per indicator (metadata)
--   data_points — one row per (indicator, date) observation
--
-- Run against your Supabase project via:
--   supabase db push
-- or paste into the Supabase SQL Editor and run.

-- ── 1. indicators ─────────────────────────────────────────────────────────────

create table if not exists public.indicators (
  code         text        primary key,
  name         text        not null,
  unit         text        not null default '',
  sector       text        not null default '',
  frequency    text        not null default 'annual'
               check (frequency in ('daily', 'monthly', 'quarterly', 'annual')),
  source_name  text        not null default '',
  source_url   text,
  is_demo      boolean     not null default false,
  created_at   timestamptz not null default now()
);

comment on table public.indicators is
  'One row per economic indicator — stores metadata used by chart labels, source badges, and the data editor.';

comment on column public.indicators.code is
  'Stable snake_case identifier (e.g. "real_gdp_growth_pct"). Never change — used as FK and in URL params.';

comment on column public.indicators.is_demo is
  'True when the series is modelled/estimated rather than an official statistic.';

-- ── 2. data_points ────────────────────────────────────────────────────────────

create table if not exists public.data_points (
  id              bigint      generated always as identity primary key,
  indicator_code  text        not null references public.indicators (code) on delete cascade,
  date            text        not null,   -- ISO 8601: "YYYY", "YYYY-MM", or "YYYY-MM-DD"
  value           double precision not null,
  created_at      timestamptz not null default now(),

  -- One observation per (indicator, date) — prevents duplicate uploads
  unique (indicator_code, date)
);

comment on table public.data_points is
  'Time-series observations. Each row is one value for one indicator at one point in time.';

comment on column public.data_points.date is
  'ISO 8601 date string. Annual series use "YYYY", monthly use "YYYY-MM", daily use "YYYY-MM-DD".';

comment on column public.data_points.value is
  'The numeric observation. Unit interpretation lives in indicators.unit.';

-- ── 3. Indexes ────────────────────────────────────────────────────────────────

create index if not exists data_points_indicator_code_idx
  on public.data_points (indicator_code);

create index if not exists data_points_date_idx
  on public.data_points (date);

-- ── 4. Row-level security ─────────────────────────────────────────────────────
-- Read-only public access; writes require the service-role key or a
-- privileged role (not the anon key used by the browser client).

alter table public.indicators  enable row level security;
alter table public.data_points enable row level security;

-- Anonymous (browser) users may read everything.
create policy "public read indicators"
  on public.indicators for select
  using (true);

create policy "public read data_points"
  on public.data_points for select
  using (true);

-- ── 5. Helper view (optional convenience) ────────────────────────────────────

create or replace view public.indicator_latest as
  select
    i.code,
    i.name,
    i.unit,
    i.sector,
    i.source_name,
    dp.date  as latest_date,
    dp.value as latest_value
  from public.indicators i
  join lateral (
    select date, value
    from public.data_points
    where indicator_code = i.code
    order by date desc
    limit 1
  ) dp on true;

comment on view public.indicator_latest is
  'Convenience view: each indicator paired with its most recent observation.';
