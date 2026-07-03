import type { ScoreResult } from '@/features/scoring/types';
import { readJSON, STORAGE_KEYS, type TestContext, writeJSON } from '@/lib/storage/storage';

export interface CohortRecord {
  id: string;
  createdAt: string;
  primary: string;
  secondary: string;
  matchStrength: number;
  classificationMargin: number;
  vector: number[];
  context: TestContext | null;
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `cell-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normaliseRecord(record: CohortRecord): CohortRecord | null {
  if (!Array.isArray(record.vector) || record.vector.length !== 15) return null;
  if (!record.id || !record.createdAt || !record.primary || !record.secondary) return null;
  return {
    ...record,
    matchStrength: Number.isFinite(record.matchStrength) ? record.matchStrength : 0,
    classificationMargin: Number.isFinite(record.classificationMargin) ? record.classificationMargin : 0,
    vector: record.vector.map((value) => Math.max(0, Math.min(100, Number(value) || 0))),
    context: record.context ?? null,
  };
}

export function createCohortRecord(result: ScoreResult, context: TestContext | null): CohortRecord {
  return {
    id: makeId(),
    createdAt: new Date().toISOString(),
    primary: result.primary,
    secondary: result.secondary,
    matchStrength: result.matchStrength,
    classificationMargin: result.classificationMargin,
    vector: result.scores.slice(),
    context,
  };
}

export function loadCohortRecords(): CohortRecord[] {
  return readJSON<CohortRecord[]>(STORAGE_KEYS.cohort, [])
    .map(normaliseRecord)
    .filter((record): record is CohortRecord => record !== null);
}

export function saveCohortRecords(records: CohortRecord[]): void {
  writeJSON(STORAGE_KEYS.cohort, records.map(normaliseRecord).filter((record): record is CohortRecord => record !== null));
}

export function addCohortRecord(record: CohortRecord): CohortRecord[] {
  const records = [...loadCohortRecords(), record];
  saveCohortRecords(records);
  return records;
}

export function removeCohortRecord(id: string): CohortRecord[] {
  const records = loadCohortRecords().filter((record) => record.id !== id);
  saveCohortRecords(records);
  return records;
}

export function clearCohortRecords(): void {
  saveCohortRecords([]);
}
