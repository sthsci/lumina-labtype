import {
  isSupabaseConfigured,
  QUESTION_SUGGESTIONS_TABLE,
  supabase,
  TYPE_SUGGESTIONS_TABLE,
} from '@/lib/supabase';
import type { QuestionSuggestionInsert, TypeSuggestionInsert } from './types';

export { isSupabaseConfigured };

export class LetterboxUnconfiguredError extends Error {
  constructor() {
    super('letterbox-db-not-configured');
    this.name = 'LetterboxUnconfiguredError';
  }
}

export class DuplicateSuggestionError extends Error {
  constructor() {
    super('duplicate-suggestion');
    this.name = 'DuplicateSuggestionError';
  }
}

function isDuplicateError(error: { code?: string; message?: string }): boolean {
  return error.code === '23505' || /duplicate|unique/i.test(error.message ?? '');
}

function assertSupabase() {
  if (!supabase) throw new LetterboxUnconfiguredError();
  return supabase;
}

export async function insertTypeSuggestion(payload: TypeSuggestionInsert): Promise<{ id: string }> {
  const client = assertSupabase();
  const { data, error } = await client.from(TYPE_SUGGESTIONS_TABLE).insert(payload).select('id').single();
  if (error) {
    if (isDuplicateError(error)) throw new DuplicateSuggestionError();
    throw new Error(error.message);
  }
  return { id: String((data as { id: string }).id) };
}

export async function insertQuestionSuggestion(payload: QuestionSuggestionInsert): Promise<{ id: string }> {
  const client = assertSupabase();
  const { data, error } = await client.from(QUESTION_SUGGESTIONS_TABLE).insert(payload).select('id').single();
  if (error) {
    if (isDuplicateError(error)) throw new DuplicateSuggestionError();
    throw new Error(error.message);
  }
  return { id: String((data as { id: string }).id) };
}
