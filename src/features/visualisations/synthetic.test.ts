import { describe, it, expect } from 'vitest';
import { generateSyntheticProfiles } from './synthetic';
import { visibleArchetypes } from '@/data/content';

describe('generateSyntheticProfiles', () => {
  it('is deterministic for a fixed seed', () => {
    const a = generateSyntheticProfiles({ perArchetype: 5, seed: 'x' });
    const b = generateSyntheticProfiles({ perArchetype: 5, seed: 'x' });
    expect(a).toEqual(b);
  });

  it('generates perArchetype points per visible archetype', () => {
    const pts = generateSyntheticProfiles({ perArchetype: 8 });
    expect(pts).toHaveLength(visibleArchetypes.length * 8);
  });

  it('keeps every value within 0..100', () => {
    const pts = generateSyntheticProfiles({ perArchetype: 20, noise: 40 });
    for (const p of pts) {
      for (const v of p.vector) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it('produces 15-dimensional vectors tagged with a source archetype', () => {
    const pts = generateSyntheticProfiles({ perArchetype: 2 });
    expect(pts[0].vector).toHaveLength(15);
    expect(typeof pts[0].source).toBe('string');
  });
});
