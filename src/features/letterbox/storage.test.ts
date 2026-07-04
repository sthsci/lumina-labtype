import { describe, expect, it } from 'vitest';
import { emptyQuestionDraft, emptyTypeDraft } from './types';
import {
  clearQuestionDraft,
  clearTypeDraft,
  isCoolingDown,
  loadQuestionDraft,
  loadTypeDraft,
  saveQuestionDraft,
  saveTypeDraft,
  secondsUntilReady,
  startCooldown,
} from './storage';

describe('letterbox draft storage', () => {
  it('stores exactly one replacement draft per form', () => {
    saveTypeDraft({ ...emptyTypeDraft, proposedName: 'A' });
    saveTypeDraft({ ...emptyTypeDraft, proposedName: 'B' });
    saveQuestionDraft({ ...emptyQuestionDraft, questionText: 'Q1' });
    saveQuestionDraft({ ...emptyQuestionDraft, questionText: 'Q2' });
    expect(loadTypeDraft().proposedName).toBe('B');
    expect(loadQuestionDraft().questionText).toBe('Q2');
  });

  it('clears only the relevant draft after success', () => {
    saveTypeDraft({ ...emptyTypeDraft, proposedName: 'A' });
    saveQuestionDraft({ ...emptyQuestionDraft, questionText: 'Q2' });
    clearTypeDraft();
    expect(loadTypeDraft()).toEqual(emptyTypeDraft);
    expect(loadQuestionDraft().questionText).toBe('Q2');
    clearQuestionDraft();
    expect(loadQuestionDraft()).toEqual(emptyQuestionDraft);
  });

  it('tracks a local cooldown after successful submission', () => {
    expect(isCoolingDown(1_000)).toBe(false);
    startCooldown(1_000);
    expect(isCoolingDown(1_500)).toBe(true);
    expect(secondsUntilReady(1_500)).toBeGreaterThan(0);
  });
});
