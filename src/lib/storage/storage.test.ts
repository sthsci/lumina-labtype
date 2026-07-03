import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearAll,
  loadAnswers,
  loadSettings,
  readJSON,
  saveAnswers,
  saveContext,
  saveLanguage,
  saveSettings,
  STORAGE_KEYS,
  writeJSON,
} from './storage';

interface CachedRecord {
  id: string;
  createdAt: string;
}

const quotaError = () => new DOMException('Storage quota exceeded', 'QuotaExceededError');

function spyOnSetItem(implementation: Storage['setItem']) {
  const target = Object.prototype.hasOwnProperty.call(localStorage, 'setItem')
    ? localStorage
    : (Object.getPrototypeOf(localStorage) as Storage);
  return vi.spyOn(target, 'setItem').mockImplementation(implementation);
}

describe('storage', () => {
  beforeEach(() => clearAll());

  it('round-trips answers', () => {
    saveAnswers({ q01: 5, q02: 3 });
    expect(loadAnswers()).toEqual({ q01: 5, q02: 3 });
  });

  it('returns an empty object when no answers stored', () => {
    expect(loadAnswers()).toEqual({});
  });

  it('merges partial settings with defaults', () => {
    saveSettings({ reducedMotion: true, reducedCompute: false, hideSynthetic: true });
    const s = loadSettings();
    expect(s.reducedMotion).toBe(true);
    expect(s.hideSynthetic).toBe(true);
  });

  it('clearAll removes every LBTI local key and reports the count', () => {
    saveAnswers({ q01: 4 });
    saveContext({ field: 'computational', stage: 'phd' });
    saveLanguage('zh-CN');
    localStorage.setItem('unrelated', 'keep-me');
    const removed = clearAll();
    expect(removed).toBeGreaterThanOrEqual(3);
    expect(localStorage.getItem(STORAGE_KEYS.answers)).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep-me');
  });

  it('reports a normal local save as successful', () => {
    const result = writeJSON(STORAGE_KEYS.cohortCache, [{ id: 'new', createdAt: '2026-01-02T00:00:00Z' }]);
    expect(result).toEqual({ ok: true, pruned: false });
    expect(readJSON<CachedRecord[]>(STORAGE_KEYS.cohortCache, [])).toHaveLength(1);
  });

  it('prunes the oldest half of a cached record collection after quota failure', () => {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    let calls = 0;
    const spy = spyOnSetItem((key, value) => {
      calls += 1;
      if (key === STORAGE_KEYS.cohortCache && calls === 1) throw quotaError();
      originalSetItem(key, value);
    });

    const result = writeJSON(STORAGE_KEYS.cohortCache, [
      { id: 'oldest', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'old', createdAt: '2026-01-02T00:00:00Z' },
      { id: 'new', createdAt: '2026-01-03T00:00:00Z' },
      { id: 'newest', createdAt: '2026-01-04T00:00:00Z' },
    ]);

    spy.mockRestore();
    expect(result).toEqual({ ok: true, pruned: true });
    expect(readJSON<CachedRecord[]>(STORAGE_KEYS.cohortCache, []).map((r) => r.id)).toEqual(['newest', 'new']);
  });

  it('returns a clear failed result when the quota retry also fails', () => {
    const spy = spyOnSetItem((key) => {
      if (key === STORAGE_KEYS.cohortCache) throw quotaError();
    });

    const result = writeJSON(STORAGE_KEYS.cohortCache, [
      { id: 'old', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'new', createdAt: '2026-01-02T00:00:00Z' },
    ]);

    spy.mockRestore();
    expect(result.ok).toBe(false);
    expect(result.pruned).toBe(true);
    expect(result.error).toContain('Storage quota exceeded');
  });

  it('does not prune unrelated localStorage keys when one cached collection is full', () => {
    saveAnswers({ q01: 5 });
    localStorage.setItem('unrelated', 'keep-me');
    const originalSetItem = localStorage.setItem.bind(localStorage);
    let failedOnce = false;
    const spy = spyOnSetItem((key, value) => {
      if (key === STORAGE_KEYS.cohort && !failedOnce) {
        failedOnce = true;
        throw quotaError();
      }
      originalSetItem(key, value);
    });

    writeJSON(STORAGE_KEYS.cohort, [
      { id: 'old', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'new', createdAt: '2026-01-02T00:00:00Z' },
    ]);

    spy.mockRestore();
    expect(loadAnswers()).toEqual({ q01: 5 });
    expect(localStorage.getItem('unrelated')).toBe('keep-me');
  });
});
