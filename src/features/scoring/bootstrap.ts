/**
 * Bootstrap-style stability analysis.
 *
 * We repeatedly resample the ANSWERED questions with replacement, recompute the
 * dimension scores and the nearest visible archetype, and tally how often each
 * archetype wins. This measures the internal stability of this fictional scoring
 * system under question resampling. It is NOT clinical reliability or any form
 * of scientific validation.
 *
 * The RNG is seeded from a fixed config seed plus a hash of the answers, so the
 * same profile always yields the same stability estimate.
 */
import { createRng, stdDev } from '@/lib/mathematics';
import { dimensionOrder, questions, scoringConfig } from '@/data/content';
import { classify, computeDimensionScores } from './engine';
import type { Answers } from './types';

export interface StabilityResult {
  replicates: number;
  /** archetype code -> assignment fraction (0..1). */
  frequencies: Record<string, number>;
  /** archetype code -> raw assignment count. */
  counts: Record<string, number>;
  /** Fraction of replicates that agreed with the primary from the full profile. */
  stability: number;
  primary: string;
  /** Per-dimension standard deviation across replicates (most unstable first). */
  dimensionVariability: { id: string; std: number }[];
  /** Convergence trace: primary fraction after 1..N replicates (thinned). */
  convergence: number[];
}

function hashAnswers(answers: Answers): string {
  return Object.keys(answers)
    .sort()
    .map((k) => `${k}:${answers[k]}`)
    .join('|');
}

export function runBootstrap(answers: Answers, replicates?: number): StabilityResult {
  const n = replicates ?? scoringConfig.bootstrap.defaultReplicates;
  const answeredIds = questions.map((q) => q.id).filter((id) => answers[id] !== undefined);

  const fullPrimary = classify(computeDimensionScores(answers)).filter((d) => !d.hidden)[0].code;
  const rng = createRng(`${scoringConfig.bootstrap.seed}-${hashAnswers(answers)}`);

  const counts: Record<string, number> = {};
  const dimSamples: number[][] = dimensionOrder.map(() => []);
  const convergence: number[] = [];
  let primaryHits = 0;

  for (let i = 0; i < n; i += 1) {
    const resampled: Answers = {};
    const tally: Record<string, number> = {};
    // sample with replacement, averaging duplicate picks per question id
    const picks = answeredIds.map(() => answeredIds[rng.int(0, answeredIds.length - 1)]);
    for (const id of picks) {
      tally[id] = (tally[id] ?? 0) + 1;
    }
    for (const id of Object.keys(tally)) resampled[id] = answers[id];

    const scores = computeDimensionScores(resampled);
    scores.forEach((s, d) => dimSamples[d].push(s));
    const winner = classify(scores).filter((d) => !d.hidden)[0].code;
    counts[winner] = (counts[winner] ?? 0) + 1;
    if (winner === fullPrimary) primaryHits += 1;

    // record convergence roughly 40 points across the run
    if (i % Math.max(1, Math.floor(n / 40)) === 0) {
      convergence.push(primaryHits / (i + 1));
    }
  }

  const frequencies: Record<string, number> = {};
  for (const code of Object.keys(counts)) frequencies[code] = counts[code] / n;

  const dimensionVariability = dimensionOrder
    .map((id, d) => ({ id, std: stdDev(dimSamples[d]) }))
    .sort((a, b) => b.std - a.std);

  return {
    replicates: n,
    frequencies,
    counts,
    stability: primaryHits / n,
    primary: fullPrimary,
    dimensionVariability,
    convergence,
  };
}
