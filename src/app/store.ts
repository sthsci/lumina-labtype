import { create } from 'zustand';
import type { Answers, ScoreResult } from '@/features/scoring/types';
import { scoreAnswers } from '@/features/scoring/engine';
import {
  clearAll,
  DEFAULT_SETTINGS,
  loadAnswers,
  loadContext,
  loadProgress,
  loadSettings,
  saveAnswers,
  saveContext,
  saveProgress,
  saveSettings,
  type Settings,
  type TestContext,
} from '@/lib/storage/storage';

interface AppState {
  answers: Answers;
  context: TestContext | null;
  settings: Settings;
  /** Index of the current question in the flow. */
  cursor: number;

  setAnswer: (questionId: string, value: number) => void;
  setContext: (context: TestContext | null) => void;
  setCursor: (index: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetTest: () => void;
  clearAllData: () => void;

  /** Recompute the deterministic score for the current answers. */
  computeResult: () => ScoreResult;
  answeredCount: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  answers: loadAnswers(),
  context: loadContext(),
  settings: loadSettings(),
  cursor: loadProgress(),

  setAnswer: (questionId, value) =>
    set((state) => {
      const answers = { ...state.answers, [questionId]: value };
      saveAnswers(answers);
      return { answers };
    }),

  setContext: (context) =>
    set(() => {
      if (context) saveContext(context);
      return { context };
    }),

  setCursor: (index) =>
    set(() => {
      saveProgress(index);
      return { cursor: index };
    }),

  updateSettings: (patch) =>
    set((state) => {
      const settings = { ...state.settings, ...patch };
      saveSettings(settings);
      return { settings };
    }),

  resetTest: () =>
    set(() => {
      saveAnswers({});
      saveProgress(0);
      return { answers: {}, cursor: 0 };
    }),

  clearAllData: () => {
    clearAll();
    set({ answers: {}, context: null, settings: { ...DEFAULT_SETTINGS }, cursor: 0 });
  },

  computeResult: () => scoreAnswers(get().answers),
  answeredCount: () => Object.keys(get().answers).length,
}));
