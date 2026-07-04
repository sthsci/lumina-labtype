import type { LanguageCode } from '@/i18n';

export type LetterboxMode = 'type' | 'question';

export type AnswerFormat =
  | ''
  | 'five_point_agreement'
  | 'seven_point_agreement'
  | 'frequency'
  | 'forced_choice'
  | 'situational_choice'
  | 'free_text_research_idea';

export const ANSWER_FORMATS: Exclude<AnswerFormat, ''>[] = [
  'five_point_agreement',
  'seven_point_agreement',
  'frequency',
  'forced_choice',
  'situational_choice',
  'free_text_research_idea',
];

export interface TypeSuggestionDraft {
  proposedName: string;
  proposedCode: string;
  summary: string;
  behaviourExample: string;
  distinctionFromExisting: string;
  tagline: string;
  strength: string;
  failureMode: string;
  discipline: string;
  extraNotes: string;
  attachType: boolean;
  honeypot: string;
}

export interface QuestionSuggestionDraft {
  questionText: string;
  rationale: string;
  intendedDistinction: string;
  suggestedDimension: string;
  laboratoryScenario: string;
  answerFormat: AnswerFormat;
  reverseScored: boolean;
  lowResponseMeaning: string;
  highResponseMeaning: string;
  discipline: string;
  extraNotes: string;
  attachType: boolean;
  honeypot: string;
}

export interface TypeSuggestionInsert {
  locale: LanguageCode;
  proposed_code: string | null;
  proposed_name: string;
  summary: string;
  behaviour_example: string;
  distinction_from_existing: string;
  tagline: string | null;
  strength: string | null;
  failure_mode: string | null;
  discipline: string | null;
  extra_notes: string | null;
  current_type: string | null;
  content_hash: string;
  app_version: string;
}

export interface QuestionSuggestionInsert {
  locale: LanguageCode;
  question_text: string;
  rationale: string;
  intended_distinction: string;
  suggested_dimension: string | null;
  laboratory_scenario: string | null;
  answer_format: Exclude<AnswerFormat, ''> | null;
  scale_min: number | null;
  scale_max: number | null;
  reverse_scored: boolean | null;
  low_response_meaning: string | null;
  high_response_meaning: string | null;
  discipline: string | null;
  extra_notes: string | null;
  current_type: string | null;
  content_hash: string;
  app_version: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  errors: Record<string, string>;
  value?: T;
}

export const emptyTypeDraft: TypeSuggestionDraft = {
  proposedName: '',
  proposedCode: '',
  summary: '',
  behaviourExample: '',
  distinctionFromExisting: '',
  tagline: '',
  strength: '',
  failureMode: '',
  discipline: '',
  extraNotes: '',
  attachType: false,
  honeypot: '',
};

export const emptyQuestionDraft: QuestionSuggestionDraft = {
  questionText: '',
  rationale: '',
  intendedDistinction: '',
  suggestedDimension: '',
  laboratoryScenario: '',
  answerFormat: '',
  reverseScored: false,
  lowResponseMeaning: '',
  highResponseMeaning: '',
  discipline: '',
  extraNotes: '',
  attachType: false,
  honeypot: '',
};
