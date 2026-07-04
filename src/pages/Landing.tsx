import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';
import { useAppStore } from '@/app/store';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import { visibleArchetypes } from '@/data/content';
import { EmblemGlyph } from '@/components/Emblem';

export function Landing() {
  const { t } = useI18n();
  const answeredCount = useAppStore((s) => s.answeredCount());
  const reduced = useReducedMotion();
  const hasProgress = answeredCount > 0;

  return (
    <div>
      <section className="hero-material relative overflow-hidden rounded-3xl border border-line px-6 py-14 sm:px-10 sm:py-20">
        <div className="relative z-10 max-w-2xl">
          <motion.p
            className="kicker mb-3"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {t('landing.kicker')}
          </motion.p>
          <motion.h1
            className="text-4xl font-semibold leading-tight sm:text-6xl"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            LBTI
          </motion.h1>
          <p className="mt-4 text-lg text-parchment/80">{t('landing.subtitle')}</p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-haze">{t('landing.lede')}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/intro" className="btn-primary px-6 text-base">
              {t('landing.cta')}
            </Link>
            {hasProgress && (
              <Link to="/test" className="btn-ghost px-6 text-base">
                {t('landing.ctaResume')}
              </Link>
            )}
            <Link to="/atlas" className="btn-quiet px-4 text-base">
              {t('landing.ctaAtlas')}
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-haze">
            <li>◆ {t('landing.runsLocally')}</li>
            <li>◆ {t('landing.noAccount')}</li>
            <li>◆ {t('landing.deterministic')}</li>
          </ul>
        </div>

        <FloatingEmblems reduced={reduced} />
      </section>

      <section className="mt-6 panel p-5 sm:p-6">
        <p className="kicker mb-1">{t('landing.pipelineTitle')}</p>
        <p className="font-mono text-sm text-parchment/80">{t('landing.pipelineFlow')}</p>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ['featureScienceTitle', 'featureScienceBody'],
          ['featurePrivacyTitle', 'featurePrivacyBody'],
          ['featurePlayTitle', 'featurePlayBody'],
        ].map(([title, body]) => (
          <div key={title} className="panel p-5">
            <h2 className="text-base font-semibold text-lumina-200">{t(`landing.${title}`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-parchment/75">{t(`landing.${body}`)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function FloatingEmblems({ reduced }: { reduced: boolean }) {
  const picks = visibleArchetypes.filter((_, i) => i % 4 === 0).slice(0, 4);
  const positions = [
    { top: '8%', right: '6%', size: 92 },
    { top: '46%', right: '20%', size: 64 },
    { top: '20%', right: '32%', size: 52 },
    { top: '66%', right: '4%', size: 78 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
      {picks.map((a, i) => (
        <motion.div
          key={a.code}
          className="absolute opacity-70"
          style={{ top: positions[i].top, right: positions[i].right }}
          initial={reduced ? false : { opacity: 0, scale: 0.8 }}
          animate={
            reduced
              ? { opacity: 0.6 }
              : { opacity: 0.7, y: [0, -8, 0] }
          }
          transition={{ duration: 6 + i, repeat: reduced ? 0 : Infinity, ease: 'easeInOut' }}
        >
          <EmblemGlyph emblem={a.emblem} code={a.code} size={positions[i].size} />
        </motion.div>
      ))}
    </div>
  );
}
