import { describe, it, expect } from 'vitest';
import { composeResultProse } from './compose';
import { scoreAnswers } from '@/features/scoring/engine';
import { fixtures } from '../../../tests/fixtures/profiles';
import type { LanguageCode } from '@/i18n';

const langs: LanguageCode[] = ['en', 'zh-CN', 'zh-TW'];

describe('composeResultProse', () => {
  it('produces marker-free paragraphs in every language', () => {
    const result = scoreAnswers(fixtures.quantitativeSceptic);
    for (const lang of langs) {
      const paras = composeResultProse(result, { field: 'computational', stage: 'phd' }, lang, {
        stabilityPercent: 82,
      });
      expect(paras.length).toBeGreaterThanOrEqual(6);
      for (const p of paras) {
        expect(p).not.toMatch(/\{[a-zA-Z]+\}/); // no unresolved markers
        expect(p.trim()).not.toBe('');
      }
    }
  });

  it('is deterministic for identical input', () => {
    const result = scoreAnswers(fixtures.completionSpecialist);
    const a = composeResultProse(result, null, 'en', { stabilityPercent: 70 });
    const b = composeResultProse(result, null, 'en', { stabilityPercent: 70 });
    expect(a).toEqual(b);
  });

  it('omits context paragraphs when no context is given', () => {
    const result = scoreAnswers(fixtures.balancedProfile);
    const withCtx = composeResultProse(result, { field: 'theory', stage: 'postdoc' }, 'en');
    const without = composeResultProse(result, null, 'en');
    expect(withCtx.length).toBeGreaterThan(without.length);
  });

  it('adds a stability paragraph only when a percent is provided', () => {
    const result = scoreAnswers(fixtures.broadExplorer);
    const withStability = composeResultProse(result, null, 'en', { stabilityPercent: 90 });
    const without = composeResultProse(result, null, 'en');
    expect(withStability.length).toBe(without.length + 1);
  });
});
