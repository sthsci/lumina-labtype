import { describe, it, expect } from 'vitest';
import {
  archetypes,
  dimensionOrder,
  dimensions,
  hiddenArchetypes,
  questions,
  validateContentIntegrity,
  visibleArchetypes,
} from './content';

describe('content integrity', () => {
  it('passes cross-file referential validation', () => {
    expect(validateContentIntegrity()).toEqual([]);
  });

  it('has exactly 15 dimensions in a stable order', () => {
    expect(dimensions).toHaveLength(15);
    expect(dimensionOrder).toHaveLength(15);
    expect(new Set(dimensionOrder).size).toBe(15);
  });

  it('has 30..36 questions with unique ids', () => {
    expect(questions.length).toBeGreaterThanOrEqual(30);
    expect(questions.length).toBeLessThanOrEqual(36);
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
  });

  it('has at least 18 visible archetypes and 3 hidden ones', () => {
    expect(visibleArchetypes.length).toBeGreaterThanOrEqual(18);
    expect(hiddenArchetypes.length).toBeGreaterThanOrEqual(3);
    expect(new Set(archetypes.map((a) => a.code)).size).toBe(archetypes.length);
  });

  it('every dimension has at least two informative questions', () => {
    const counts = new Map<string, number>();
    for (const q of questions) {
      for (const dim of Object.keys(q.weights)) {
        counts.set(dim, (counts.get(dim) ?? 0) + 1);
      }
    }
    for (const dim of dimensionOrder) {
      expect(counts.get(dim) ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  it('all archetype vectors are 15-dimensional and within 0..100', () => {
    for (const a of archetypes) {
      expect(a.vector).toHaveLength(15);
      for (const v of a.vector) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });
});
