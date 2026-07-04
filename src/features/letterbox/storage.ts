import { readJSON, writeJSON } from '@/lib/storage/storage';
import { emptyQuestionDraft, emptyTypeDraft, type QuestionSuggestionDraft, type TypeSuggestionDraft } from './types';

export const LETTERBOX_TYPE_DRAFT_KEY = 'lumina:letterbox:typeDraft';
export const LETTERBOX_QUESTION_DRAFT_KEY = 'lumina:letterbox:questionDraft';
export const LETTERBOX_COOLDOWN_KEY = 'lumina:letterbox:cooldownUntil';

export const LETTERBOX_COOLDOWN_MS = 60_000;

export function loadTypeDraft(): TypeSuggestionDraft {
  return { ...emptyTypeDraft, ...readJSON<Partial<TypeSuggestionDraft>>(LETTERBOX_TYPE_DRAFT_KEY, {}) };
}

export function saveTypeDraft(draft: TypeSuggestionDraft) {
  return writeJSON(LETTERBOX_TYPE_DRAFT_KEY, draft);
}

export function clearTypeDraft() {
  return writeJSON(LETTERBOX_TYPE_DRAFT_KEY, emptyTypeDraft);
}

export function loadQuestionDraft(): QuestionSuggestionDraft {
  return { ...emptyQuestionDraft, ...readJSON<Partial<QuestionSuggestionDraft>>(LETTERBOX_QUESTION_DRAFT_KEY, {}) };
}

export function saveQuestionDraft(draft: QuestionSuggestionDraft) {
  return writeJSON(LETTERBOX_QUESTION_DRAFT_KEY, draft);
}

export function clearQuestionDraft() {
  return writeJSON(LETTERBOX_QUESTION_DRAFT_KEY, emptyQuestionDraft);
}

export function getCooldownUntil(): number {
  return readJSON<number>(LETTERBOX_COOLDOWN_KEY, 0);
}

export function isCoolingDown(now = Date.now()): boolean {
  return getCooldownUntil() > now;
}

export function secondsUntilReady(now = Date.now()): number {
  return Math.max(0, Math.ceil((getCooldownUntil() - now) / 1000));
}

export function startCooldown(now = Date.now()) {
  return writeJSON(LETTERBOX_COOLDOWN_KEY, now + LETTERBOX_COOLDOWN_MS);
}
