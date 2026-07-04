import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';
import { useAppStore } from '@/app/store';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import { PipelineStageArt } from '@/features/pipeline/PipelineStageArt';

const STAGES = [
  'acquire',
  'qc',
  'vector',
  'normalise',
  'project',
  'neighbourhood',
  'distance',
  'stability',
  'annotate',
] as const;

export function Pipeline() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const answers = useAppStore((s) => s.answers);
  const answeredCount = Object.keys(answers).length;
  const total = useAppStore((s) => s.computeResult().totalQuestions);

  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<number>();

  // stage timing: ~1.1s each normally, ~0.15s under reduced motion (<2s total)
  const stageMs = reduced ? 150 : 1100;

  useEffect(() => {
    if (answeredCount === 0) {
      navigate('/test', { replace: true });
    }
  }, [answeredCount, navigate]);

  useEffect(() => {
    if (done) return;
    timer.current = window.setTimeout(() => {
      setStage((s) => {
        if (s >= STAGES.length - 1) {
          setDone(true);
          return s;
        }
        return s + 1;
      });
    }, stageMs);
    return () => window.clearTimeout(timer.current);
  }, [stage, stageMs, done]);

  const detailVars = useMemo(
    () => ({ count: answeredCount, answered: answeredCount, total }),
    [answeredCount, total],
  );

  const skip = () => {
    window.clearTimeout(timer.current);
    navigate('/result', { replace: true });
  };

  const stageKey = STAGES[stage];
  const overallPct = Math.round(((stage + (done ? 1 : 0)) / STAGES.length) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('pipeline.title')}</h1>
          <p className="mt-1 text-sm text-haze">{t('pipeline.subtitle')}</p>
        </div>
        <button type="button" className="btn-ghost" onClick={skip}>
          {t('pipeline.skip')} →
        </button>
      </div>

      <div
        className="mb-5 h-1.5 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuenow={overallPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div className="h-full bg-lumina-400" animate={{ width: `${overallPct}%` }} />
      </div>

      <div className="panel overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="h-40 w-full max-w-sm">
            <PipelineStageArt stage={stageKey} reduced={reduced} />
          </div>
          <div aria-live="polite">
            <p className="kicker">{t('pipeline.stageLabel', { current: stage + 1, total: STAGES.length })}</p>
            <h2 className="mt-2 text-xl font-semibold text-parchment">
              {t(`pipeline.stages.${stageKey}.title`)}
            </h2>
            <p className="mt-1 text-sm text-lumina-200">{t(`pipeline.stages.${stageKey}.subtitle`)}</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-parchment/70">
              {t(`pipeline.stages.${stageKey}.detail`, detailVars)}
            </p>
          </div>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-3 gap-1.5 sm:grid-cols-9" aria-hidden="true">
        {STAGES.map((s, i) => (
          <li
            key={s}
            className={`h-1 rounded-full transition-colors ${
              i <= stage ? 'bg-lumina-400' : 'bg-ink/10'
            }`}
          />
        ))}
      </ol>

      {done && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-lumina-200" role="status">
            {t('pipeline.done')}
          </p>
          <button type="button" className="btn-primary px-8 text-base" onClick={() => navigate('/result')}>
            {t('pipeline.reveal')}
          </button>
        </div>
      )}
    </div>
  );
}
