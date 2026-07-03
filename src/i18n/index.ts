import en from '@/data/translations/en.json';
import zhCN from '@/data/translations/zh-CN.json';
import zhTW from '@/data/translations/zh-TW.json';
import { TranslationFileSchema, type TranslationFile } from '@/data/schemas';

export type LanguageCode = 'en' | 'zh-CN' | 'zh-TW';

export const DEFAULT_LANGUAGE: LanguageCode = 'zh-CN';

/** Raw translation resources, validated against the schema at load. */
export const translations: Record<LanguageCode, TranslationFile> = {
  en: TranslationFileSchema.parse(en),
  'zh-CN': TranslationFileSchema.parse(zhCN),
  'zh-TW': TranslationFileSchema.parse(zhTW),
};

export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
];

export function isLanguageCode(value: string | null): value is LanguageCode {
  return value === 'en' || value === 'zh-CN' || value === 'zh-TW';
}

/** Resolve a dotted key path against a translation object. Returns undefined if absent. */
export function resolvePath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
