import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync('supabase/migrations/0002_letterbox_suggestions.sql', 'utf8');

describe('letterbox migration', () => {
  it('creates both focused suggestion tables', () => {
    expect(sql).toContain('create table if not exists public.type_suggestions');
    expect(sql).toContain('create table if not exists public.question_suggestions');
    expect(sql).toContain('type_suggestions_content_hash_uidx');
    expect(sql).toContain('question_suggestions_content_hash_uidx');
  });

  it('enables RLS and grants anon only insert policies', () => {
    expect(sql).toContain('alter table public.type_suggestions enable row level security');
    expect(sql).toContain('alter table public.question_suggestions enable row level security');
    expect(sql).toContain('for insert');
    expect(sql).not.toMatch(/for select\s+to anon/i);
    expect(sql).not.toMatch(/for update\s+to anon/i);
    expect(sql).not.toMatch(/for delete\s+to anon/i);
  });

  it('keeps moderation status private to the frontend', () => {
    expect(sql).toContain("status public.letterbox_status not null default 'new'");
    expect(sql).toContain('No SELECT, UPDATE or DELETE policies exist');
  });
});
