import { describe, it, expect } from 'vitest';
import { cutTree, hierarchicalCluster, kMeans, silhouetteScore } from './clustering';
import { createRng } from './random';

const blobs = [
  [0, 0],
  [0.2, 0.1],
  [-0.1, 0.2],
  [10, 10],
  [10.2, 9.9],
  [9.8, 10.1],
];

describe('kMeans', () => {
  it('separates two well-defined blobs', () => {
    const rng = createRng('kmeans-test');
    const result = kMeans(blobs, 2, rng);
    // points 0..2 share a cluster, points 3..5 share the other
    const first = result.assignments[0];
    expect(result.assignments.slice(0, 3).every((a) => a === first)).toBe(true);
    const second = result.assignments[3];
    expect(result.assignments.slice(3).every((a) => a === second)).toBe(true);
    expect(first).not.toBe(second);
  });

  it('is deterministic for the same seed', () => {
    const a = kMeans(blobs, 2, createRng('seed-x'));
    const b = kMeans(blobs, 2, createRng('seed-x'));
    expect(a.assignments).toEqual(b.assignments);
    expect(a.inertia).toBeCloseTo(b.inertia);
  });

  it('records iteration history', () => {
    const result = kMeans(blobs, 2, createRng('history'));
    expect(result.history.length).toBeGreaterThan(0);
  });
});

describe('silhouetteScore', () => {
  it('is high for clean clusters', () => {
    const result = kMeans(blobs, 2, createRng('sil'));
    const score = silhouetteScore(blobs, result.assignments);
    expect(score).toBeGreaterThan(0.8);
  });
});

describe('hierarchicalCluster', () => {
  it('builds a tree with all leaves', () => {
    const root = hierarchicalCluster(blobs, 'average');
    expect(root.size).toBe(blobs.length);
  });

  it('cuts into two clusters at a mid threshold', () => {
    const root = hierarchicalCluster(blobs, 'average');
    const clusters = cutTree(root, 5);
    expect(clusters).toHaveLength(2);
  });

  it('complete linkage produces a valid tree', () => {
    const root = hierarchicalCluster(blobs, 'complete');
    expect(root.children).toHaveLength(2);
  });
});
