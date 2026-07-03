import { COHORT_TABLE, isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ScoreResult } from '@/features/scoring/types';
import type { TestContext } from '@/lib/storage/storage';
import type { CohortRecord } from './cohortStorage';

/** Row shape of public.cohort_records (snake_case, as stored in Supabase). */
export interface CohortRow {
  id: string;
  created_at: string;
  primary_code: string;
  secondary_code: string;
  match_strength: number;
  classification_margin: number;
  vector: number[];
  context: TestContext | null;
}

/** Payload we insert (id + created_at are assigned by the database defaults). */
export interface CohortInsert {
  primary_code: string;
  secondary_code: string;
  match_strength: number;
  classification_margin: number;
  vector: number[];
  context: TestContext | null;
}

export { isSupabaseConfigured };

const clampVector = (vector: number[]): number[] =>
  vector.map((value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0))));

/** Database row -> front-end camelCase record. Returns null if malformed. */
export function mapRowToRecord(row: CohortRow): CohortRecord | null {
  if (!row || !Array.isArray(row.vector) || row.vector.length !== 15) return null;
  if (!row.id || !row.primary_code || !row.secondary_code) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    primary: row.primary_code,
    secondary: row.secondary_code,
    matchStrength: Number.isFinite(row.match_strength) ? row.match_strength : 0,
    classificationMargin: Number.isFinite(row.classification_margin) ? row.classification_margin : 0,
    vector: clampVector(row.vector),
    context: row.context ?? null,
  };
}

/** ScoreResult (+ optional context) -> insert payload. Only derived, non-identifying data. */
export function mapResultToInsert(result: ScoreResult, context: TestContext | null): CohortInsert {
  return {
    primary_code: result.primary,
    secondary_code: result.secondary,
    match_strength: Math.round(result.matchStrength),
    classification_margin: Number(result.classificationMargin.toFixed(4)),
    vector: clampVector(result.scores),
    context: context ? { field: context.field, stage: context.stage } : null,
  };
}

/** A local record -> insert payload (used by the one-time migration). */
export function mapRecordToInsert(record: CohortRecord): CohortInsert {
  return {
    primary_code: record.primary,
    secondary_code: record.secondary,
    match_strength: Math.round(record.matchStrength),
    classification_margin: Number(record.classificationMargin.toFixed(4)),
    vector: clampVector(record.vector),
    context: record.context ? { field: record.context.field, stage: record.context.stage } : null,
  };
}

export class SupabaseUnconfiguredError extends Error {
  constructor() {
    super('shared-db-not-configured');
    this.name = 'SupabaseUnconfiguredError';
  }
}

/** Fetch the public cohort (most recent first, capped). Throws real errors. */
export async function fetchCohortRecords(limit = 500): Promise<CohortRecord[]> {
  if (!supabase) throw new SupabaseUnconfiguredError();
  const { data, error } = await supabase
    .from(COHORT_TABLE)
    .select('id, created_at, primary_code, secondary_code, match_strength, classification_margin, vector, context')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as CohortRow[])
    .map(mapRowToRecord)
    .filter((record): record is CohortRecord => record !== null);
}

/** Insert one derived record and return the stored row mapped back. */
export async function insertCohortRecord(payload: CohortInsert): Promise<CohortRecord> {
  if (!supabase) throw new SupabaseUnconfiguredError();
  const { data, error } = await supabase.from(COHORT_TABLE).insert(payload).select().single();
  if (error) throw new Error(error.message);
  const mapped = mapRowToRecord(data as CohortRow);
  if (!mapped) throw new Error('invalid-row-returned');
  return mapped;
}

/** Bulk insert for the one-time migration; returns the inserted, mapped rows. */
export async function insertCohortRecords(payloads: CohortInsert[]): Promise<CohortRecord[]> {
  if (!supabase) throw new SupabaseUnconfiguredError();
  if (payloads.length === 0) return [];
  const { data, error } = await supabase.from(COHORT_TABLE).insert(payloads).select();
  if (error) throw new Error(error.message);
  return (data as CohortRow[])
    .map(mapRowToRecord)
    .filter((record): record is CohortRecord => record !== null);
}
