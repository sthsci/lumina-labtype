import { LANGUAGES } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      className="inline-flex rounded-lg border border-line bg-slate850/40 p-0.5"
      role="group"
      aria-label={t('common.language')}
    >
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            lang === l.code ? 'bg-lumina-400 text-void' : 'text-haze hover:text-parchment'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
