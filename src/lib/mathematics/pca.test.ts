import { describe, it, expect } from 'vitest';
import { fitPca, jacobiEigen, projectAll } from './pca';

describe('jacobiEigen', () => {
  it('diagonalises a symmetric matrix', () => {
    const { values } = jacobiEigen([
      [2, 0],
      [0, 3],
    ]);
    const sorted = [...values].sort((a, b) => a - b);
    expect(sorted[0]).toBeCloseTo(2);
    expect(sorted[1]).toBeCloseTo(3);
  });

  it('recovers eigenvalues of a coupled matrix', () => {
    const { values } = jacobiEigen([
      [4, 1],
      [1, 4],
    ]);
    const sorted = [...values].sort((a, b) => a - b);
    expect(sorted[0]).toBeCloseTo(3);
    expect(sorted[1]).toBeCloseTo(5);
  });
});

describe('fitPca', () => {
  const data = [
    [2, 0, 0],
    [0, 2, 0],
    [-2, 0, 0],
    [0, -2, 0],
  ];

  it('returns as many components as features', () => {
    const pca = fitPca(data);
    expect(pca.components).toHaveLength(3);
    expect(pca.eigenvalues).toHaveLength(3);
  });

  it('explained variance sums to ~1', () => {
    const pca = fitPca(data);
    const total = pca.explainedVariance.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1);
  });

  it('projects samples into k dimensions', () => {
    const pca = fitPca(data);
    const projected = projectAll(data, pca, 2);
    expect(projected).toHaveLength(4);
    expect(projected[0]).toHaveLength(2);
  });

  it('orders components by descending variance', () => {
    const pca = fitPca([
      [10, 0],
      [-10, 0],
      [0, 1],
      [0, -1],
    ]);
    expect(pca.eigenvalues[0]).toBeGreaterThan(pca.eigenvalues[1]);
  });
});
