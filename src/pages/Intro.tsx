import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useI18n } from '@/i18n/I18nProvider';

export function Intro() {
  const { t } = useI18n();
  const steps = ['howStep1', 'howStep2', 'howStep3', 'howStep4'];
  return (
    <div className="max-w-3xl">
      <PageHeader kicker={t('common.fictionalBadge')} title={t('intro.title')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-lg font-semibold text-lumina-200">{t('intro.whatTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-parchment/80">{t('intro.whatBody')}</p>
        </section>
        <section className="panel p-5">
          <h2 className="text-lg font-semibold text-amber-glow">{t('intro.whatNotTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-parchment/80">{t('intro.whatNotBody')}</p>
        </section>
      </div>

      <section className="panel mt-4 p-5">
        <h2 className="text-lg font-semibold">{t('intro.howTitle')}</h2>
        <ol className="mt-3 space-y-2.5">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-parchment/80">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-lumina-400/50 font-mono text-xs text-lumina-200">
                {i + 1}
              </span>
              <span className="pt-0.5">{t(`intro.${step}`)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel mt-4 p-5">
        <h2 className="text-lg font-semibold">{t('intro.scaleTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-parchment/80">{t('intro.scaleBody')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <span key={v} className="rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-xs text-haze">
              {t(`question.scale.${v}`)}
            </span>
          ))}
        </div>
      </section>

      <p className="mt-4 text-xs text-haze">{t('intro.privacyNote')}</p>

      <div className="mt-6">
        <Link to="/context" className="btn-primary px-6 text-base">
          {t('intro.cta')}
        </Link>
      </div>
    </div>
  );
}
