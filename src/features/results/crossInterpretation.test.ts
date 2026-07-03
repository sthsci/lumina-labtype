import { describe, expect, it } from 'vitest';
import { scoreAnswers } from '@/features/scoring/engine';
import {
  buildCrossInterpretation,
  elementOf,
  isSbtiType,
  isZodiacSign,
  SBTI_TYPES,
  ZODIAC_SIGNS,
} from './crossInterpretation';

const answers = Object.fromEntries(Array.from({ length: 36 }, (_, i) => [`q${String(i + 1).padStart(2, '0')}`, 4]));
const result = scoreAnswers(answers);

describe('cross-interpretation config', () => {
  it('enumerates SBTI project codes and 12 zodiac signs', () => {
    expect(SBTI_TYPES).toHaveLength(27);
    expect(new Set(SBTI_TYPES).size).toBe(27);
    expect(SBTI_TYPES).toContain('CTRL');
    expect(SBTI_TYPES).toContain('DRUNK');
    expect(SBTI_TYPES).not.toContain('INTJ');
    expect(ZODIAC_SIGNS).toHaveLength(12);
  });

  it('maps signs to the correct classical element', () => {
    expect(elementOf('aries')).toBe('fire');
    expect(elementOf('taurus')).toBe('earth');
    expect(elementOf('gemini')).toBe('air');
    expect(elementOf('cancer')).toBe('water');
  });

  it('validates SBTI and zodiac inputs', () => {
    expect(isSbtiType('CTRL')).toBe(true);
    expect(isSbtiType('INTJ')).toBe(false);
    expect(isSbtiType('XXXX')).toBe(false);
    expect(isZodiacSign('leo')).toBe(true);
    expect(isZodiacSign('nope')).toBe(false);
  });
});

describe('buildCrossInterpretation', () => {
  it('produces exactly eight aspects with non-empty, marker-free text', () => {
    const reading = buildCrossInterpretation(result, 'CTRL', 'leo', 'en');
    expect(reading.aspects).toHaveLength(8);
    for (const aspect of reading.aspects) {
      expect(aspect.title.trim()).not.toBe('');
      expect(aspect.text.trim()).not.toBe('');
      expect(aspect.text).not.toMatch(/\{[a-zA-Z]+\}/); // no unresolved markers
    }
  });

  it('is deterministic for identical inputs', () => {
    const a = buildCrossInterpretation(result, 'SHIT', 'scorpio', 'zh-CN');
    const b = buildCrossInterpretation(result, 'SHIT', 'scorpio', 'zh-CN');
    expect(a).toEqual(b);
  });

  it('changes wording when the SBTI type changes but keeps eight aspects', () => {
    const ctrl = buildCrossInterpretation(result, 'CTRL', 'leo', 'en');
    const drunk = buildCrossInterpretation(result, 'DRUNK', 'leo', 'en');
    expect(drunk.aspects).toHaveLength(8);
    // at least one aspect differs in wording between the two SBTI types
    const differs = ctrl.aspects.some((a, i) => a.text !== drunk.aspects[i].text);
    expect(differs).toBe(true);
  });

  it('still works with no SBTI / zodiac selected', () => {
    const reading = buildCrossInterpretation(result, '', '', 'en');
    expect(reading.aspects).toHaveLength(8);
    for (const aspect of reading.aspects) {
      expect(aspect.text.trim()).not.toBe('');
      expect(aspect.text).not.toMatch(/\{[a-zA-Z]+\}/);
    }
  });

  it('renders localized aspect text in all three languages', () => {
    for (const lang of ['en', 'zh-CN', 'zh-TW'] as const) {
      const reading = buildCrossInterpretation(result, 'CTRL', 'capricorn', lang);
      expect(reading.aspects[0].text.length).toBeGreaterThan(0);
    }
  });
});
