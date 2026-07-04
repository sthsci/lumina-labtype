import { useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { SIGNAL } from './palette';
import type { ScoreResult } from '@/features/scoring/types';

const W = 340;
const H = 260;
const PAD = 34;

export function ContributionPlot({ result }: { result: ScoreResult }) {
  const { t } = useI18n();
  const [hover, setHover] = useState<string | null>(null);

  const points = result.contributions;
  const maxAbs = Math.max(0.1, ...points.map((p) => Math.abs(p.contribution)));
  const maxMag = Math.max(0.1, ...points.map((p) => p.magnitude));

  const x = scaleLinear([-maxAbs, maxAbs], [PAD, W - PAD]);
  const y = scaleLinear([0, maxMag], [H - PAD, PAD]);

  const topSupport = useMemo(() => {
    const supporting = points.filter((p) => p.contribution > 0);
    return supporting.length ? supporting[0] : points[0];
  }, [points]);

  const kind = (c: number) => (c > 0.05 ? 'pos' : c < -0.05 ? 'neg' : 'neu');
  const color = (c: number) => (kind(c) === 'pos' ? SIGNAL.positive : kind(c) === 'neg' ? SIGNAL.negative : SIGNAL.neutral);

  const hovered = points.find((p) => p.id === hover);

  return (
    <ChartFrame
      title={t('viz.contribution.title')}
      description={t('viz.contribution.plain')}
      summary={t('viz.contribution.summary', {
        primary: t(`archetypes.${result.primary}.name`),
        topSupport: t(`questions.${topSupport.id}`),
      })}
      table={
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-haze"><th className="py-1 pr-3">Question</th><th className="py-1 pr-3">Contribution</th><th className="py-1">Answer</th></tr>
          </thead>
          <tbody>
            {points.slice(0, 12).map((p) => (
              <tr key={p.id} className="border-t border-line/60">
                <td className="max-w-[220px] truncate py-1 pr-3" title={t(`questions.${p.id}`)}>{t(`questions.${p.id}`)}</td>
                <td className="py-1 pr-3 font-mono" style={{ color: color(p.contribution) }}>{p.contribution.toFixed(2)}</td>
                <td className="py-1 font-mono">{p.answer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-lg" role="img" aria-label={t('viz.contribution.title')}>
        <line x1={x(0)} y1={PAD} x2={x(0)} y2={H - PAD} stroke="rgba(52,64,80,0.25)" strokeDasharray="3 3" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="rgba(52,64,80,0.2)" />
        <text x={W - PAD} y={H - 8} fontSize={8} fill="#5d6570" textAnchor="end">→ {t('viz.contribution.supporting')}</text>
        <text x={PAD} y={H - 8} fontSize={8} fill="#5d6570" textAnchor="start">{t('viz.contribution.opposing')} ←</text>
        <text x={10} y={PAD} fontSize={7.5} fill="#5d6570" transform={`rotate(-90 10 ${PAD + 40})`}>{t('viz.contribution.yAxis')}</text>

        {points.map((p) => (
          <circle
            key={p.id}
            cx={x(p.contribution)}
            cy={y(p.magnitude)}
            r={hover === p.id ? 6 : 4}
            fill={color(p.contribution)}
            fillOpacity={0.8}
            stroke={hover === p.id ? '#22262c' : 'none'}
            strokeWidth={0.8}
            tabIndex={0}
            role="img"
            aria-label={`${t(`questions.${p.id}`)}: ${p.contribution.toFixed(2)}`}
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(p.id)}
            onBlur={() => setHover(null)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </svg>
      {hovered && (
        <p className="mt-1 rounded bg-slate850/50 px-3 py-2 text-xs text-parchment/80">
          <span className="font-mono" style={{ color: color(hovered.contribution) }}>
            {hovered.contribution > 0 ? '+' : ''}{hovered.contribution.toFixed(2)}
          </span>{' '}
          — {t(`questions.${hovered.id}`)}
        </p>
      )}
      <div className="mt-2 flex justify-center gap-4 text-xs text-haze">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SIGNAL.positive }} />{t('viz.contribution.supporting')}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SIGNAL.negative }} />{t('viz.contribution.opposing')}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SIGNAL.neutral }} />{t('viz.contribution.neutral')}</span>
      </div>
    </ChartFrame>
  );
}
