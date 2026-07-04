import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';
import { useAppStore } from '@/app/store';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import { useResult } from '@/features/results/useResult';
import { composeResultProse } from '@/features/results/compose';
import { runBootstrap } from '@/features/scoring/bootstrap';
import { archetypeByCode } from '@/data/content';
import { EmblemGlyph } from '@/components/Emblem';
import { groupColor } from '@/features/visualisations/palette';
import { RadarChart } from '@/features/visualisations/RadarChart';
import { ResponseHeatmap } from '@/features/visualisations/ResponseHeatmap';
import { PCAProjection } from '@/features/visualisations/PCAProjection';
import { NearestNeighbourMap } from '@/features/visualisations/NearestNeighbourMap';
import { ContributionPlot } from '@/features/visualisations/ContributionPlot';
import { ThemeDotPlot } from '@/features/visualisations/ThemeDotPlot';
import { SankeyFlow } from '@/features/visualisations/SankeyFlow';
import { SimilarityMatrix } from '@/features/visualisations/SimilarityMatrix';
import { EntropyGauge } from '@/features/visualisations/EntropyGauge';
import { BootstrapStability } from '@/features/visualisations/BootstrapStability';
import { DecisionPlayground } from '@/features/visualisations/DecisionPlayground';
import { ShareCard } from '@/features/sharing/ShareCard';
import { CrossInterpretation } from '@/features/results/CrossReadingPanel';
import { insertCohortRecord, isSupabaseConfigured, mapResultToInsert } from '@/features/cohort/cohortDb';
import { loadCohortCache } from '@/features/cohort/cohortStorage';
import type { ScoreResult } from '@/features/scoring/types';

export function Result() {
  const result = useResult();
  const { t } = useI18n();

  if (!result) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-2xl font-semibold">{t('mllab.noResultTitle')}</h1>
        <p className="mt-3 text-haze">{t('mllab.noResultBody')}</p>
        <Link to="/intro" className="btn-primary mt-6 inline-flex px-6">
          {t('landing.cta')}
        </Link>
      </div>
    );
  }
  return <ResultContent result={result} />;
}

function ResultContent({ result }: { result: ScoreResult }) {
  const { t, lang, raw } = useI18n();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const answers = useAppStore((s) => s.answers);
  const context = useAppStore((s) => s.context);
  const resetTest = useAppStore((s) => s.resetTest);
  const clearAllData = useAppStore((s) => s.clearAllData);
  const [deleted, setDeleted] = useState(false);
  const [cohortState, setCohortState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'unconfigured'>(
    'idle',
  );
  const [cohortError, setCohortError] = useState('');

  const archetype = archetypeByCode.get(result.primary)!;
  const secondaryArchetype = archetypeByCode.get(result.secondary)!;

  // A small deterministic sync bootstrap feeds the prose; the interactive
  // stability panel below runs its own (larger) resampling in a Web Worker.
  const quickStability = useMemo(() => runBootstrap(answers, 100).stability * 100, [answers]);

  const prose = useMemo(
    () => composeResultProse(result, context, lang, { stabilityPercent: quickStability }),
    [result, context, lang, quickStability],
  );

  const topDims = useMemo(
    () =>
      result.dimensionScores
        .map((d, i) => ({ id: d.id, dev: Math.abs(result.scores[i] - 50) }))
        .sort((a, b) => b.dev - a.dev)
        .slice(0, 3)
        .map((d) => t(`dimensions.${d.id}.name`)),
    [result, t],
  );

  const supporting = result.contributions.filter((c) => c.contribution > 0).slice(0, 3);
  const opposing = result.contributions
    .filter((c) => c.contribution < 0)
    .sort((a, b) => a.contribution - b.contribution)
    .slice(0, 3);

  const visibleRanked = result.distances.filter((d) => !d.hidden).slice(0, 5);
  const cohortPercentile = useMemo(() => {
    const margins = loadCohortCache()
      .map((record) => record.classificationMargin)
      .filter((margin) => Number.isFinite(margin));
    if (margins.length < 5) return null;
    const atOrBelow = margins.filter((margin) => margin <= result.classificationMargin).length;
    return Math.round((atOrBelow / margins.length) * 100);
  }, [result.classificationMargin]);

  const restart = () => {
    resetTest();
    navigate('/test');
  };
  const deleteAll = () => {
    if (window.confirm(t('result.deleteConfirm'))) {
      clearAllData();
      setDeleted(true);
      navigate('/');
    }
  };
  const recordForCohort = async () => {
    if (cohortState === 'saving' || cohortState === 'saved') return; // guard double-click
    if (!isSupabaseConfigured) {
      setCohortState('unconfigured');
      return;
    }
    setCohortState('saving');
    setCohortError('');
    try {
      await insertCohortRecord(mapResultToInsert(result, context));
      setCohortState('saved');
    } catch (err) {
      setCohortError(err instanceof Error ? err.message : String(err));
      setCohortState('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* screen-reader lead summary */}
      <p className="sr-only">
        {t('result.readAloudSummary', {
          primary: t(`archetypes.${result.primary}.name`),
          secondary: t(`archetypes.${result.secondary}.name`),
          dims: topDims.join(', '),
        })}
      </p>

      {!result.complete && (
        <p className="rounded-xl border border-amber-glow/40 bg-amber-glow/10 px-4 py-3 text-sm text-amber-glow" role="status">
          {t('result.incompleteWarning')}
        </p>
      )}

      {/* hero */}
      <section className="panel panel-grid relative overflow-hidden p-6 sm:p-10">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <motion.div
            initial={reduced ? false : { scale: 0.6, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: reduced ? 0 : 0.7, ease: 'easeOut' }}
            className="shrink-0"
          >
            <EmblemGlyph emblem={archetype.emblem} code={result.primary} size={150} title={result.primary} className="drop-shadow-emblem" />
          </motion.div>
          <div className="min-w-0">
            <p className="kicker">{t('result.kicker')}</p>
            {result.hidden.triggered && (
              <p className="mt-2 inline-block rounded-full border border-amber-glow/50 bg-amber-glow/10 px-3 py-1 text-xs text-amber-glow">
                ★ {t('result.hiddenUnlocked')} — {t('result.hiddenNote')}
              </p>
            )}
            <h1 className="mt-2 flex flex-wrap items-baseline justify-center gap-x-3 sm:justify-start">
              <span className="font-mono text-lg tracking-[0.3em] text-amber-glow" data-testid="archetype-code">
                {result.primary}
              </span>
              <span className="text-3xl font-semibold sm:text-5xl">{t(`archetypes.${result.primary}.name`)}</span>
            </h1>
            <p className="mt-2 text-lg text-lumina-200">{t(`archetypes.${result.primary}.tagline`)}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Stat label={t('result.matchStrength')} value={`${result.matchStrength}`} note={t('result.matchStrengthNote')} />
              <Stat label={t('result.classificationMargin')} value={result.classificationMargin.toFixed(2)} />
              <Stat label={t('result.profileStability')} value={`${Math.round(quickStability)}%`} />
              <Stat
                label={t('result.cohortPercentile')}
                value={cohortPercentile === null ? '—' : `${cohortPercentile}%`}
                note={t(cohortPercentile === null ? 'result.cohortPercentileUnavailable' : 'result.cohortPercentileNote')}
              />
            </div>
            <p className="mt-4 text-sm text-haze">
              {t('result.secondaryIntro')}:{' '}
              <span className="font-mono text-parchment">{result.secondary}</span>{' '}
              <span className="text-parchment">{t(`archetypes.${result.secondary}.name`)}</span>
            </p>
          </div>
        </div>
      </section>

      {/* composed prose */}
      <section className="panel p-6">
        <div className="max-w-3xl space-y-3">
          {prose.map((p, i) => (
            <p key={i} className={`leading-relaxed ${i === 0 ? 'text-parchment/90' : 'text-sm text-parchment/75'}`}>
              {p}
            </p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {raw<string[]>(`archetypes.${result.primary}.keywords`).map((k) => (
            <span key={k} className="rounded-full border border-line bg-slate850/50 px-2.5 py-0.5 text-xs text-haze">
              #{k}
            </span>
          ))}
        </div>
      </section>

      {/* rankings + groups */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-base font-semibold">{t('result.topFive')}</h2>
          <ol className="mt-3 space-y-2">
            {visibleRanked.map((d, i) => (
              <li key={d.code} className="flex items-center gap-3 text-sm">
                <span className="w-5 font-mono text-haze">{i + 1}</span>
                <EmblemGlyph emblem={archetypeByCode.get(d.code)!.emblem} code={d.code} size={28} />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-mono text-xs text-haze">{d.code}</span>{' '}
                  <span className="text-parchment/90">{t(`archetypes.${d.code}.name`)}</span>
                </span>
                <span className="relative h-2 w-24 overflow-hidden rounded-full bg-slate850/70">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-lumina-400"
                    style={{ width: `${Math.round(d.similarity * 100)}%` }}
                  />
                </span>
                <span className="w-9 text-right font-mono text-xs text-haze">{Math.round(d.similarity * 100)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel p-5">
          <h2 className="text-base font-semibold">{t('result.fiveGroups')}</h2>
          <ul className="mt-3 space-y-3">
            {result.groupScores.map((g) => (
              <li key={g.id} className="text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-parchment/90">{t(`groups.${g.id}.name`)}</span>
                  <span className="font-mono text-xs text-haze">{Math.round(g.score)}</span>
                </div>
                <p className="text-xs text-haze">{t(`groups.${g.id}.description`)}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate850/70">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${g.score}%`, background: groupColor(g.id) }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* core visual story */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RadarChart result={result} />
        <ResponseHeatmap result={result} />
        <PCAProjection result={result} />
        <NearestNeighbourMap result={result} />
        <ContributionPlot result={result} />
        <ThemeDotPlot result={result} />
        <SankeyFlow result={result} />
        <SimilarityMatrix result={result} />
        <EntropyGauge result={result} />
        <BootstrapStability answers={answers} />
      </div>

      {/* strongest supporting / opposing answers */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <QuoteList title={t('result.supporting')} items={supporting.map((c) => ({ id: c.id, v: c.contribution }))} positive />
        <QuoteList title={t('result.opposing')} items={opposing.map((c) => ({ id: c.id, v: c.contribution }))} />
      </div>

      {/* archetype dossier */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-base font-semibold text-lumina-200">{t('result.strengths')}</h2>
          <BulletList items={raw<string[]>(`archetypes.${result.primary}.strengths`)} />
          <h2 className="mt-5 text-base font-semibold text-amber-glow">{t('result.blindSpots')}</h2>
          <BulletList items={raw<string[]>(`archetypes.${result.primary}.blindSpots`)} />
          <h2 className="mt-5 text-base font-semibold">{t('result.teamRole')}</h2>
          <p className="mt-1 text-sm text-parchment/80">{t(`archetypes.${result.primary}.teamRole`)}</p>
        </section>

        <section className="panel p-5">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-lumina-200">{t('result.idealCollaborator')}</dt>
              <dd className="mt-1 flex items-center gap-2 text-parchment/80">
                <EmblemGlyph emblem={archetypeByCode.get(archetype.idealCollaborator)!.emblem} code={archetype.idealCollaborator} size={26} />
                <span className="font-mono text-xs text-haze">{archetype.idealCollaborator}</span>
                {t(`archetypes.${archetype.idealCollaborator}.name`)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-amber-glow">{t('result.difficultCollaborator')}</dt>
              <dd className="mt-1 flex items-center gap-2 text-parchment/80">
                <EmblemGlyph emblem={archetypeByCode.get(archetype.difficultCollaborator)!.emblem} code={archetype.difficultCollaborator} size={26} />
                <span className="font-mono text-xs text-haze">{archetype.difficultCollaborator}</span>
                {t(`archetypes.${archetype.difficultCollaborator}.name`)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">{t('result.reviewerTwo')}</dt>
              <dd className="mt-1 text-parchment/80">{t(`archetypes.${result.primary}.reviewerTwo`)}</dd>
            </div>
            <div>
              <dt className="font-semibold">{t('result.failureMode')}</dt>
              <dd className="mt-1 text-parchment/80">{t(`archetypes.${result.primary}.failureMode`)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-lumina-200">{t('result.survivalAdvice')}</dt>
              <dd className="mt-1 text-parchment/80">{t(`archetypes.${result.primary}.survivalAdvice`)}</dd>
            </div>
            <div className="border-t border-line pt-3">
              <dt className="text-xs text-haze">{t('common.secondary')}</dt>
              <dd className="mt-1 flex items-center gap-2">
                <EmblemGlyph emblem={secondaryArchetype.emblem} code={result.secondary} size={30} />
                <div>
                  <span className="font-mono text-xs text-haze">{result.secondary}</span>{' '}
                  <span className="text-parchment/90">{t(`archetypes.${result.secondary}.name`)}</span>
                  <p className="text-xs text-haze">{t(`archetypes.${result.secondary}.tagline`)}</p>
                </div>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* cross-reading: LBTI × SBTI × zodiac */}
      <CrossInterpretation result={result} />

      {/* alternate universe */}
      <section id="alternate-universe">
        <DecisionPlayground result={result} />
      </section>

      {/* share */}
      <section className="panel p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{t('result.shareTitle')}</h2>
        <ShareCard result={result} />
      </section>

      {/* anonymous public cohort database */}
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold">{t('result.cohortTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-haze">{t('result.cohortBody')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={recordForCohort}
              disabled={cohortState === 'saving' || cohortState === 'saved'}
              data-testid="cohort-save"
            >
              {cohortState === 'saving'
                ? t('result.cohortSaving')
                : cohortState === 'saved'
                  ? t('result.cohortSaved')
                  : t('result.cohortSave')}
            </button>
            {cohortState === 'error' && (
              <button type="button" className="btn-ghost" onClick={recordForCohort}>
                {t('common.retry')}
              </button>
            )}
            <Link to="/cohort" className="btn-ghost">
              {t('result.openCohort')}
            </Link>
          </div>
        </div>
        {cohortState === 'saved' && (
          <p className="mt-3 text-sm text-lumina-200" role="status">
            {t('result.cohortSavedBody')}
          </p>
        )}
        {cohortState === 'error' && (
          <p className="mt-3 text-sm text-signal-pos" role="alert">
            {t('result.cohortError')} — {t('result.cohortErrorBody', { message: cohortError })}
          </p>
        )}
        {cohortState === 'unconfigured' && (
          <p className="mt-3 text-sm text-amber-glow" role="status">
            {t('result.cohortUnconfigured')}
          </p>
        )}
      </section>

      {/* actions */}
      <section className="flex flex-wrap items-center gap-3 pb-4">
        <Link to="/ml-lab" className="btn-primary">
          {t('result.openMlLab')}
        </Link>
        <a href="#alternate-universe" className="btn-ghost">
          {t('result.exploreUniverse')}
        </a>
        <button type="button" className="btn-ghost" onClick={restart}>
          {t('result.restartTest')}
        </button>
        <button type="button" className="btn-quiet text-signal-pos" onClick={deleteAll}>
          {t('result.deleteData')}
        </button>
        {deleted && (
          <span className="text-sm text-lumina-200" role="status">
            {t('result.deleted')}
          </span>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-slate850/50 px-3 py-2 text-left">
      <p className="text-[10px] uppercase tracking-wider text-haze">{label}</p>
      <p className="font-mono text-lg text-parchment">{value}</p>
      {note && <p className="max-w-[140px] text-[9px] leading-tight text-haze/80">{note}</p>}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-parchment/80">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lumina-300" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function QuoteList({
  title,
  items,
  positive = false,
}: {
  title: string;
  items: { id: string; v: number }[];
  positive?: boolean;
}) {
  const { t } = useI18n();
  return (
    <section className="panel p-5">
      <h2 className={`text-base font-semibold ${positive ? 'text-lumina-200' : 'text-amber-glow'}`}>{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {items.length === 0 && <li className="text-sm text-haze">—</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 text-sm">
            <span className={`shrink-0 font-mono text-xs ${positive ? 'text-lumina-300' : 'text-signal-pos'}`}>
              {item.v > 0 ? '+' : ''}
              {item.v.toFixed(2)}
            </span>
            <span className="text-parchment/80">“{t(`questions.${item.id}`)}”</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
