import { describe, expect, test } from 'vitest';
import { archetypes } from '@/data/content';
import { LANGUAGES } from '@/i18n';
import { SHARE_COPY } from './shareCopy';

const codes = archetypes.map((a) => a.code);

describe('share-card copy', () => {
  test('covers every archetype in every supported language', () => {
    for (const { code: lang } of LANGUAGES) {
      expect(Object.keys(SHARE_COPY[lang]).sort()).toEqual([...codes].sort());
      for (const code of codes) {
        const copy = SHARE_COPY[lang][code];
        expect(copy.headline).toBeTruthy();
        expect(copy.tagline).toBeTruthy();
        expect(copy.traits).toHaveLength(3);
        expect(copy.warning).toBeTruthy();
        expect(copy.advice).toBeTruthy();
        expect(copy.quote).toBeTruthy();
      }
    }
  });

  test('does not reuse taglines or share quotes within a language', () => {
    for (const { code: lang } of LANGUAGES) {
      const copies = codes.map((code) => SHARE_COPY[lang][code]);
      expect(new Set(copies.map((c) => c.tagline)).size).toBe(copies.length);
      expect(new Set(copies.map((c) => c.quote)).size).toBe(copies.length);
    }
  });

  test('keeps exported-card strings short enough for the four formats', () => {
    for (const { code: lang } of LANGUAGES) {
      const isEnglish = lang === 'en';
      for (const code of codes) {
        const copy = SHARE_COPY[lang][code];
        expect(copy.headline.length, `${lang}/${code} headline`).toBeLessThanOrEqual(isEnglish ? 42 : 14);
        expect(copy.tagline.length, `${lang}/${code} tagline`).toBeLessThanOrEqual(isEnglish ? 86 : 40);
        expect(copy.quote.length, `${lang}/${code} quote`).toBeLessThanOrEqual(isEnglish ? 62 : 28);
        for (const trait of copy.traits) {
          expect(trait.length, `${lang}/${code} trait`).toBeLessThanOrEqual(isEnglish ? 34 : 20);
        }
        expect(copy.warning.length, `${lang}/${code} warning`).toBeLessThanOrEqual(isEnglish ? 88 : 38);
        expect(copy.advice.length, `${lang}/${code} advice`).toBeLessThanOrEqual(isEnglish ? 92 : 42);
      }
    }
  });

  test('does not use banned report-card labels in share copy', () => {
    const banned = ['交付方式', '贡献方式', '項目弧線', '项目弧线', '核心维度', '核心維度', '人格特征', '人格特徵', '综合得分', '綜合得分'];
    for (const { code: lang } of LANGUAGES) {
      for (const code of codes) {
        const text = Object.values(SHARE_COPY[lang][code]).flat().join(' ');
        for (const word of banned) expect(text).not.toContain(word);
      }
    }
  });
});
