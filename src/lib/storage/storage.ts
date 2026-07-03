/**
 * Namespaced localStorage wrapper.
 *
 * The ONLY things ever persisted are: the user's Likert answers (numbers), UI
 * settings, language choice, and optional anonymised cohort result vectors. No
 * names, institutions, emails, free text or transmitted data. Everything can be
 * erased with clearAll().
 */
import type { Answers } from '@/features/scoring/types';

const PREFIX = 'lumina:';
export const STORAGE_KEYS = {
  answers: `${PREFIX}answers`,
  context: `${PREFIX}context`,
  settings: `${PREFIX}settings`,
  language: `${PREFIX}language`,
  progress: `${PREFIX}progress`,
  cohort: `${PREFIX}cohort`,
} as const;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable / quota — the app still works without persistence */
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = safeGet(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  safeSet(key, JSON.stringify(value));
}

export interface TestContext {
  field: string;
  stage: string;
}

export interface Settings {
  reducedMotion: boolean | null; // null = follow system preference
  reducedCompute: boolean;
  hideSynthetic: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  reducedMotion: null,
  reducedCompute: false,
  hideSynthetic: false,
};

export const loadAnswers = (): Answers => readJSON<Answers>(STORAGE_KEYS.answers, {});
export const saveAnswers = (answers: Answers): void => writeJSON(STORAGE_KEYS.answers, answers);

export const loadContext = (): TestContext | null =>
  readJSON<TestContext | null>(STORAGE_KEYS.context, null);
export const saveContext = (ctx: TestContext): void => writeJSON(STORAGE_KEYS.context, ctx);

export const loadSettings = (): Settings => ({
  ...DEFAULT_SETTINGS,
  ...readJSON<Partial<Settings>>(STORAGE_KEYS.settings, {}),
});
export const saveSettings = (settings: Settings): void => writeJSON(STORAGE_KEYS.settings, settings);

export const loadLanguage = (): string | null => safeGet(STORAGE_KEYS.language);
export const saveLanguage = (lang: string): void => safeSet(STORAGE_KEYS.language, lang);

export const loadProgress = (): number => readJSON<number>(STORAGE_KEYS.progress, 0);
export const saveProgress = (index: number): void => writeJSON(STORAGE_KEYS.progress, index);

/** Erase every LUMINA key. Returns the number of keys removed. */
export function clearAll(): number {
  let removed = 0;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) toRemove.push(key);
    }
    for (const key of toRemove) {
      localStorage.removeItem(key);
      removed += 1;
    }
  } catch {
    /* ignore */
  }
  return removed;
}
