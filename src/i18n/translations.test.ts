import { describe, it, expect } from 'vitest';
import { translations, type LanguageCode } from './index';
import { archetypes, dimensionOrder, questionIds, themes } from '@/data/content';

/** Flatten a nested translation object into dot-path -> value (string | string[]). */
function flatten(obj: unknown, prefix = ''): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  if (Array.isArray(obj)) {
    out[prefix] = obj as string[];
    return out;
  }
  if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      Object.assign(out, flatten(value, path));
    }
    return out;
  }
  out[prefix] = obj as string;
  return out;
}

const langs = Object.keys(translations) as LanguageCode[];
const flat = Object.fromEntries(langs.map((l) => [l, flatten(translations[l])])) as Record<
  LanguageCode,
  Record<string, string | string[]>
>;

describe('translation completeness', () => {
  const reference = 'en' as const;
  const referenceKeys = Object.keys(flat[reference]).sort();

  for (const lang of langs) {
    it(`${lang} has exactly the same keys as ${reference}`, () => {
      const keys = Object.keys(flat[lang]).sort();
      const missing = referenceKeys.filter((k) => !keys.includes(k));
      const extra = keys.filter((k) => !referenceKeys.includes(k));
      expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    });

    it(`${lang} has no empty strings`, () => {
      const empties: string[] = [];
      for (const [key, value] of Object.entries(flat[lang])) {
        if (typeof value === 'string' && value.trim() === '') empties.push(key);
        if (Array.isArray(value) && value.some((v) => v.trim() === '')) empties.push(key);
      }
      expect(empties).toEqual([]);
    });

    it(`${lang} covers every archetype, question, dimension and theme`, () => {
      for (const a of archetypes) {
        expect(flat[lang][`archetypes.${a.code}.name`]).toBeTruthy();
        expect(flat[lang][`archetypes.${a.code}.tagline`]).toBeTruthy();
        expect(flat[lang][`archetypes.${a.code}.description`]).toBeTruthy();
      }
      for (const q of questionIds) expect(flat[lang][`questions.${q}`]).toBeTruthy();
      for (const d of dimensionOrder) expect(flat[lang][`dimensions.${d}.name`]).toBeTruthy();
      for (const t of themes) expect(flat[lang][`themes.${t}`]).toBeTruthy();
    });
  }

  it('language files do not leak the English fallback where a translation exists', () => {
    // A handful of proper-noun keys are legitimately identical across languages.
    const allowedIdentical = new Set([
      'meta.code',
      'common.appName',
      'common.appFullName',
      'landing.title',
      'viz.pca.pc1',
      'viz.pca.pc2',
      'viz.dendro.ward',
      'cross.header', // pure "{archetype} · {sbti} · {zodiac}" format string
    ]);
    const suspicious: string[] = [];
    for (const [key, value] of Object.entries(flat.en)) {
      if (typeof value !== 'string') continue;
      if (allowedIdentical.has(key)) continue;
      // Only flag longer natural-language strings that are byte-identical in zh-CN.
      if (value.length > 12 && flat['zh-CN'][key] === value) suspicious.push(key);
    }
    expect(suspicious).toEqual([]);
  });
});
