import { beforeEach, describe, expect, it } from 'vitest';
import { scoreAnswers } from '@/features/scoring/engine';
import { clearAll, STORAGE_KEYS } from '@/lib/storage/storage';
import {
  addCohortRecord,
  clearCohortRecords,
  createCohortRecord,
  loadCohortRecords,
  removeCohortRecord,
  saveCohortRecords,
} from './cohortStorage';

const answers = Object.fromEntries(Array.from({ length: 36 }, (_, i) => [`q${String(i + 1).padStart(2, '0')}`, 4]));

describe('cohort storage', () => {
  beforeEach(() => clearAll());

  it('stores only derived result vectors and labels', () => {
    const result = scoreAnswers(answers);
    const record = createCohortRecord(result, { field: 'computational', stage: 'phd' });
    addCohortRecord(record);

    const [stored] = loadCohortRecords();
    expect(stored.primary).toBe(result.primary);
    expect(stored.vector).toEqual(result.scores);
    expect(stored).not.toHaveProperty('answers');
    expect(stored.context?.field).toBe('computational');
  });

  it('removes individual records and clears the local cohort database', () => {
    const result = scoreAnswers(answers);
    const first = createCohortRecord(result, null);
    const second = createCohortRecord(result, null);
    saveCohortRecords([first, second]);

    expect(removeCohortRecord(first.id).map((r) => r.id)).toEqual([second.id]);
    clearCohortRecords();
    expect(loadCohortRecords()).toEqual([]);
  });

  it('ignores malformed records from storage', () => {
    localStorage.setItem(
      STORAGE_KEYS.cohort,
      JSON.stringify([{ id: 'bad', createdAt: 'now', primary: 'X', secondary: 'Y', vector: [1, 2] }]),
    );

    expect(loadCohortRecords()).toEqual([]);
  });
});
