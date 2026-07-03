/**
 * Deterministic scoring engine.
 *
 * Given a set of Likert answers (1..5), this computes:
 *   1. fifteen dimension scores (0..100),
 *   2. weighted-Euclidean nearest-prototype classification,
 *   3. explanatory similarity metrics (cosine, Pearson, Spearman),
 *   4. hidden-archetype rule evaluation,
 *   5. per-question contributions toward the winning archetype,
 *   6. match strength, classification margin and normalised entropy.
 *
 * The same answers ALWAYS produce the same result — there is no randomness in
 * this file. (Bootstrap stability, which is seeded-random, lives in bootstrap.ts.)
 */
import {
  centreAnswer,
  clamp,
  cosineSimilarity,
  normalisedEntropy,
  pearson,
  softmax,
  spearman,
  weightedEuclidean,
  euclidean,
} from '@/lib/mathematics';
import {
  archetypes,
  dimensionGroups,
  dimensionImportance,
  dimensionOrder,
  dimensions,
  hiddenRules,
  questions,
  scoringConfig,
  themes,
  visibleArchetypes,
} from '@/data/content';
import type { HiddenCondition } from '@/data/schemas';
import type {
  Answers,
  ArchetypeDistance,
  DimensionScore,
  HiddenStatus,
  QuestionContribution,
  ScoreResult,
  ThemeScore,
} from './types';

const NEUTRAL = 50;

/**
 * Dimension score:  s_d = 50 + 50 * (Σ w_qd z_q) / (Σ |w_qd|), clamped to 0..100.
 * Only answered questions contribute. A dimension with no answered contributing
 * question defaults to the neutral midpoint (50).
 */
export function computeDimensionScores(answers: Answers): number[] {
  const numerators = new Array(dimensionOrder.length).fill(0);
  const denominators = new Array(dimensionOrder.length).fill(0);

  for (const q of questions) {
    const raw = answers[q.id];
    if (raw === undefined) continue;
    const z = centreAnswer(raw);
    for (const [dim, weight] of Object.entries(q.weights)) {
      const idx = dimensionOrder.indexOf(dim);
      if (idx < 0) continue;
      numerators[idx] += weight * z;
      denominators[idx] += Math.abs(weight);
    }
  }

  return dimensionOrder.map((_, idx) => {
    if (denominators[idx] === 0) return NEUTRAL;
    const value = NEUTRAL + NEUTRAL * (numerators[idx] / denominators[idx]);
    return clamp(value, 0, 100);
  });
}

/** Group score = mean of that group's dimension scores. */
function computeGroupScores(scores: number[]) {
  return dimensionGroups.map((g) => {
    const values = g.dimensions.map((id) => scores[dimensionOrder.indexOf(id)]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return { id: g.id, score: mean };
  });
}

/**
 * Behavioural theme "enrichment": for each theme, the mean absolute deviation
 * from neutral across its answered questions, scaled to 0..100. This is a
 * relative concentration of weighted responses — NOT a statistical enrichment
 * test and carries no p-value.
 */
function computeThemeScores(answers: Answers): ThemeScore[] {
  return themes.map((theme) => {
    const themeQuestions = questions.filter((q) => q.themes.includes(theme));
    const answered = themeQuestions.filter((q) => answers[q.id] !== undefined);
    if (answered.length === 0) {
      return { id: theme, score: NEUTRAL, informativeQuestions: 0, specificity: 0 };
    }
    // signed activation: how strongly (and consistently) the theme is expressed
    let signedSum = 0;
    let absSum = 0;
    for (const q of answered) {
      const z = centreAnswer(answers[q.id]); // -1..1
      signedSum += z;
      absSum += Math.abs(z);
    }
    const meanAbs = absSum / answered.length; // 0..1 intensity
    const score = clamp(NEUTRAL + NEUTRAL * (signedSum / answered.length), 0, 100);
    return {
      id: theme,
      score,
      informativeQuestions: answered.length,
      specificity: meanAbs,
    };
  });
}

/** Compute all four metrics from the user vector to a prototype vector. */
function metricsFor(user: number[], vector: number[]) {
  return {
    weighted: weightedEuclidean(user, vector, dimensionImportance),
    euclidean: euclidean(user, vector),
    cosine: cosineSimilarity(user, vector),
    pearson: pearson(user, vector),
    spearman: spearman(user, vector),
  };
}

/**
 * Nearest-prototype classification with a documented, stable tie-break:
 *   1. smallest weighted Euclidean distance,
 *   2. highest cosine similarity,
 *   3. alphabetical archetype code.
 */
export function classify(scores: number[]): ArchetypeDistance[] {
  const all = archetypes.map((a) => {
    const m = metricsFor(scores, a.vector);
    return { code: a.code, hidden: a.hidden, ...m, similarity: 0 };
  });

  // similarity (display) computed only across visible archetypes via softmax
  const visible = all.filter((d) => !d.hidden);
  const sims = softmax(
    visible.map((d) => -d.weighted),
    scoringConfig.softmaxTemperature,
  );
  visible.forEach((d, i) => {
    d.similarity = sims[i];
  });

  all.sort((p, q) => {
    if (Math.abs(p.weighted - q.weighted) > 1e-9) return p.weighted - q.weighted;
    if (Math.abs(p.cosine - q.cosine) > 1e-9) return q.cosine - p.cosine;
    return p.code < q.code ? -1 : 1;
  });
  return all;
}

/** Evaluate hidden-archetype rules against dimension scores and raw answers. */
export function evaluateHiddenRules(scores: number[], answers: Answers): HiddenStatus {
  const scoreOf = (dimId: string) => scores[dimensionOrder.indexOf(dimId)];
  const check = (cond: HiddenCondition): boolean => {
    switch (cond.type) {
      case 'dimensionAbove':
        return scoreOf(cond.dimension) > cond.value;
      case 'dimensionBelow':
        return scoreOf(cond.dimension) < cond.value;
      case 'answerAtLeast':
        return (answers[cond.questionId] ?? 0) >= cond.value;
      case 'answerAtMost':
        return answers[cond.questionId] !== undefined && answers[cond.questionId] <= cond.value;
      default:
        return false;
    }
  };
  for (const rule of hiddenRules) {
    if (rule.conditions.every(check)) {
      return { triggered: true, ruleId: rule.id, archetype: rule.archetype };
    }
  }
  return { triggered: false, ruleId: null, archetype: null };
}

/**
 * Per-question contribution toward the winning archetype.
 * direction_d = (c_d - 50)/50 is the archetype's lean on dimension d.
 * A question's push on d is w_qd * z_q; contribution = Σ_d push * direction.
 * Positive means the answer moved the profile toward the archetype.
 */
function computeContributions(answers: Answers, targetVector: number[]): QuestionContribution[] {
  const direction = targetVector.map((c) => (c - NEUTRAL) / NEUTRAL);
  const out: QuestionContribution[] = [];
  for (const q of questions) {
    const raw = answers[q.id];
    if (raw === undefined) continue;
    const z = centreAnswer(raw);
    let contribution = 0;
    for (const [dim, weight] of Object.entries(q.weights)) {
      const idx = dimensionOrder.indexOf(dim);
      if (idx < 0) continue;
      contribution += weight * z * direction[idx];
    }
    out.push({ id: q.id, contribution, magnitude: Math.abs(contribution), answer: raw });
  }
  return out.sort((a, b) => b.magnitude - a.magnitude);
}

/** Full deterministic scoring for a (possibly partial) answer set. */
export function scoreAnswers(answers: Answers): ScoreResult {
  const scores = computeDimensionScores(answers);
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;

  const dimensionScores: DimensionScore[] = dimensionOrder.map((id, idx) => ({
    id,
    group: dimensions.find((d) => d.id === id)!.group,
    score: scores[idx],
  }));

  const distances = classify(scores);
  const visibleSorted = distances.filter((d) => !d.hidden);
  const topFive = visibleSorted.slice(0, 5).map((d) => d.code);

  const hidden = evaluateHiddenRules(scores, answers);
  const primary = hidden.triggered && hidden.archetype ? hidden.archetype : visibleSorted[0].code;
  const secondary =
    primary === visibleSorted[0].code ? visibleSorted[1].code : visibleSorted[0].code;

  // entropy + match strength + margin over the K nearest visible archetypes
  const topK = scoringConfig.entropyTopK;
  const nearest = visibleSorted.slice(0, topK);
  const probs = softmax(
    nearest.map((d) => -d.weighted),
    scoringConfig.softmaxTemperature,
  );
  const entropy = normalisedEntropy(probs);
  const classificationMargin = probs.length > 1 ? probs[0] - probs[1] : probs[0];
  const matchStrength = Math.round(probs[0] * 100);

  const targetVector = archetypes.find((a) => a.code === primary)!.vector;
  const contributions = computeContributions(answers, targetVector);

  return {
    answers,
    answeredCount,
    totalQuestions: questions.length,
    complete: answeredCount === questions.length,
    dimensionOrder,
    scores,
    dimensionScores,
    groupScores: computeGroupScores(scores),
    themeScores: computeThemeScores(answers),
    distances,
    primary,
    secondary,
    topFive,
    matchStrength,
    classificationMargin,
    entropy,
    hidden,
    contributions,
  };
}

export { visibleArchetypes };
