import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';
import { useAppStore } from '@/app/store';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import { questionIds } from '@/data/content';

export function QuestionFlow() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const answers = useAppStore((s) => s.answers);
  const cursor = useAppStore((s) => s.cursor);
  const setAnswer = useAppStore((s) => s.setAnswer);
  const setCursor = useAppStore((s) => s.setCursor);

  const total = questionIds.length;
  const index = Math.min(cursor, total - 1);
  const questionId = questionIds[index];
  const answeredCount = Object.keys(answers).length;
  const current = answers[questionId];

  const goNext = useCallback(() => {
    if (index < total - 1) setCursor(index + 1);
  }, [index, total, setCursor]);

  const goPrev = useCallback(() => {
    if (index > 0) setCursor(index - 1);
  }, [index, setCursor]);

  const jumpUnanswered = useCallback(() => {
    const next = questionIds.findIndex((id, i) => i !== index && answers[id] === undefined);
    if (next >= 0) setCursor(next);
  }, [answers, index, setCursor]);

  const choose = useCallback(
    (value: number) => {
      setAnswer(questionId, value);
      // auto-advance shortly after answering (unless it's the last question)
      if (index < total - 1) {
        window.setTimeout(() => setCursor(index + 1), reduced ? 0 : 220);
      }
    },
    [questionId, setAnswer, index, total, setCursor, reduced],
  );

  // keyboard: 1..5 to answer, arrows to move
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '5') {
        choose(Number(e.key));
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [choose, goNext, goPrev]);

  const progressPct = Math.round((answeredCount / total) * 100);
  const allAnswered = answeredCount === total;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-haze">
          <span>{t('question.progress', { current: index + 1, total })}</span>
          <span>{t('question.answeredCount', { answered: answeredCount, total })}</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <motion.div
            className="h-full rounded-full bg-lumina-400"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: reduced ? 0 : 0.4 }}
          />
        </div>
      </div>

      <motion.div
        key={questionId}
        initial={reduced ? false : { opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reduced ? 0 : 0.22 }}
        className="panel specimen-card p-6 sm:p-8"
      >
        <p className="kicker mb-3">{t('question.instruction')}</p>
        <p className="min-h-[4.5rem] text-xl font-medium leading-snug text-parchment sm:text-2xl">
          {t(`questions.${questionId}`)}
        </p>

        <div className="mt-5 rounded-xl border border-line bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
          <p className="kicker mb-2 text-[10px] text-amber-glow/80">{t('question.exampleLabel')}</p>
          <p className="text-sm leading-relaxed text-parchment/75">{t(`question.examples.${questionId}`)}</p>
        </div>

        <div
          className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-5"
          role="radiogroup"
          aria-label={t('question.instruction')}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={current === value}
              onClick={() => choose(value)}
              className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center text-xs transition-all ${
                current === value
                  ? 'border-lumina-400 bg-lumina-400/20 text-parchment'
                  : 'border-line bg-white/[0.02] text-haze hover:border-lumina-400/40 hover:text-parchment'
              }`}
            >
              <span className="font-mono text-base text-lumina-200">{value}</span>
              <span className="leading-tight">{t(`question.scaleShort.${value}`)}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn-ghost" onClick={goPrev} disabled={index === 0}>
          ← {t('common.previous')}
        </button>

        <div className="flex items-center gap-2">
          {!allAnswered && (
            <button type="button" className="btn-quiet" onClick={jumpUnanswered}>
              {t('question.jumpUnanswered')}
            </button>
          )}
          {index < total - 1 ? (
            <button type="button" className="btn-ghost" onClick={goNext}>
              {t('common.next')} →
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/pipeline')}
              disabled={answeredCount === 0}
            >
              {allAnswered ? t('question.finishReady') : t('question.finishEarly')}
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-haze">{t('question.autosave')}</p>
    </div>
  );
}
