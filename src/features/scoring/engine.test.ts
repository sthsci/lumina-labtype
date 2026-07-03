import { describe, it, expect } from 'vitest';
import { classify, computeDimensionScores, evaluateHiddenRules, scoreAnswers } from './engine';
import { archetypes, dimensionOrder } from '@/data/content';
import { fixtures } from '../../../tests/fixtures/profiles';

const idx = (id: string) => dimensionOrder.indexOf(id);

describe('computeDimensionScores', () => {
  it('maps a lone positive-weight strong-agree to 100', () => {
    // q29 => fusion_boundaries +0.9
    const s = computeDimensionScores({ q29: 5 });
    expect(s[idx('fusion_boundaries')]).toBeCloseTo(100);
  });

  it('reverse-codes a negative weight (strong agree -> low endpoint)', () => {
    // q01 => hypothesis_pattern -0.9
    const s = computeDimensionScores({ q01: 5 });
    expect(s[idx('hypothesis_pattern')]).toBeCloseTo(0);
  });

  it('returns the neutral midpoint for a "depends" answer', () => {
    const s = computeDimensionScores({ q29: 3 });
    expect(s[idx('fusion_boundaries')]).toBeCloseTo(50);
  });

  it('defaults unanswered dimensions to 50', () => {
    const s = computeDimensionScores({});
    expect(s.every((v) => v === 50)).toBe(true);
  });

  it('handles a multi-dimension question', () => {
    // q06 => depth_breadth +0.5, opening_completing -0.9
    const s = computeDimensionScores({ q06: 5 });
    expect(s[idx('depth_breadth')]).toBeCloseTo(100);
    expect(s[idx('opening_completing')]).toBeCloseTo(0);
  });

  it('keeps every score within 0..100', () => {
    for (const answers of Object.values(fixtures)) {
      const s = computeDimensionScores(answers);
      for (const v of s) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('classify', () => {
  it('places an archetype nearest to its own prototype vector', () => {
    for (const a of archetypes.filter((x) => !x.hidden)) {
      const ranked = classify(a.vector).filter((d) => !d.hidden);
      expect(ranked[0].code).toBe(a.code);
      expect(ranked[0].weighted).toBeCloseTo(0);
    }
  });

  it('produces a stable, total ordering', () => {
    const scores = computeDimensionScores(fixtures.quantitativeSceptic);
    const a = classify(scores);
    const b = classify(scores);
    expect(a.map((d) => d.code)).toEqual(b.map((d) => d.code));
    expect(a).toHaveLength(archetypes.length);
  });
});

describe('scoreAnswers — deterministic snapshots', () => {
  const expected: Record<string, { primary: string; hidden: string | null }> = {
    balancedProfile: { primary: 'EXCEL', hidden: null },
    quantitativeSceptic: { primary: 'NULL', hidden: null },
    broadExplorer: { primary: 'OMNI', hidden: null },
    completionSpecialist: { primary: 'GIT', hidden: null },
    projectOpener: { primary: 'OMNI', hidden: null },
    workflowAutomator: { primary: 'GIT', hidden: null },
    highRiskStrategist: { primary: 'PREPRINT', hidden: null },
    hiddenSupervisor: { primary: 'PI', hidden: 'PI' },
  };

  for (const [name, answers] of Object.entries(fixtures)) {
    it(`${name} classifies deterministically`, () => {
      const r1 = scoreAnswers(answers);
      const r2 = scoreAnswers(answers);
      expect(r1).toEqual(r2); // full determinism
      expect(r1.primary).toBe(expected[name].primary);
      expect(r1.hidden.archetype).toBe(expected[name].hidden);
      expect(r1.topFive).toHaveLength(5);
      expect(r1.matchStrength).toBeGreaterThanOrEqual(0);
      expect(r1.matchStrength).toBeLessThanOrEqual(100);
      expect(r1.entropy).toBeGreaterThanOrEqual(0);
      expect(r1.entropy).toBeLessThanOrEqual(1);
      expect(r1.classificationMargin).toBeGreaterThanOrEqual(0);
    });
  }

  it('a balanced profile has high entropy (spans many archetypes)', () => {
    const r = scoreAnswers(fixtures.balancedProfile);
    expect(r.entropy).toBeGreaterThan(0.9);
  });

  it('a strongly-leaning profile has lower entropy than a balanced one', () => {
    const explorer = scoreAnswers(fixtures.broadExplorer).entropy;
    const balanced = scoreAnswers(fixtures.balancedProfile).entropy;
    expect(explorer).toBeLessThan(balanced);
  });

  it('marks a full answer set complete and a partial one incomplete', () => {
    expect(scoreAnswers(fixtures.balancedProfile).complete).toBe(true);
    expect(scoreAnswers({ q01: 5 }).complete).toBe(false);
  });

  it('ranks a question that supports the winner with positive contribution', () => {
    const r = scoreAnswers(fixtures.quantitativeSceptic);
    const supporting = r.contributions.filter((c) => c.contribution > 0);
    expect(supporting.length).toBeGreaterThan(0);
    // the largest-magnitude contribution should be finite and defined
    expect(Number.isFinite(r.contributions[0].magnitude)).toBe(true);
  });
});

describe('evaluateHiddenRules', () => {
  it('does not trigger for a balanced profile', () => {
    const s = computeDimensionScores(fixtures.balancedProfile);
    expect(evaluateHiddenRules(s, fixtures.balancedProfile).triggered).toBe(false);
  });

  it('triggers PI for the supervisor fixture', () => {
    const s = computeDimensionScores(fixtures.hiddenSupervisor);
    const status = evaluateHiddenRules(s, fixtures.hiddenSupervisor);
    expect(status.triggered).toBe(true);
    expect(status.archetype).toBe('PI');
  });
});
