import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { interpolate, hasUnresolvedMarkers, type TemplateVars } from '@/lib/templates/templates';
import { loadLanguage, saveLanguage } from '@/lib/storage/storage';
import {
  DEFAULT_LANGUAGE,
  isLanguageCode,
  resolvePath,
  translations,
  type LanguageCode,
} from './index';

interface I18nContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  /** Translate a dotted key, optionally interpolating {vars}. */
  t: (key: string, vars?: TemplateVars) => string;
  /** Return a raw value (string | string[] | object) for a key. */
  raw: <T = unknown>(key: string) => T;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitialLanguage(): LanguageCode {
  const stored = loadLanguage();
  if (isLanguageCode(stored)) return stored;
  if (typeof navigator !== 'undefined') {
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith('zh')) return nav.includes('tw') || nav.includes('hk') ? 'zh-TW' : 'zh-CN';
    if (nav.startsWith('en')) return 'en';
  }
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(detectInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: LanguageCode) => {
    setLangState(next);
    saveLanguage(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: TemplateVars): string => {
      const value = resolvePath(translations[lang], key);
      if (typeof value !== 'string') {
        // Missing key: surface the key itself so it is visible in dev/tests.
        return key;
      }
      const out = vars ? interpolate(value, vars) : value;
      if (import.meta.env.DEV && hasUnresolvedMarkers(out)) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] unresolved marker in "${key}": ${out}`);
      }
      return out;
    },
    [lang],
  );

  const raw = useCallback(
    <T,>(key: string): T => resolvePath(translations[lang], key) as T,
    [lang],
  );

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t, raw }), [lang, setLang, t, raw]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
