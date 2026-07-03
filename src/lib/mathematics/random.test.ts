import { describe, it, expect } from 'vitest';
import { createRng, hashSeed, resampleIndices, shuffle } from './random';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng('lumina');
    const b = createRng('lumina');
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('differs across seeds', () => {
    const a = createRng('one').next();
    const b = createRng('two').next();
    expect(a).not.toBe(b);
  });

  it('produces values in [0, 1)', () => {
    const rng = createRng(123);
    for (let i = 0; i < 1000; i += 1) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int stays within bounds', () => {
    const rng = createRng('int-test');
    for (let i = 0; i < 1000; i += 1) {
      const v = rng.int(2, 7);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(7);
    }
  });
});

describe('hashSeed', () => {
  it('is stable and non-negative', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0);
  });
});

describe('resampleIndices', () => {
  it('is reproducible for the same seed', () => {
    const a = resampleIndices(10, 20, createRng('rs'));
    const b = resampleIndices(10, 20, createRng('rs'));
    expect(a).toEqual(b);
    expect(a).toHaveLength(20);
  });
});

describe('shuffle', () => {
  it('keeps all elements and is deterministic', () => {
    const a = shuffle([1, 2, 3, 4, 5], createRng('sh'));
    const b = shuffle([1, 2, 3, 4, 5], createRng('sh'));
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
