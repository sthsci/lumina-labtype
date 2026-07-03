-- LBTI public cohort atlas: anonymous, insert-only, strictly validated.
--
-- Security model:
--   * anon (publishable key) may SELECT all rows and INSERT valid rows.
--   * anon may NOT UPDATE or DELETE any row.
--   * only derived, non-identifying data is accepted (15-d vector, codes,
--     loose context). No raw answers or identities are ever stored.
--
-- Run in the Supabase SQL editor, or via the Supabase CLI.

create extension if not exists "pgcrypto";

create table if not exists public.cohort_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  primary_code text not null,
  secondary_code text not null,
  match_strength integer not null,
  classification_margin double precision not null,
  vector jsonb not null,
  context jsonb,
  -- validation constraints (mirror the client-side checks)
  constraint cohort_primary_code_len check (char_length(primary_code) between 1 and 16),
  constraint cohort_secondary_code_len check (char_length(secondary_code) between 1 and 16),
  constraint cohort_match_strength_range check (match_strength between 0 and 100),
  constraint cohort_margin_range check (classification_margin >= 0 and classification_margin <= 1),
  constraint cohort_vector_is_array check (jsonb_typeof(vector) = 'array'),
  constraint cohort_vector_len_15 check (jsonb_array_length(vector) = 15)
);

-- Reject vectors whose values fall outside 0..100 (checked element-by-element).
create or replace function public.cohort_vector_in_range(v jsonb)
returns boolean
language sql
immutable
as $$
  select coalesce(bool_and((e)::numeric >= 0 and (e)::numeric <= 100), false)
  from jsonb_array_elements_text(v) as e
$$;

alter table public.cohort_records
  drop constraint if exists cohort_vector_range;
alter table public.cohort_records
  add constraint cohort_vector_range check (public.cohort_vector_in_range(vector));

create index if not exists cohort_records_created_at_idx
  on public.cohort_records (created_at desc);

-- Row Level Security -------------------------------------------------------
alter table public.cohort_records enable row level security;

drop policy if exists "cohort anon select" on public.cohort_records;
create policy "cohort anon select"
  on public.cohort_records
  for select
  to anon
  using (true);

drop policy if exists "cohort anon insert" on public.cohort_records;
create policy "cohort anon insert"
  on public.cohort_records
  for insert
  to anon
  with check (
    char_length(primary_code) between 1 and 16
    and char_length(secondary_code) between 1 and 16
    and match_strength between 0 and 100
    and classification_margin >= 0 and classification_margin <= 1
    and jsonb_typeof(vector) = 'array'
    and jsonb_array_length(vector) = 15
    and public.cohort_vector_in_range(vector)
  );

-- No UPDATE or DELETE policies exist, so anon can do neither (RLS denies by default).
