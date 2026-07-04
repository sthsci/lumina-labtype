import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import {
  buildCrossInterpretation,
  SBTI_TYPE_OPTIONS,
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
    'min-w-0 rounded-lg border border-line bg-slate850/50 px-3 py-2 text-sm text-parchment focus:border-lumina-400/60 focus:outline-none';

  return (
    <section className="panel p-5 sm:p-6" aria-label={t('cross.title')}>
      <h2 className="text-lg font-semibold">{t('cross.title')}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-haze">{t('cross.subtitle')}</p>
      <p className="mt-2 max-w-3xl text-xs leading-relaxed text-haze">
        <a
          href="https://sx349.github.io/sbti-interactive/"
          target="_blank"
          rel="noreferrer"
          className="text-lumina-200 underline decoration-lumina-200/35 underline-offset-4 hover:text-lumina-100"
        >
          SBTI
        </a>{' '}
        {t('cross.sbtiNote')}
      </p>
      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-haze">
        {t('cross.sbtiCreditLead')}{' '}
        <a
          href="https://space.bilibili.com/417038183"
          target="_blank"
          rel="noreferrer"
          className="text-lumina-200 underline decoration-lumina-200/35 underline-offset-4 hover:text-lumina-100"
        >
          {t('cross.sbtiOriginalAuthor')}
        </a>
        {t('cross.sbtiCreditMiddle')}{' '}
        <a
          href="https://github.com/sx349"
          target="_blank"
          rel="noreferrer"
          className="text-lumina-200 underline decoration-lumina-200/35 underline-offset-4 hover:text-lumina-100"
        >
          {t('cross.sbtiInteractiveDeveloper')}
        </a>
        {t('cross.sbtiCreditTail')}
      </p>

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
            {SBTI_TYPE_OPTIONS.map((type) => (
              <option key={type.code} value={type.code}>
                {type.code}（{type.cn}）
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

      <div className="mt-5 rounded-xl border border-lumina-400/25 bg-lumina-400/[0.055] p-4">
        <div className="flex flex-wrap gap-2">
          {reading.badges.map((badge) => (
            <span key={badge.label} className="rounded-full border border-line bg-slate850/60 px-2.5 py-1 text-[11px] text-haze">
              <span className="font-mono text-lumina-200">{badge.label}</span>{' '}
              <span className="text-parchment/85">{badge.value}</span>
            </span>
          ))}
        </div>
        <p className="mt-4 font-mono text-[11px] text-lumina-200">{reading.header}</p>
        <h3 className="mt-2 text-2xl font-semibold leading-tight text-parchment sm:text-3xl">
          {reading.combinationTitle}
        </h3>
        <p className="mt-2 max-w-3xl text-base leading-relaxed text-parchment/85">{reading.hook}</p>
      </div>

      <div className="mt-4 rounded-xl border border-amber-glow/25 bg-amber-glow/[0.045] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-glow/80">{t('cross.sections.openingScene')}</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-parchment/85">{reading.openingScene}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RichSection title={t('cross.sections.researchDecision')} body={reading.researchDecision} />
        <RichSection title={t('cross.sections.experimentDesign')} body={reading.experimentDesign} />
        <RichSection title={t('cross.sections.collaboration')} body={reading.collaboration} />
        <RichSection title={t('cross.sections.pressureResponse')} body={reading.pressureResponse} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <RichSection title={t('cross.sections.usefulContradiction')} body={reading.usefulContradiction} emphasis />
          <RichSection title={t('cross.sections.laboratoryRole')} body={reading.laboratoryRole} />
          <RichSection title={t('cross.sections.failureMode')} body={reading.failureMode} />
        </div>
        <div className="rounded-xl border border-line bg-slate850/40 p-4">
          <h3 className="text-sm font-semibold text-parchment">{t('cross.sections.survivalAdvice')}</h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-parchment/80">
            {reading.survivalAdvice.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lumina-300" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg border border-amber-glow/30 bg-amber-glow/[0.06] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-glow/80">{t('cross.sections.shareLine')}</p>
            <p className="mt-1 text-sm leading-relaxed text-parchment">{reading.shareLine}</p>
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-lg border border-line bg-slate850/40 px-3 py-2 text-[11px] leading-relaxed text-haze">
        {t('cross.disclaimer')}
      </p>
    </section>
  );
}

function RichSection({ title, body, emphasis = false }: { title: string; body: string; emphasis?: boolean }) {
  return (
    <section className={`rounded-xl border p-4 ${emphasis ? 'border-lumina-400/25 bg-lumina-400/[0.045]' : 'border-line bg-slate850/40'}`}>
      <h3 className="text-sm font-semibold text-parchment">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-parchment/80">{body}</p>
    </section>
  );
}
