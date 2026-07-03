import { useMemo, useState } from 'react';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import { motion } from 'framer-motion';
import { archetypeByCode, dimensionGroups, dimensionOrder, dimensions } from '@/data/content';
import { groupColor, SIGNAL } from './palette';
import type { ScoreResult } from '@/features/scoring/types';

interface RadarProps {
  result: ScoreResult;
}

const R = 130;
const CX = 160;
const CY = 150;

export function RadarChart({ result }: RadarProps) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const [grouped, setGrouped] = useState(false);

  const primary = archetypeByCode.get(result.primary)!;
  const secondary = archetypeByCode.get(result.secondary)!;

  const axes = useMemo(() => {
    if (grouped) {
      return dimensionGroups.map((g) => ({
        id: g.id,
        label: t(`groups.${g.id}.name`),
        group: g.id,
        user: mean(g.dimensions.map((d) => result.scores[dimensionOrder.indexOf(d)])),
        primary: mean(g.dimensions.map((d) => primary.vector[dimensionOrder.indexOf(d)])),
        secondary: mean(g.dimensions.map((d) => secondary.vector[dimensionOrder.indexOf(d)])),
      }));
    }
    return dimensionOrder.map((id, i) => ({
      id,
      label: t(`dimensions.${id}.name`),
      group: dimensions.find((d) => d.id === id)!.group,
      user: result.scores[i],
      primary: primary.vector[i],
      secondary: secondary.vector[i],
    }));
  }, [grouped, result.scores, primary, secondary, t]);

  const n = axes.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, value: number) => {
    const r = (value / 100) * R;
    return [CX + Math.cos(angle(i)) * r, CY + Math.sin(angle(i)) * r] as const;
  };
  const polygon = (key: 'user' | 'primary' | 'secondary') =>
    axes.map((a, i) => point(i, a[key]).join(',')).join(' ');

  const topDimName = t(`dimensions.${dimensionOrder[strongestIdx(result.scores)]}.name`);

  return (
    <ChartFrame
      title={t('viz.radar.title')}
      description={t('viz.radar.plain')}
      summary={t('viz.radar.summary', {
        topDim: topDimName,
        primary: t(`archetypes.${result.primary}.name`),
        secondary: t(`archetypes.${result.secondary}.name`),
      })}
      controls={
        <div className="inline-flex rounded-lg border border-line p-0.5 text-xs">
          <button
            className={`rounded px-2 py-1 ${!grouped ? 'bg-lumina-400 text-void' : 'text-haze'}`}
            onClick={() => setGrouped(false)}
            aria-pressed={!grouped}
          >
            {t('viz.radar.full')}
          </button>
          <button
            className={`rounded px-2 py-1 ${grouped ? 'bg-lumina-400 text-void' : 'text-haze'}`}
            onClick={() => setGrouped(true)}
            aria-pressed={grouped}
          >
            {t('viz.radar.grouped')}
          </button>
        </div>
      }
      table={
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-haze">
              <th className="py-1 pr-3">{t('viz.radar.full')}</th>
              <th className="py-1 pr-3">{t('common.you')}</th>
              <th className="py-1 pr-3">{t(`archetypes.${result.primary}.name`)}</th>
              <th className="py-1">{t(`archetypes.${result.secondary}.name`)}</th>
            </tr>
          </thead>
          <tbody>
            {axes.map((a) => (
              <tr key={a.id} className="border-t border-line/60">
                <td className="py-1 pr-3">{a.label}</td>
                <td className="py-1 pr-3 font-mono">{Math.round(a.user)}</td>
                <td className="py-1 pr-3 font-mono text-haze">{Math.round(a.primary)}</td>
                <td className="py-1 font-mono text-haze">{Math.round(a.secondary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <svg viewBox="0 0 320 300" className="mx-auto w-full max-w-md" role="img" aria-label={t('viz.radar.title')}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <circle key={f} cx={CX} cy={CY} r={R * f} fill="none" stroke="rgba(148,173,210,0.14)" />
        ))}
        {axes.map((a, i) => {
          const [x, y] = point(i, 108);
          const [lx, ly] = point(i, 118);
          return (
            <g key={a.id}>
              <line x1={CX} y1={CY} x2={point(i, 100)[0]} y2={point(i, 100)[1]} stroke="rgba(148,173,210,0.1)" />
              <circle cx={x} cy={y} r={1.6} fill={groupColor(a.group)} />
              <text
                x={lx}
                y={ly}
                fontSize={grouped ? 9 : 6.5}
                fill="#8ea3c4"
                textAnchor={lx < CX - 5 ? 'end' : lx > CX + 5 ? 'start' : 'middle'}
                dominantBaseline="middle"
              >
                {a.label}
              </text>
            </g>
          );
        })}
        <polygon points={polygon('secondary')} fill={SIGNAL.secondary} fillOpacity={0.08} stroke={SIGNAL.secondary} strokeOpacity={0.5} strokeDasharray="3 2" />
        <polygon points={polygon('primary')} fill={SIGNAL.primary} fillOpacity={0.1} stroke={SIGNAL.primary} strokeOpacity={0.6} strokeDasharray="4 2" />
        <motion.polygon
          points={polygon('user')}
          fill={SIGNAL.user}
          fillOpacity={0.22}
          stroke={SIGNAL.user}
          strokeWidth={1.6}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.7, ease: 'easeOut' }}
        />
      </svg>
      <Legend
        items={[
          { label: t('common.you'), color: SIGNAL.user },
          { label: t(`archetypes.${result.primary}.name`), color: SIGNAL.primary },
          { label: t(`archetypes.${result.secondary}.name`), color: SIGNAL.secondary },
        ]}
      />
    </ChartFrame>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-haze">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: it.color }} aria-hidden="true" />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function strongestIdx(scores: number[]) {
  let best = 0;
  let dev = -1;
  scores.forEach((s, i) => {
    if (Math.abs(s - 50) > dev) {
      dev = Math.abs(s - 50);
      best = i;
    }
  });
  return best;
}
