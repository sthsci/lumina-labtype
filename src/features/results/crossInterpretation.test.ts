import { describe, expect, it } from 'vitest';
import { scoreAnswers } from '@/features/scoring/engine';
import {
  buildCrossInterpretation,
  elementOf,
  generateCrossReading,
  isSbtiType,
  isZodiacSign,
  SBTI_TYPES,
  ZODIAC_SIGNS,
  type CrossReading,
} from './crossInterpretation';

const answers = Object.fromEntries(Array.from({ length: 36 }, (_, i) => [`q${String(i + 1).padStart(2, '0')}`, 4]));
const result = scoreAnswers(answers);
const neutralScores = Array.from({ length: 15 }, () => 50);

function allSections(reading: CrossReading): string[] {
  return [
    reading.openingScene,
    reading.researchDecision,
    reading.experimentDesign,
    reading.collaboration,
    reading.pressureResponse,
    reading.usefulContradiction,
    reading.laboratoryRole,
    reading.failureMode,
  ];
}

function duplicateCount(values: string[]): number {
  return values.length - new Set(values).size;
}

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

describe('generateCrossReading', () => {
  it('returns a structured reading with marker-free content', () => {
    const reading = buildCrossInterpretation(result, 'CTRL', 'leo', 'zh-CN');
    expect(reading.combinationTitle).toContain('，');
    expect(reading.survivalAdvice).toHaveLength(3);
    expect(reading.badges).toHaveLength(3);
    for (const text of [reading.combinationTitle, reading.hook, reading.shareLine, ...allSections(reading)]) {
      expect(text.trim()).not.toBe('');
      expect(text).not.toMatch(/\{[a-zA-Z]+\}/);
    }
  });

  it('is deterministic for identical inputs', () => {
    const a = buildCrossInterpretation(result, 'SHIT', 'scorpio', 'zh-CN');
    const b = buildCrossInterpretation(result, 'SHIT', 'scorpio', 'zh-CN');
    expect(a).toEqual(b);
  });

  it('changes the behavioural core when LBTI changes', () => {
    const bayes = generateCrossReading({ lbtiType: 'BAYES', sbtiType: 'CTRL', zodiac: 'leo', language: 'zh-CN', scores: neutralScores });
    const pipet = generateCrossReading({ lbtiType: 'PIPET', sbtiType: 'CTRL', zodiac: 'leo', language: 'zh-CN', scores: neutralScores });
    expect(bayes.researchDecision).not.toBe(pipet.researchDecision);
    expect(bayes.experimentDesign).not.toBe(pipet.experimentDesign);
    expect(bayes.shareLine).not.toBe(pipet.shareLine);
  });

  it('changes presentation when SBTI changes without changing LBTI badge', () => {
    const ctrl = generateCrossReading({ lbtiType: 'PREPRINT', sbtiType: 'CTRL', zodiac: 'aquarius', language: 'zh-CN', scores: neutralScores });
    const gogo = generateCrossReading({ lbtiType: 'PREPRINT', sbtiType: 'GOGO', zodiac: 'aquarius', language: 'zh-CN', scores: neutralScores });
    expect(ctrl.badges[0]).toEqual(gogo.badges[0]);
    expect(ctrl.collaboration).not.toBe(gogo.collaboration);
    expect(ctrl.usefulContradiction).not.toBe(gogo.usefulContradiction);
  });

  it('changes scene texture when zodiac changes without changing LBTI badge', () => {
    const leo = generateCrossReading({ lbtiType: 'REPRO', sbtiType: 'THIN-K', zodiac: 'leo', language: 'zh-CN', scores: neutralScores });
    const virgo = generateCrossReading({ lbtiType: 'REPRO', sbtiType: 'THIN-K', zodiac: 'virgo', language: 'zh-CN', scores: neutralScores });
    expect(leo.badges[0]).toEqual(virgo.badges[0]);
    expect(leo.openingScene).not.toBe(virgo.openingScene);
    expect(leo.pressureResponse).not.toBe(virgo.pressureResponse);
  });

  it('uses actual score direction in the decision section', () => {
    const highRisk = [...neutralScores];
    const lowRisk = [...neutralScores];
    highRisk[12] = 85;
    lowRisk[12] = 15;
    const high = generateCrossReading({ lbtiType: 'ESC', sbtiType: 'CTRL', zodiac: 'aries', language: 'zh-CN', scores: highRisk });
    const low = generateCrossReading({ lbtiType: 'ESC', sbtiType: 'CTRL', zodiac: 'aries', language: 'zh-CN', scores: lowRisk });
    expect(high.researchDecision).toContain('风险分数偏高');
    expect(low.researchDecision).toContain('风险分数偏低');
  });

  it('renders localized structured text in all three languages', () => {
    for (const language of ['en', 'zh-CN', 'zh-TW'] as const) {
      const reading = generateCrossReading({ lbtiType: 'MODEL', sbtiType: 'MONK', zodiac: 'capricorn', language, scores: neutralScores });
      expect(reading.openingScene.length).toBeGreaterThan(40);
      expect(reading.survivalAdvice).toHaveLength(3);
    }
  });

  it('audits 36 representative combinations for excessive duplication', () => {
    const lbti = ['BAYES', 'PIPET', 'R2D2', 'FIG1', 'NULL', 'GIT', 'OMNI', 'REPRO', 'MODEL', 'PREPRINT', 'SOLO', 'CONTROL'];
    const sbti = ['CTRL', 'GOGO', 'THIN-K'];
    const zodiac = ['leo', 'virgo', 'aquarius'];
    const readings = lbti.flatMap((type, i) =>
      sbti.map((sb, j) => generateCrossReading({
        lbtiType: type,
        sbtiType: sb,
        zodiac: zodiac[(i + j) % zodiac.length],
        language: 'zh-CN',
        scores: neutralScores.map((score, k) => (k === 12 ? 30 + ((i + j) % 3) * 25 : score)),
      })),
    );

    expect(readings).toHaveLength(36);
    expect(duplicateCount(readings.map((r) => r.combinationTitle))).toBe(0);
    expect(duplicateCount(readings.map((r) => r.shareLine))).toBe(0);
    expect(duplicateCount(readings.map((r) => r.openingScene))).toBe(0);

    for (const key of [
      'researchDecision',
      'experimentDesign',
      'collaboration',
      'pressureResponse',
      'usefulContradiction',
      'laboratoryRole',
      'failureMode',
    ] as const) {
      expect(duplicateCount(readings.map((r) => r[key]))).toBeLessThanOrEqual(1);
    }
    expect(readings.some((r) => r.openingScene.startsWith('在'))).toBe(false);
  });
});
