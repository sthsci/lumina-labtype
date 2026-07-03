/**
 * Deterministic pseudo-random number generation.
 *
 * Every stochastic element of LUMINA (synthetic reference profiles, bootstrap
 * resampling, k-means initialisation, pipeline particle layout) is driven by a
 * SEEDED generator so that identical inputs always produce identical output.
 * We never call Math.random() in production paths.
 *
 * mulberry32 is a small, fast, well-distributed 32-bit generator. It is more
 * than adequate for visual/statistical toys and is trivially reproducible.
 */

/** Deterministically derive a 32-bit seed from an arbitrary string. */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0; // FNV-1a offset basis
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Standard normal sample (mean 0, sd 1) via Box–Muller. */
  gaussian(): number;
}

/** Create a seeded RNG. Accepts a number or a string (hashed to a seed). */
export function createRng(seed: number | string): Rng {
  let state = (typeof seed === 'number' ? seed : hashSeed(seed)) >>> 0;
  if (state === 0) state = 0x9e3779b9; // avoid a degenerate all-zero state

  const next = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min: number, max: number): number {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    gaussian(): number {
      // Box–Muller; guard against log(0).
      let u = 0;
      let v = 0;
      while (u === 0) u = next();
      while (v === 0) v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}

/** Sample `count` indices in [0, size) with replacement using the given RNG. */
export function resampleIndices(size: number, count: number, rng: Rng): number[] {
  const out: number[] = new Array(count);
  for (let i = 0; i < count; i += 1) {
    out[i] = rng.int(0, size - 1);
  }
  return out;
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
