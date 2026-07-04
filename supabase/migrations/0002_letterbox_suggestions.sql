-- LBTI Letterbox: anonymous community suggestions for new types and questions.
--
-- Security model:
--   * anon may INSERT validated suggestions only.
--   * anon may NOT SELECT, UPDATE or DELETE suggestions.
--   * moderation status is private; no public read policy is defined.
--   * no names, emails, institutions, IP addresses or raw LBTI answers are stored.
--
-- Run in the Supabase SQL editor, or via the Supabase CLI.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'letterbox_status') then
    create type public.letterbox_status as enum (
      'new',
      'reviewing',
      'shortlisted',
      'accepted',
      'rejected',
      'duplicate',
      'archived'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'letterbox_locale') then
    create type public.letterbox_locale as enum ('zh-CN', 'zh-TW', 'en');
  end if;
  if not exists (select 1 from pg_type where typname = 'letterbox_answer_format') then
    create type public.letterbox_answer_format as enum (
      'five_point_agreement',
      'seven_point_agreement',
      'frequency',
      'forced_choice',
      'situational_choice',
      'free_text_research_idea'
    );
  end if;
end
$$;

create or replace function public.nonblank_text(v text)
returns boolean
language sql
immutable
as $$
  select v is not null and btrim(v) <> ''
$$;

create table if not exists public.type_suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status public.letterbox_status not null default 'new',
  locale public.letterbox_locale not null,
  proposed_code text,
  proposed_name text not null,
  summary text not null,
  behaviour_example text not null,
  distinction_from_existing text not null,
  tagline text,
  strength text,
  failure_mode text,
  discipline text,
  extra_notes text,
  current_type text,
  content_hash text not null,
  app_version text,
  constraint type_suggestions_status_new_on_insert check (status = 'new' or status in ('reviewing', 'shortlisted', 'accepted', 'rejected', 'duplicate', 'archived')),
  constraint type_suggestions_code_format check (proposed_code is null or proposed_code ~ '^[A-Z0-9]{2,12}$'),
  constraint type_suggestions_name_len check (char_length(proposed_name) between 2 and 60 and public.nonblank_text(proposed_name)),
  constraint type_suggestions_summary_len check (char_length(summary) between 10 and 200 and public.nonblank_text(summary)),
  constraint type_suggestions_behaviour_len check (char_length(behaviour_example) between 20 and 1000 and public.nonblank_text(behaviour_example)),
  constraint type_suggestions_distinction_len check (char_length(distinction_from_existing) between 20 and 1000 and public.nonblank_text(distinction_from_existing)),
  constraint type_suggestions_optional_len check (
    coalesce(char_length(tagline), 0) <= 1000
    and coalesce(char_length(strength), 0) <= 1000
    and coalesce(char_length(failure_mode), 0) <= 1000
    and coalesce(char_length(discipline), 0) <= 1000
    and coalesce(char_length(extra_notes), 0) <= 1000
    and coalesce(char_length(current_type), 0) <= 16
    and coalesce(char_length(app_version), 0) <= 40
    and char_length(content_hash) between 8 and 80
  )
);

create table if not exists public.question_suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status public.letterbox_status not null default 'new',
  locale public.letterbox_locale not null,
  question_text text not null,
  rationale text not null,
  intended_distinction text not null,
  suggested_dimension text,
  laboratory_scenario text,
  answer_format public.letterbox_answer_format,
  scale_min integer,
  scale_max integer,
  reverse_scored boolean,
  low_response_meaning text,
  high_response_meaning text,
  discipline text,
  extra_notes text,
  current_type text,
  content_hash text not null,
  app_version text,
  constraint question_suggestions_status_new_on_insert check (status = 'new' or status in ('reviewing', 'shortlisted', 'accepted', 'rejected', 'duplicate', 'archived')),
  constraint question_suggestions_question_len check (char_length(question_text) between 10 and 500 and public.nonblank_text(question_text)),
  constraint question_suggestions_rationale_len check (char_length(rationale) between 20 and 1000 and public.nonblank_text(rationale)),
  constraint question_suggestions_distinction_len check (char_length(intended_distinction) between 20 and 1000 and public.nonblank_text(intended_distinction)),
  constraint question_suggestions_optional_len check (
    coalesce(char_length(suggested_dimension), 0) <= 1000
    and coalesce(char_length(laboratory_scenario), 0) <= 1000
    and coalesce(char_length(low_response_meaning), 0) <= 1000
    and coalesce(char_length(high_response_meaning), 0) <= 1000
    and coalesce(char_length(discipline), 0) <= 1000
    and coalesce(char_length(extra_notes), 0) <= 1000
    and coalesce(char_length(current_type), 0) <= 16
    and coalesce(char_length(app_version), 0) <= 40
    and char_length(content_hash) between 8 and 80
  ),
  constraint question_suggestions_scale_range check (
    (scale_min is null and scale_max is null)
    or (scale_min = 1 and scale_max in (5, 7) and scale_min < scale_max)
  )
);

create unique index if not exists type_suggestions_content_hash_uidx
  on public.type_suggestions (content_hash)
  where content_hash is not null;

create unique index if not exists question_suggestions_content_hash_uidx
  on public.question_suggestions (content_hash)
  where content_hash is not null;

create index if not exists type_suggestions_created_at_idx
  on public.type_suggestions (created_at desc);

create index if not exists question_suggestions_created_at_idx
  on public.question_suggestions (created_at desc);

create index if not exists type_suggestions_status_idx
  on public.type_suggestions (status);

create index if not exists question_suggestions_status_idx
  on public.question_suggestions (status);

alter table public.type_suggestions enable row level security;
alter table public.question_suggestions enable row level security;

drop policy if exists "letterbox type anon insert" on public.type_suggestions;
create policy "letterbox type anon insert"
  on public.type_suggestions
  for insert
  to anon
  with check (
    status = 'new'
    and locale::text in ('zh-CN', 'zh-TW', 'en')
    and public.nonblank_text(proposed_name)
    and public.nonblank_text(summary)
    and public.nonblank_text(behaviour_example)
    and public.nonblank_text(distinction_from_existing)
    and public.nonblank_text(content_hash)
  );

drop policy if exists "letterbox question anon insert" on public.question_suggestions;
create policy "letterbox question anon insert"
  on public.question_suggestions
  for insert
  to anon
  with check (
    status = 'new'
    and locale::text in ('zh-CN', 'zh-TW', 'en')
    and public.nonblank_text(question_text)
    and public.nonblank_text(rationale)
    and public.nonblank_text(intended_distinction)
    and public.nonblank_text(content_hash)
  );

-- No SELECT, UPDATE or DELETE policies exist; RLS denies those actions to anon.

create or replace view public.letterbox_type_suggestions_review as
select
  id,
  created_at,
  status,
  locale,
  proposed_code,
  proposed_name,
  summary,
  behaviour_example,
  distinction_from_existing,
  tagline,
  strength,
  failure_mode,
  discipline,
  extra_notes,
  current_type,
  app_version
from public.type_suggestions;

revoke all on public.letterbox_type_suggestions_review from anon, authenticated;

create or replace view public.letterbox_question_suggestions_review as
select
  id,
  created_at,
  status,
  locale,
  question_text,
  rationale,
  intended_distinction,
  suggested_dimension,
  laboratory_scenario,
  answer_format,
  scale_min,
  scale_max,
  reverse_scored,
  low_response_meaning,
  high_response_meaning,
  discipline,
  extra_notes,
  current_type,
  app_version
from public.question_suggestions;

revoke all on public.letterbox_question_suggestions_review from anon, authenticated;
