import { describe, expect, it } from 'vitest';
import { scoreAnswers } from '@/features/scoring/engine';
import { mapRecordToInsert, mapResultToInsert, mapRowToRecord, type CohortRow } from './cohortDb';
import { createCohortRecord } from './cohortStorage';

const answers = Object.fromEntries(Array.from({ length: 36 }, (_, i) => [`q${String(i + 1).padStart(2, '0')}`, 4]));

function baseRow(overrides: Partial<CohortRow> = {}): CohortRow {
  return {
    id: 'row-1',
    created_at: '2026-01-01T00:00:00Z',
    primary_code: 'GIT',
    secondary_code: 'REPRO',
    match_strength: 42,
    classification_margin: 0.31,
    vector: Array.from({ length: 15 }, () => 55),
    context: { field: 'computational', stage: 'phd' },
    ...overrides,
  };
}

describe('cohortDb mapping', () => {
  it('maps a database row (snake_case) to a front-end record (camelCase)', () => {
    const record = mapRowToRecord(baseRow());
    expect(record).not.toBeNull();
    expect(record).toMatchObject({
      id: 'row-1',
      primary: 'GIT',
      secondary: 'REPRO',
      matchStrength: 42,
      classificationMargin: 0.31,
    });
    expect(record?.vector).toHaveLength(15);
    expect(record?.context?.field).toBe('computational');
  });

  it('rejects rows with a wrong-length vector', () => {
    expect(mapRowToRecord(baseRow({ vector: [1, 2, 3] }))).toBeNull();
  });

  it('rejects rows missing required codes', () => {
    expect(mapRowToRecord(baseRow({ primary_code: '' }))).toBeNull();
  });

  it('clamps out-of-range vector values on the way in', () => {
    const record = mapRowToRecord(baseRow({ vector: [-10, 130, ...Array(13).fill(50)] }));
    expect(record?.vector[0]).toBe(0);
    expect(record?.vector[1]).toBe(100);
  });

  it('maps a ScoreResult to an insert payload with only derived, non-identifying fields', () => {
    const result = scoreAnswers(answers);
    const payload = mapResultToInsert(result, { field: 'computational', stage: 'phd' });
    expect(payload.primary_code).toBe(result.primary);
    expect(payload.secondary_code).toBe(result.secondary);
    expect(payload.vector).toHaveLength(15);
    expect(payload.context).toEqual({ field: 'computational', stage: 'phd' });
    // never leaks raw answers
    expect(payload).not.toHaveProperty('answers');
    expect(Object.keys(payload).sort()).toEqual(
      ['classification_margin', 'context', 'match_strength', 'primary_code', 'secondary_code', 'vector'].sort(),
    );
  });

  it('maps a legacy local record to the same insert shape', () => {
    const result = scoreAnswers(answers);
    const record = createCohortRecord(result, null);
    const payload = mapRecordToInsert(record);
    expect(payload.primary_code).toBe(result.primary);
    expect(payload.context).toBeNull();
    expect(payload.vector).toHaveLength(15);
  });
});
