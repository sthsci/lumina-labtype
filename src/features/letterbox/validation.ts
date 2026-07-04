import type { LanguageCode } from '@/i18n';
import type {
  QuestionSuggestionDraft,
  QuestionSuggestionInsert,
  TypeSuggestionDraft,
  TypeSuggestionInsert,
  ValidationResult,
} from './types';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const MAX_PAYLOAD_BYTES = 12_000;

type ErrorCode =
  | 'required'
  | 'tooShort'
  | 'tooLong'
  | 'code'
  | 'html'
  | 'punctuation'
  | 'honeypot'
  | 'payload';

export type LetterboxErrors = Record<string, ErrorCode>;

const TYPE_LIMITS = {
  proposedName: [2, 60],
  proposedCode: [2, 12],
  summary: [10, 200],
  behaviourExample: [20, 1000],
  distinctionFromExisting: [20, 1000],
  optional: [0, 1000],
} as const;

const QUESTION_LIMITS = {
  questionText: [10, 500],
  rationale: [20, 1000],
  intendedDistinction: [20, 1000],
  optional: [0, 1000],
} as const;

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeOptional(value: string): string | null {
  const out = normalizeText(value);
  return out.length > 0 ? out : null;
}

function hasHtml(value: string): boolean {
  return /[<>]/.test(value);
}

function onlyPunctuation(value: string): boolean {
  const text = normalizeText(value);
  return text.length > 0 && !/[\p{L}\p{N}]/u.test(text);
}

function validateText(
  errors: LetterboxErrors,
  key: string,
  value: string,
  min: number,
  max: number,
  required: boolean,
) {
  const text = normalizeText(value);
  if (hasHtml(value)) {
    errors[key] = 'html';
    return;
  }
  if (!text) {
    if (required) errors[key] = 'required';
    return;
  }
  if (onlyPunctuation(text)) {
    errors[key] = 'punctuation';
    return;
  }
  if (text.length < min) errors[key] = 'tooShort';
  if (text.length > max) errors[key] = 'tooLong';
}

function validateCode(errors: LetterboxErrors, value: string) {
  const code = normalizeText(value).toUpperCase();
  if (!code) return;
  if (hasHtml(value)) {
    errors.proposedCode = 'html';
    return;
  }
  if (code.length < TYPE_LIMITS.proposedCode[0] || code.length > TYPE_LIMITS.proposedCode[1]) {
    errors.proposedCode = code.length < TYPE_LIMITS.proposedCode[0] ? 'tooShort' : 'tooLong';
    return;
  }
  if (!/^[A-Z0-9]+$/.test(code)) errors.proposedCode = 'code';
}

export function contentHash(value: unknown): string {
  const normalized = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function assertPayloadSize(errors: LetterboxErrors, key: string, payload: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (bytes > MAX_PAYLOAD_BYTES) errors[key] = 'payload';
}

export function mapAnswerScale(format: string): { min: number | null; max: number | null } {
  if (format === 'five_point_agreement') return { min: 1, max: 5 };
  if (format === 'seven_point_agreement') return { min: 1, max: 7 };
  return { min: null, max: null };
}

export function validateTypeSuggestion(
  draft: TypeSuggestionDraft,
  locale: LanguageCode,
  currentType: string | null,
): ValidationResult<TypeSuggestionInsert> {
  const errors: LetterboxErrors = {};
  if (normalizeText(draft.honeypot)) errors.honeypot = 'honeypot';
  validateText(errors, 'proposedName', draft.proposedName, TYPE_LIMITS.proposedName[0], TYPE_LIMITS.proposedName[1], true);
  validateCode(errors, draft.proposedCode);
  validateText(errors, 'summary', draft.summary, TYPE_LIMITS.summary[0], TYPE_LIMITS.summary[1], true);
  validateText(errors, 'behaviourExample', draft.behaviourExample, TYPE_LIMITS.behaviourExample[0], TYPE_LIMITS.behaviourExample[1], true);
  validateText(errors, 'distinctionFromExisting', draft.distinctionFromExisting, TYPE_LIMITS.distinctionFromExisting[0], TYPE_LIMITS.distinctionFromExisting[1], true);
  for (const key of ['tagline', 'strength', 'failureMode', 'discipline', 'extraNotes'] as const) {
    validateText(errors, key, draft[key], TYPE_LIMITS.optional[0], TYPE_LIMITS.optional[1], false);
  }

  const basis = {
    proposed_code: normalizeOptional(draft.proposedCode)?.toUpperCase() ?? null,
    proposed_name: normalizeText(draft.proposedName),
    summary: normalizeText(draft.summary),
    behaviour_example: normalizeText(draft.behaviourExample),
    distinction_from_existing: normalizeText(draft.distinctionFromExisting),
    tagline: normalizeOptional(draft.tagline),
    strength: normalizeOptional(draft.strength),
    failure_mode: normalizeOptional(draft.failureMode),
    discipline: normalizeOptional(draft.discipline),
    extra_notes: normalizeOptional(draft.extraNotes),
  };
  assertPayloadSize(errors, 'form', basis);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: {},
    value: {
      locale,
      ...basis,
      current_type: draft.attachType ? currentType : null,
      content_hash: contentHash({ kind: 'type', ...basis }),
      app_version: APP_VERSION,
    },
  };
}

export function validateQuestionSuggestion(
  draft: QuestionSuggestionDraft,
  locale: LanguageCode,
  currentType: string | null,
): ValidationResult<QuestionSuggestionInsert> {
  const errors: LetterboxErrors = {};
  if (normalizeText(draft.honeypot)) errors.honeypot = 'honeypot';
  validateText(errors, 'questionText', draft.questionText, QUESTION_LIMITS.questionText[0], QUESTION_LIMITS.questionText[1], true);
  validateText(errors, 'rationale', draft.rationale, QUESTION_LIMITS.rationale[0], QUESTION_LIMITS.rationale[1], true);
  validateText(errors, 'intendedDistinction', draft.intendedDistinction, QUESTION_LIMITS.intendedDistinction[0], QUESTION_LIMITS.intendedDistinction[1], true);
  for (const key of ['suggestedDimension', 'laboratoryScenario', 'lowResponseMeaning', 'highResponseMeaning', 'discipline', 'extraNotes'] as const) {
    validateText(errors, key, draft[key], QUESTION_LIMITS.optional[0], QUESTION_LIMITS.optional[1], false);
  }

  const { min, max } = mapAnswerScale(draft.answerFormat);
  const basis = {
    question_text: normalizeText(draft.questionText),
    rationale: normalizeText(draft.rationale),
    intended_distinction: normalizeText(draft.intendedDistinction),
    suggested_dimension: normalizeOptional(draft.suggestedDimension),
    laboratory_scenario: normalizeOptional(draft.laboratoryScenario),
    answer_format: draft.answerFormat || null,
    scale_min: min,
    scale_max: max,
    reverse_scored: draft.reverseScored ? true : null,
    low_response_meaning: normalizeOptional(draft.lowResponseMeaning),
    high_response_meaning: normalizeOptional(draft.highResponseMeaning),
    discipline: normalizeOptional(draft.discipline),
    extra_notes: normalizeOptional(draft.extraNotes),
  };
  assertPayloadSize(errors, 'form', basis);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: {},
    value: {
      locale,
      ...basis,
      current_type: draft.attachType ? currentType : null,
      content_hash: contentHash({ kind: 'question', ...basis }),
      app_version: APP_VERSION,
    },
  };
}
