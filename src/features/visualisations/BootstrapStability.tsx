import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { useAppStore } from '@/app/store';
import { runBootstrap, type StabilityResult } from '@/features/scoring/bootstrap';
import { scoringConfig } from '@/data/content';
import type { Answers } from '@/features/scoring/types';

export function BootstrapStability({ answers }: { answers: Answers }) {
  const { t } = useI18n();
  const reducedCompute = useAppStore((s) => s.settings.reducedCompute);
  const options = scoringConfig.bootstrap.options;
  const [replicates, setReplicates] = useState(
    reducedCompute ? options[0] : scoringConfig.bootstrap.defaultReplicates,
  );
  const [result, setResult] = useState<StabilityResult | null>(null);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const run = useCallback(
    (n: number) => {
      setRunning(true);
      // Prefer a Web Worker so large runs never block the UI; fall back to sync.
      try {
        const worker = new Worker(new URL('../../workers/bootstrap.worker.ts', import.meta.url), {
          type: 'module',
        });
        workerRef.current = worker;
        worker.onmessage = (e: MessageEvent<StabilityResult>) => {
          setResult(e.data);
          setRunning(false);
          worker.terminate();
          workerRef.current = null;
        };
        worker.onerror = () => {
          setResult(runBootstrap(answers, n));
          setRunning(false);
          worker.terminate();
          workerRef.current = null;
        };
        worker.postMessage({ answers, replicates: n });
      } catch {
        setResult(runBootstrap(answers, n));
        setRunning(false);
      }
    },
    [answers],
  );

  useEffect(() => {
    run(replicates);
    return () => workerRef.current?.terminate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const bars = result
    ? Object.entries(result.frequencies)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];
  const maxFreq = bars.length ? bars[0][1] : 1;

  return (
    <ChartFrame
      title={t('viz.bootstrap.title')}
      description={t('viz.bootstrap.plain')}
      summary={
        result
          ? t('viz.bootstrap.summary', {
              n: result.replicates,
              primary: t(`archetypes.${result.primary}.name`),
              stability: Math.round(result.stability * 100),
            })
          : t('viz.bootstrap.running')
      }
      controls={
        <div className="flex items-center gap-1">
          {options.map((n) => (
            <button
              key={n}
              className={`rounded px-2 py-1 text-xs ${replicates === n ? 'bg-lumina-400 text-void' : 'text-haze'}`}
              onClick={() => {
                setReplicates(n);
                run(n);
              }}
              aria-pressed={replicates === n}
              disabled={running}
            >
              {n}
            </button>
          ))}
        </div>
      }
      table={
        result && (
          <table className="w-full text-left text-xs">
            <thead><tr className="text-haze"><th className="py-1 pr-3">Archetype</th><th className="py-1">Assignment %</th></tr></thead>
            <tbody>
              {bars.map(([code, freq]) => (
                <tr key={code} className="border-t border-line/60">
                  <td className="py-1 pr-3">{t(`archetypes.${code}.name`)}</td>
                  <td className="py-1 font-mono">{Math.round(freq * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    >
      {running && !result && <p className="py-6 text-center text-sm text-haze animate-pulse">{t('viz.bootstrap.running')}</p>}
      {result && (
        <div>
          <p className="mb-2 text-xs font-medium text-haze">{t('viz.bootstrap.assignment')}</p>
          <ul className="space-y-1.5">
            {bars.map(([code, freq]) => (
              <li key={code} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 truncate text-parchment/80" title={t(`archetypes.${code}.name`)}>
                  {t(`archetypes.${code}.name`)}
                </span>
                <span className="relative h-4 flex-1 overflow-hidden rounded bg-slate850/60">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded"
                    style={{ background: code === result.primary ? '#c26d10' : '#2f6fb0' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(freq / maxFreq) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </span>
                <span className="w-9 shrink-0 text-right font-mono text-haze">{Math.round(freq * 100)}%</span>
              </li>
            ))}
          </ul>

          <p className="mb-1 mt-4 text-xs font-medium text-haze">{t('viz.bootstrap.unstableDims')}</p>
          <div className="flex flex-wrap gap-1.5">
            {result.dimensionVariability.slice(0, 4).map((d) => (
              <span key={d.id} className="rounded bg-slate850/60 px-2 py-1 text-[11px] text-parchment/75">
                {t(`dimensions.${d.id}.name`)} <span className="font-mono text-haze">±{d.std.toFixed(1)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="mt-3 rounded-lg border border-line bg-slate850/40 px-3 py-2 text-[11px] leading-relaxed text-haze">
        {t('viz.bootstrap.note')}
      </p>
    </ChartFrame>
  );
}
