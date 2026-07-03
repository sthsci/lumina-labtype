import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAll,
  loadAnswers,
  loadSettings,
  saveAnswers,
  saveContext,
  saveLanguage,
  saveSettings,
  STORAGE_KEYS,
} from './storage';

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

  it('clearAll removes every lumina key and reports the count', () => {
    saveAnswers({ q01: 4 });
    saveContext({ field: 'computational', stage: 'phd' });
    saveLanguage('zh-CN');
    localStorage.setItem('unrelated', 'keep-me');
    const removed = clearAll();
    expect(removed).toBeGreaterThanOrEqual(3);
    expect(localStorage.getItem(STORAGE_KEYS.answers)).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep-me');
  });
});
