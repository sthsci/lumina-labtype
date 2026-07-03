import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import {
  buildCrossInterpretation,
  SBTI_TYPES,
  ZODIAC_SIGNS,
} from '@/features/results/crossInterpretation';
import type { ScoreResult } from '@/features/scoring/types';

/**
 * LBTI × SBTI × zodiac cross-reading. LBTI is the analytical subject; SBTI and
 * zodiac are self-selected narrative layers that only change the wording.
 */
export function CrossInterpretation({ result }: { result: ScoreResult }) {
  const { t, lang } = useI18n();
  const [sbti, setSbti] = useState('');
  const [zodiac, setZodiac] = useState('');

  const reading = useMemo(
    () => buildCrossInterpretation(result, sbti, zodiac, lang),
    [result, sbti, zodiac, lang],
  );

  const selectClass =
    'min-w-0 rounded-lg border border-line bg-white/[0.03] px-3 py-2 text-sm text-parchment focus:border-lumina-400/60 focus:outline-none';

  return (
    <section className="panel p-5 sm:p-6" aria-label={t('cross.title')}>
      <h2 className="text-lg font-semibold">{t('cross.title')}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-haze">{t('cross.subtitle')}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-haze">
          {t('cross.selectLbti')}
          <span className={`${selectClass} flex items-center gap-2`}>
            <span className="font-mono text-amber-glow">{result.primary}</span>
            <span className="truncate">{t(`archetypes.${result.primary}.name`)}</span>
          </span>
        </label>
        <label className="flex flex-col gap-1 text-xs text-haze">
          {t('cross.selectSbti')}
          <select className={selectClass} value={sbti} onChange={(e) => setSbti(e.target.value)}>
            <option value="">{t('cross.none')}</option>
            {SBTI_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-haze">
          {t('cross.selectZodiac')}
          <select className={selectClass} value={zodiac} onChange={(e) => setZodiac(e.target.value)}>
            <option value="">{t('cross.none')}</option>
            {ZODIAC_SIGNS.map((sign) => (
              <option key={sign} value={sign}>
                {t(`cross.zodiac.${sign}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-4 font-mono text-xs text-lumina-200">{reading.header}</p>

      <dl className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {reading.aspects.map((aspect) => (
          <div key={aspect.id} className="rounded-xl border border-line bg-white/[0.02] p-4">
            <dt className="text-sm font-semibold text-parchment">{aspect.title}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-parchment/80">{aspect.text}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-[11px] leading-relaxed text-haze">
        {t('cross.disclaimer')}
      </p>
    </section>
  );
}
