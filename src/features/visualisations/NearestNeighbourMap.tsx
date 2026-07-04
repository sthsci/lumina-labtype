import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import { EmblemGlyph } from '@/components/Emblem';
import { archetypeByCode } from '@/data/content';
import { SIGNAL } from './palette';
import type { ArchetypeDistance, ScoreResult } from '@/features/scoring/types';

type Metric = 'weighted' | 'cosine' | 'pearson' | 'spearman';
const METRICS: Metric[] = ['weighted', 'cosine', 'pearson', 'spearman'];

const CX = 170;
const CY = 150;
const R = 110;

export function NearestNeighbourMap({ result }: { result: ScoreResult }) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const [metric, setMetric] = useState<Metric>('weighted');

  const neighbours = useMemo(() => {
    const visible = result.distances.filter((d) => !d.hidden);
    const higherIsCloser = metric !== 'weighted';
    const sorted = [...visible].sort((a, b) =>
      higherIsCloser ? (b[metric] as number) - (a[metric] as number) : (a[metric] as number) - (b[metric] as number),
    );
    const top = sorted.slice(0, 5);
    // normalise to a 0..1 "closeness" for edge width
    const values = top.map((d) => d[metric] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return top.map((d, i) => {
      const raw = d[metric] as number;
      const closeness = higherIsCloser ? (raw - min) / span : 1 - (raw - min) / span;
      return { d, closeness, rank: i + 1 };
    });
  }, [result.distances, metric]);

  const angle = (i: number, n: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const fmt = (d: ArchetypeDistance) =>
    metric === 'weighted' ? (d.weighted as number).toFixed(1) : (d[metric] as number).toFixed(2);

  return (
    <ChartFrame
      title={t('viz.neighbour.title')}
      description={t('viz.neighbour.plain')}
      summary={t('viz.neighbour.summary', {
        metric: t(`viz.metrics.${metric}`),
        list: neighbours.map((nb) => t(`archetypes.${nb.d.code}.name`)).join(', '),
      })}
      controls={
        <div className="flex flex-wrap gap-1">
          {METRICS.map((m) => (
            <button
              key={m}
              className={`rounded px-2 py-1 text-xs ${metric === m ? 'bg-lumina-400 text-void' : 'text-haze hover:text-parchment'}`}
              onClick={() => setMetric(m)}
              aria-pressed={metric === m}
            >
              {t(`viz.metrics.${m}`)}
            </button>
          ))}
        </div>
      }
      table={
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-haze"><th className="py-1 pr-3">#</th><th className="py-1 pr-3">Archetype</th><th className="py-1">{t(`viz.metrics.${metric}`)}</th></tr>
          </thead>
          <tbody>
            {neighbours.map((nb) => (
              <tr key={nb.d.code} className="border-t border-line/60">
                <td className="py-1 pr-3 font-mono">{nb.rank}</td>
                <td className="py-1 pr-3">{t(`archetypes.${nb.d.code}.name`)}</td>
                <td className="py-1 font-mono">{fmt(nb.d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <p className="mb-1 text-center text-[11px] text-haze">{t('viz.neighbour.edgeNote')}</p>
      <svg viewBox="0 0 340 300" className="mx-auto w-full max-w-md" role="img" aria-label={t('viz.neighbour.title')}>
        {neighbours.map((nb, i) => {
          const ax = CX + Math.cos(angle(i, neighbours.length)) * R;
          const ay = CY + Math.sin(angle(i, neighbours.length)) * R;
          return (
            <motion.line
              key={nb.d.code}
              x1={CX}
              y1={CY}
              x2={ax}
              y2={ay}
              stroke={SIGNAL.user}
              strokeOpacity={0.25 + nb.closeness * 0.6}
              strokeWidth={1 + nb.closeness * 5}
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : i * 0.08 }}
            />
          );
        })}
        {neighbours.map((nb, i) => {
          const ax = CX + Math.cos(angle(i, neighbours.length)) * R;
          const ay = CY + Math.sin(angle(i, neighbours.length)) * R;
          const a = archetypeByCode.get(nb.d.code)!;
          return (
            <g key={nb.d.code}>
              <circle cx={ax} cy={ay} r={17} fill="#ffffff" stroke="rgba(52,64,80,0.2)" />
              <g transform={`translate(${ax - 15}, ${ay - 15})`}>
                <EmblemGlyph emblem={a.emblem} code={nb.d.code} size={30} />
              </g>
              <text x={ax} y={ay + 27} fontSize={7.5} fill="#262b31" textAnchor="middle">{nb.d.code}</text>
              <text x={ax} y={ay + 36} fontSize={6.5} fill="#5d6570" textAnchor="middle" className="font-mono">
                {fmt(nb.d)}
              </text>
            </g>
          );
        })}
        <circle cx={CX} cy={CY} r={20} fill={SIGNAL.user} fillOpacity={0.15} stroke={SIGNAL.user} />
        <text x={CX} y={CY + 3} fontSize={9} fill={SIGNAL.user} textAnchor="middle" fontWeight="bold">
          {t('common.you')}
        </text>
      </svg>
    </ChartFrame>
  );
}
