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

export const SBTI_TYPE_OPTIONS = [
  { code: 'CTRL', cn: '拿捏者' },
  { code: 'ATM-er', cn: '送钱者' },
  { code: 'Dior-s', cn: '屌丝' },
  { code: 'BOSS', cn: '领导者' },
  { code: 'THAN-K', cn: '感恩者' },
  { code: 'OH-NO', cn: '哦不人' },
  { code: 'GOGO', cn: '行者' },
  { code: 'SEXY', cn: '尤物' },
  { code: 'LOVE-R', cn: '多情者' },
  { code: 'MUM', cn: '妈妈' },
  { code: 'FAKE', cn: '伪人' },
  { code: 'OJBK', cn: '无所谓人' },
  { code: 'MALO', cn: '吗喽' },
  { code: 'JOKE-R', cn: '小丑' },
  { code: 'WOC!', cn: '握草人' },
  { code: 'THIN-K', cn: '思考者' },
  { code: 'SHIT', cn: '愤世者' },
  { code: 'ZZZZ', cn: '装死者' },
  { code: 'POOR', cn: '贫困者' },
  { code: 'MONK', cn: '僧人' },
  { code: 'IMSB', cn: '傻者' },
  { code: 'SOLO', cn: '孤儿' },
  { code: 'FUCK', cn: '草者' },
  { code: 'DEAD', cn: '死者' },
  { code: 'IMFW', cn: '废物' },
  { code: 'HHHH', cn: '傻乐者' },
  { code: 'DRUNK', cn: '酒鬼' },
] as const;

export const SBTI_TYPES: string[] = SBTI_TYPE_OPTIONS.map((type) => type.code);

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
export const isSbtiType = (value: string): boolean => SBTI_TYPES.includes(value);
export const isZodiacSign = (value: string): value is ZodiacSign =>
  (ZODIAC_SIGNS as readonly string[]).includes(value);

/** Which LBTI dimension each cross-reading aspect draws on. */
const ASPECTS: { id: string; dimension?: string }[] = [
  { id: 'decision', dimension: 'hypothesis_pattern' },
  { id: 'design', dimension: 'safe_risk' },
  { id: 'collaboration', dimension: 'team_independent' },
  { id: 'mentorship', dimension: 'specialist_organiser' },
  { id: 'conflict', dimension: 'diplomatic_direct' },
  { id: 'pressure', dimension: 'rumination_adaptation' },
  { id: 'role' },
  { id: 'blindspot', dimension: 'result_reproducibility' },
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

export function sbtiLabel(sbti: string): string {
  const type = SBTI_TYPE_OPTIONS.find((option) => option.code === sbti);
  return type ? `${type.code}（${type.cn}）` : '';
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
    sbti: sbtiLabel(sbti) || str(lang, 'cross.noneShort'),
    zodiac: sign ? str(lang, `cross.zodiac.${sign}`) : str(lang, 'cross.noneShort'),
  });

  const sbtiClause = sbtiLabel(sbti)
    ? interpolate(str(lang, 'cross.sbtiTypeClause'), { type: sbtiLabel(sbti) })
    : '';

  const aspects: CrossAspect[] = ASPECTS.map(({ id, dimension }) => {
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
