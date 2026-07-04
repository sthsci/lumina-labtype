import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { scaleLinear } from 'd3-scale';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { useAppStore } from '@/app/store';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import { fitPca, projectPoint } from '@/lib/mathematics';
import { dimensionOrder } from '@/data/content';
import { generateSyntheticProfiles, prototypeMatrix } from './synthetic';
import { Legend } from './RadarChart';
import { SIGNAL } from './palette';
import type { ScoreResult } from '@/features/scoring/types';

const W = 520;
const H = 420;
const PAD = 62;

export function PCAProjection({ result }: { result: ScoreResult }) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const settings = useAppStore((s) => s.settings);
  const [showLoadings, setShowLoadings] = useState(true);
  const [hover, setHover] = useState<string | null>(null);

  const model = useMemo(() => {
    const protos = prototypeMatrix(false);
    const synth = settings.hideSynthetic
      ? []
      : generateSyntheticProfiles({ perArchetype: settings.reducedCompute ? 5 : 12 });
    // Fit PCA on prototypes + synthetic so the projection is stable and legible.
    const fitMatrix = [...protos.map((p) => p.vector), ...synth.map((s) => s.vector)];
    const pca = fitPca(fitMatrix);
    const protoPts = protos.map((p) => ({ code: p.code, xy: projectPoint(p.vector, pca, 2) }));
    const synthPts = synth.map((s) => ({ source: s.source, xy: projectPoint(s.vector, pca, 2) }));
    const userXy = projectPoint(result.scores, pca, 2);
    const rawXy = projectPoint(result.scores.map(() => 50), pca, 2); // neutral start point

    // strongest loading vectors (PC1/PC2 magnitude)
    const loadings = dimensionOrder
      .map((id, i) => ({
        id,
        x: pca.components[0][i],
        y: pca.components[1][i],
        mag: Math.hypot(pca.components[0][i], pca.components[1][i]),
      }))
      .sort((a, b) => b.mag - a.mag)
      .slice(0, 5);

    return { pca, protoPts, synthPts, userXy, rawXy, loadings };
  }, [result.scores, settings.hideSynthetic, settings.reducedCompute]);

  const allX = [
    ...model.protoPts.map((p) => p.xy[0]),
    ...model.synthPts.map((p) => p.xy[0]),
    model.userXy[0],
  ];
  const allY = [
    ...model.protoPts.map((p) => p.xy[1]),
    ...model.synthPts.map((p) => p.xy[1]),
    model.userXy[1],
  ];
  const x = scaleLinear([Math.min(...allX), Math.max(...allX)], [PAD, W - PAD]);
  const y = scaleLinear([Math.min(...allY), Math.max(...allY)], [H - PAD, PAD]);
  const loadScale = Math.min(W, H) * 0.24;

  const pc1 = Math.round(model.pca.explainedVariance[0] * 100);
  const pc2 = Math.round(model.pca.explainedVariance[1] * 100);
  const nearest = new Set(result.topFive);

  return (
    <ChartFrame
      title={t('viz.pca.title')}
      description={t('viz.pca.plain')}
      summary={t('viz.pca.summary', { total: pc1 + pc2, primary: t(`archetypes.${result.primary}.name`) })}
      controls={
        <>
          <span className="rounded bg-slate850/60 px-2 py-1 font-mono text-[10px] text-haze">
            {t('viz.pca.explained', { pc1, pc2 })}
          </span>
          <button className="btn-quiet px-2 py-1 text-xs" onClick={() => setShowLoadings((v) => !v)} aria-pressed={showLoadings}>
            {t('viz.pca.loadings')}
          </button>
        </>
      }
      table={
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-haze"><th className="py-1 pr-3">Archetype</th><th className="py-1 pr-3">PC1</th><th className="py-1">PC2</th></tr>
          </thead>
          <tbody>
            <tr className="border-t border-line/60">
              <td className="py-1 pr-3 text-lumina-200">{t('common.you')}</td>
              <td className="py-1 pr-3 font-mono">{model.userXy[0].toFixed(1)}</td>
              <td className="py-1 font-mono">{model.userXy[1].toFixed(1)}</td>
            </tr>
            {model.protoPts.map((p) => (
              <tr key={p.code} className="border-t border-line/60">
                <td className="py-1 pr-3">{t(`archetypes.${p.code}.name`)}</td>
                <td className="py-1 pr-3 font-mono">{p.xy[0].toFixed(1)}</td>
                <td className="py-1 font-mono">{p.xy[1].toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-2xl" role="img" aria-label={t('viz.pca.title')}>
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="rgba(52,64,80,0.2)" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="rgba(52,64,80,0.2)" />
        <text x={W - PAD} y={H - PAD + 12} fontSize={9} fill="#5d6570" textAnchor="end">PC1 · {pc1}%</text>
        <text x={PAD - 6} y={PAD} fontSize={9} fill="#5d6570" textAnchor="end" transform={`rotate(-90 ${PAD - 6} ${PAD})`}>PC2 · {pc2}%</text>

        {/* synthetic reference points */}
        {model.synthPts.map((p, i) => (
          <circle key={i} cx={x(p.xy[0])} cy={y(p.xy[1])} r={1.5} fill="#5c6a7d" fillOpacity={0.35} />
        ))}

        {/* loading vectors */}
        {showLoadings &&
          model.loadings.map((l, i) => {
            const cx = x((x.domain()[0] + x.domain()[1]) / 2);
            const cy = y((y.domain()[0] + y.domain()[1]) / 2);
            const ex = cx + l.x * loadScale;
            const ey = cy - l.y * loadScale;
            return (
              <g key={l.id}>
                <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="#c26d10" strokeOpacity={0.55} markerEnd="url(#arrow)" />
                <circle cx={ex} cy={ey} r={6.5} fill="#1e1b13" stroke="#c26d10" strokeOpacity={0.6} />
                <text x={ex} y={ey + 2.4} fontSize={7.5} fill="#c26d10" textAnchor="middle" fontWeight={700}>
                  {i + 1}
                </text>
              </g>
            );
          })}
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#c26d10" fillOpacity="0.5" />
          </marker>
        </defs>

        {/* archetype prototypes */}
        {model.protoPts.map((p) => {
          const isNear = nearest.has(p.code);
          return (
            <g key={p.code} onMouseEnter={() => setHover(p.code)} onMouseLeave={() => setHover(null)}>
              <circle
                cx={x(p.xy[0])}
                cy={y(p.xy[1])}
                r={isNear ? 4 : 2.6}
                fill={isNear ? SIGNAL.primary : '#5d6570'}
                fillOpacity={isNear ? 0.9 : 0.5}
              />
              {(hover === p.code || isNear) && (
                <text x={x(p.xy[0]) + 5} y={y(p.xy[1]) + 3} fontSize={7} fill="#262b31">
                  {p.code}
                </text>
              )}
            </g>
          );
        })}

        {/* trajectory: neutral -> user */}
        {!reduced && (
          <motion.line
            x1={x(model.rawXy[0])}
            y1={y(model.rawXy[1])}
            x2={x(model.userXy[0])}
            y2={y(model.userXy[1])}
            stroke={SIGNAL.user}
            strokeOpacity={0.4}
            strokeDasharray="3 2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8 }}
          />
        )}

        {/* user point */}
        <motion.circle
          cx={x(model.userXy[0])}
          cy={y(model.userXy[1])}
          r={5.5}
          fill={SIGNAL.user}
          stroke="#070a0f"
          strokeWidth={1.4}
          initial={reduced ? false : { cx: x(model.rawXy[0]), cy: y(model.rawXy[1]), scale: 0.4 }}
          animate={{ cx: x(model.userXy[0]), cy: y(model.userXy[1]), scale: 1 }}
          transition={{ duration: reduced ? 0 : 0.9, ease: 'easeOut' }}
        />
      </svg>
      <Legend
        items={[
          { label: t('common.you'), color: SIGNAL.user },
          { label: t('viz.common.prototype'), color: SIGNAL.primary },
          ...(settings.hideSynthetic ? [] : [{ label: t('viz.common.synthetic'), color: '#5c6a7d' }]),
        ]}
      />
      {showLoadings && (
        <ol className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-amber-glow/85">
          {model.loadings.map((l, i) => (
            <li key={l.id} className="whitespace-nowrap">
              <span className="font-mono">{i + 1}</span> {t(`dimensions.${l.id}.name`)}
            </li>
          ))}
        </ol>
      )}
    </ChartFrame>
  );
}
