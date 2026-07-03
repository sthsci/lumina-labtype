/**
 * Deterministic LBTI × SBTI × zodiac cross-interpretation.
 *
 * The LBTI 15-dimensional result is the analytical subject. SBTI type and
 * zodiac sign are user-supplied narrative layers only: they change the wording,
 * never the LBTI scores. The same (result, sbti, zodiac) always yields the same
 * text — it is assembled from authored i18n fragments, never generated.
 */
import { interpolate } from '@/lib/templates/templates';
import { resolvePath, translations, type LanguageCode } from '@/i18n';
import { dimensionOrder } from '@/data/content';
import type { ScoreResult } from '@/features/scoring/types';

export const SBTI_AXES = ['EI', 'SN', 'TF', 'JP'] as const;
export const SBTI_LETTERS: Record<(typeof SBTI_AXES)[number], [string, string]> = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
};

/** All 16 SBTI-style four-letter codes, generated from the axis letters. */
export const SBTI_TYPES: string[] = SBTI_LETTERS.EI.flatMap((a) =>
  SBTI_LETTERS.SN.flatMap((b) =>
    SBTI_LETTERS.TF.flatMap((c) => SBTI_LETTERS.JP.map((d) => `${a}${b}${c}${d}`)),
  ),
);

export const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;
export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';
const ELEMENT_OF: Record<ZodiacSign, ZodiacElement> = {
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
};

export const elementOf = (sign: ZodiacSign): ZodiacElement => ELEMENT_OF[sign];
export const isSbtiType = (value: string): boolean => /^[EI][SN][TF][JP]$/.test(value);
export const isZodiacSign = (value: string): value is ZodiacSign =>
  (ZODIAC_SIGNS as readonly string[]).includes(value);

/** Which SBTI axis and (for most) LBTI dimension each aspect draws on. */
const ASPECTS: { id: string; axis: (typeof SBTI_AXES)[number]; dimension?: string }[] = [
  { id: 'decision', axis: 'SN', dimension: 'hypothesis_pattern' },
  { id: 'design', axis: 'JP', dimension: 'safe_risk' },
  { id: 'collaboration', axis: 'EI', dimension: 'team_independent' },
  { id: 'mentorship', axis: 'TF', dimension: 'specialist_organiser' },
  { id: 'conflict', axis: 'TF', dimension: 'diplomatic_direct' },
  { id: 'pressure', axis: 'JP', dimension: 'rumination_adaptation' },
  { id: 'role', axis: 'EI' },
  { id: 'blindspot', axis: 'SN', dimension: 'result_reproducibility' },
];

export interface CrossAspect {
  id: string;
  title: string;
  text: string;
}
export interface CrossInterpretation {
  header: string;
  aspects: CrossAspect[];
}

function str(lang: LanguageCode, key: string): string {
  const value = resolvePath(translations[lang], key);
  return typeof value === 'string' ? value : '';
}

/** Letter the chosen SBTI type carries on a given axis, or '' if none selected. */
function letterFor(sbti: string, axis: (typeof SBTI_AXES)[number]): string {
  if (!isSbtiType(sbti)) return '';
  const index = SBTI_AXES.indexOf(axis);
  return sbti[index] ?? '';
}

export function buildCrossInterpretation(
  result: ScoreResult,
  sbti: string,
  zodiac: string,
  lang: LanguageCode,
): CrossInterpretation {
  const archetypeName = str(lang, `archetypes.${result.primary}.name`);
  const sign = isZodiacSign(zodiac) ? zodiac : null;
  const element = sign ? elementOf(sign) : null;

  const header = interpolate(str(lang, 'cross.header'), {
    archetype: archetypeName,
    sbti: isSbtiType(sbti) ? sbti : str(lang, 'cross.noneShort'),
    zodiac: sign ? str(lang, `cross.zodiac.${sign}`) : str(lang, 'cross.noneShort'),
  });

  const aspects: CrossAspect[] = ASPECTS.map(({ id, axis, dimension }) => {
    // LBTI lean clause (the analytical subject)
    let lean: string;
    if (id === 'role') {
      lean = str(lang, `archetypes.${result.primary}.teamRole`);
    } else if (dimension) {
      const idx = dimensionOrder.indexOf(dimension);
      const high = result.scores[idx] >= 50;
      lean = str(lang, `dimensions.${dimension}.${high ? 'high' : 'low'}`);
    } else {
      lean = archetypeName;
    }

    const letter = letterFor(sbti, axis);
    const sbtiClause = letter ? str(lang, `cross.sbtiClauses.${axis}.${letter}`) : '';
    const zodiacClause = element ? str(lang, `cross.zodiacClauses.${element}`) : '';

    const text = interpolate(str(lang, `cross.aspects.${id}`), {
      archetype: archetypeName,
      lean,
      sbti: sbtiClause,
      zodiac: zodiacClause,
    })
      // tidy up when a narrative layer is absent
      .replace(/\s{2,}/g, ' ')
      .trim();

    return { id, title: str(lang, `cross.aspectTitles.${id}`), text };
  });

  return { header, aspects };
}
