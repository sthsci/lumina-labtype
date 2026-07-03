import { describe, it, expect } from 'vitest';
import { hasUnresolvedMarkers, interpolate, markersIn } from './templates';

describe('interpolate', () => {
  it('replaces known markers', () => {
    expect(interpolate('Hello {name}, you are {code}.', { name: 'A', code: 'BAYES' })).toBe(
      'Hello A, you are BAYES.',
    );
  });

  it('leaves unknown markers untouched (detectable by the guard)', () => {
    const out = interpolate('Value {missing}', {});
    expect(out).toBe('Value {missing}');
    expect(hasUnresolvedMarkers(out)).toBe(true);
  });

  it('coerces numbers', () => {
    expect(interpolate('{n}%', { n: 42 })).toBe('42%');
  });

  it('reports no unresolved markers when all are filled', () => {
    expect(hasUnresolvedMarkers(interpolate('{a}-{b}', { a: 1, b: 2 }))).toBe(false);
  });
});

describe('markersIn', () => {
  it('lists referenced markers', () => {
    expect(markersIn('{a} and {b} and {a}')).toEqual(['a', 'b', 'a']);
  });
});
