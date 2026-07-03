import { describe, it, expect } from 'vitest';
import {
  centreAnswer,
  clamp,
  cosineSimilarity,
  euclidean,
  entropy,
  normalisedEntropy,
  pearson,
  rankWithTies,
  softmax,
  spearman,
  stdDev,
  weightedEuclidean,
} from './statistics';

describe('centreAnswer', () => {
  it('maps 1..5 to -1..1', () => {
    expect(centreAnswer(1)).toBe(-1);
    expect(centreAnswer(3)).toBe(0);
    expect(centreAnswer(5)).toBe(1);
    expect(centreAnswer(4)).toBe(0.5);
  });
});

describe('clamp', () => {
  it('bounds values', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(42, 0, 100)).toBe(42);
  });
});

describe('distances', () => {
  it('euclidean', () => {
    expect(euclidean([0, 0], [3, 4])).toBeCloseTo(5);
  });
  it('weighted euclidean applies per-dimension weights', () => {
    expect(weightedEuclidean([0, 0], [1, 1], [4, 0])).toBeCloseTo(2);
  });
});

describe('cosineSimilarity', () => {
  it('is 1 for parallel vectors and invariant to scale', () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  });
  it('is 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
});

describe('correlations', () => {
  it('pearson is 1 for a perfect linear relationship', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
  });
  it('pearson is -1 for a perfect inverse relationship', () => {
    expect(pearson([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1);
  });
  it('spearman handles monotonic non-linear data', () => {
    expect(spearman([1, 2, 3, 4], [1, 4, 9, 16])).toBeCloseTo(1);
  });
});

describe('rankWithTies', () => {
  it('averages tied ranks', () => {
    expect(rankWithTies([10, 20, 20, 40])).toEqual([1, 2.5, 2.5, 4]);
  });
});

describe('softmax', () => {
  it('produces a probability distribution', () => {
    const p = softmax([1, 2, 3]);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(p[2]).toBeGreaterThan(p[0]);
  });
  it('temperature flattens the distribution', () => {
    const sharp = softmax([1, 5], 0.5);
    const flat = softmax([1, 5], 5);
    expect(sharp[1] - sharp[0]).toBeGreaterThan(flat[1] - flat[0]);
  });
});

describe('entropy', () => {
  it('is zero for a certain outcome', () => {
    expect(entropy([1, 0, 0])).toBeCloseTo(0);
  });
  it('normalised entropy is 1 for a uniform distribution', () => {
    expect(normalisedEntropy([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(1);
  });
});

describe('stdDev', () => {
  it('computes population standard deviation', () => {
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2);
  });
});
