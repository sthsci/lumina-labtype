import { describe, it, expect } from 'vitest';
import { runBootstrap } from './bootstrap';
import { fixtures } from '../../../tests/fixtures/profiles';

describe('runBootstrap', () => {
  it('is reproducible for identical answers', () => {
    const a = runBootstrap(fixtures.quantitativeSceptic, 200);
    const b = runBootstrap(fixtures.quantitativeSceptic, 200);
    expect(a.frequencies).toEqual(b.frequencies);
    expect(a.stability).toBe(b.stability);
  });

  it('assignment frequencies sum to ~1', () => {
    const r = runBootstrap(fixtures.completionSpecialist, 300);
    const total = Object.values(r.frequencies).reduce((x, y) => x + y, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it('reports high stability for a strongly-leaning profile', () => {
    const r = runBootstrap(fixtures.broadExplorer, 300);
    expect(r.stability).toBeGreaterThan(0.6);
    expect(r.primary).toBe('OMNI');
  });

  it('honours the requested replicate count', () => {
    const r = runBootstrap(fixtures.balancedProfile, 100);
    expect(r.replicates).toBe(100);
    expect(Object.values(r.counts).reduce((x, y) => x + y, 0)).toBe(100);
  });

  it('orders dimension variability from most to least unstable', () => {
    const r = runBootstrap(fixtures.projectOpener, 200);
    for (let i = 1; i < r.dimensionVariability.length; i += 1) {
      expect(r.dimensionVariability[i - 1].std).toBeGreaterThanOrEqual(
        r.dimensionVariability[i].std,
      );
    }
  });
});
