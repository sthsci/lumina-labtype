/** A completed or partial answer set: question id -> Likert value (1..5). */
export type Answers = Record<string, number>;

export interface DimensionScore {
  id: string;
  group: string;
  /** 0..100, where 0 is the "low" endpoint and 100 the "high" endpoint. */
  score: number;
}

export interface GroupScore {
  id: string;
  score: number;
}

export interface ThemeScore {
  id: string;
  /** 0..100 mean absolute activation of the theme's informative questions. */
  score: number;
  /** Number of answered questions tagged with this theme. */
  informativeQuestions: number;
  /** 0..1 how concentrated (vs. neutral) the responses are — profile specificity. */
  specificity: number;
}

export interface ArchetypeDistance {
  code: string;
  hidden: boolean;
  /** Weighted Euclidean distance — the actual classifier metric. */
  weighted: number;
  /** Unweighted Euclidean distance (explanation only). */
  euclidean: number;
  cosine: number;
  pearson: number;
  spearman: number;
  /** Softmax match strength among visible archetypes, 0..1 (display only). */
  similarity: number;
}

export interface QuestionContribution {
  id: string;
  /** Signed contribution toward the winning archetype (positive = supports). */
  contribution: number;
  /** |contribution|, the y-axis magnitude in the contribution plot. */
  magnitude: number;
  answer: number;
}

export interface HiddenStatus {
  triggered: boolean;
  ruleId: string | null;
  archetype: string | null;
}

export interface ScoreResult {
  answers: Answers;
  answeredCount: number;
  totalQuestions: number;
  complete: boolean;
  dimensionOrder: string[];
  /** Score vector aligned to dimensionOrder, each 0..100. */
  scores: number[];
  dimensionScores: DimensionScore[];
  groupScores: GroupScore[];
  themeScores: ThemeScore[];
  /** All archetypes, sorted by weighted Euclidean distance ascending. */
  distances: ArchetypeDistance[];
  /** Winning archetype code (may be a hidden archetype). */
  primary: string;
  /** Runner-up visible archetype code. */
  secondary: string;
  /** Five nearest visible archetype codes. */
  topFive: string[];
  /** Display match strength 0..100 (NOT a probability). */
  matchStrength: number;
  /** Classification margin in 0..1 (softmax gap between the two nearest). */
  classificationMargin: number;
  /** Normalised profile entropy in 0..1 across the nearest archetypes. */
  entropy: number;
  hidden: HiddenStatus;
  contributions: QuestionContribution[];
}
