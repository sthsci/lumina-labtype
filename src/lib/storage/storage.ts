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
  cohortCache: `${PREFIX}cohortCache`,
  cohortMigrated: `${PREFIX}cohortMigrated`,
} as const;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export interface StorageWriteResult {
  ok: boolean;
  pruned: boolean;
  error?: string;
}

const WRITE_OK: StorageWriteResult = { ok: true, pruned: false };

export function isStorageQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
}

function createdTime(record: Record<string, unknown>): number {
  const raw = record.createdAt ?? record.created_at;
  const time =
    typeof raw === 'string' || typeof raw === 'number' ? new Date(raw).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : 0;
}

export function retainNewestHalf<T extends Record<string, unknown>>(records: T[]): T[] {
  return [...records].sort((a, b) => createdTime(b) - createdTime(a)).slice(0, Math.ceil(records.length / 2));
}

function pruneOldestHalf<T>(value: T): T | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item): item is Record<string, unknown> => item !== null && typeof item === 'object')) {
    return null;
  }
  return retainNewestHalf(value) as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function safeSet(key: string, value: string): StorageWriteResult {
  try {
    localStorage.setItem(key, value);
    return WRITE_OK;
  } catch {
    return { ok: false, pruned: false, error: 'storage-unavailable' };
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

export function writeJSON<T>(key: string, value: T): StorageWriteResult {
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
    return WRITE_OK;
  } catch (error) {
    if (!isStorageQuotaError(error)) {
      return { ok: false, pruned: false, error: errorMessage(error) };
    }
    const pruned = pruneOldestHalf(value);
    if (pruned === null) {
      return { ok: false, pruned: false, error: errorMessage(error) };
    }
    try {
      localStorage.setItem(key, JSON.stringify(pruned));
      return { ok: true, pruned: true };
    } catch (retryError) {
      return { ok: false, pruned: true, error: errorMessage(retryError) };
    }
  }
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
export const saveAnswers = (answers: Answers): StorageWriteResult => writeJSON(STORAGE_KEYS.answers, answers);

export const loadContext = (): TestContext | null =>
  readJSON<TestContext | null>(STORAGE_KEYS.context, null);
export const saveContext = (ctx: TestContext): StorageWriteResult => writeJSON(STORAGE_KEYS.context, ctx);

export const loadSettings = (): Settings => ({
  ...DEFAULT_SETTINGS,
  ...readJSON<Partial<Settings>>(STORAGE_KEYS.settings, {}),
});
export const saveSettings = (settings: Settings): StorageWriteResult => writeJSON(STORAGE_KEYS.settings, settings);

export const loadLanguage = (): string | null => safeGet(STORAGE_KEYS.language);
export const saveLanguage = (lang: string): StorageWriteResult => safeSet(STORAGE_KEYS.language, lang);

export const loadProgress = (): number => readJSON<number>(STORAGE_KEYS.progress, 0);
export const saveProgress = (index: number): StorageWriteResult => writeJSON(STORAGE_KEYS.progress, index);

/** Erase every LBTI local key. Returns the number of keys removed. */
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
