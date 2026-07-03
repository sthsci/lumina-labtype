import { useMemo } from 'react';
import { useAppStore } from '@/app/store';
import { scoreAnswers } from '@/features/scoring/engine';
import type { ScoreResult } from '@/features/scoring/types';

/** Memoised deterministic score for the current answers. Null if none answered. */
export function useResult(): ScoreResult | null {
  const answers = useAppStore((s) => s.answers);
  return useMemo(() => {
    if (Object.keys(answers).length === 0) return null;
    return scoreAnswers(answers);
  }, [answers]);
}
