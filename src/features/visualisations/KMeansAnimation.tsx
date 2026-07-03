import { useEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import { createRng, kMeans, silhouetteScore } from '@/lib/mathematics';

const W = 320;
const H = 300;
const PAD = 20;
const CLUSTER_COLORS = ['#5fdcf7', '#f2b054', '#8f7bff', '#4ad6a8', '#ef7d8f', '#a0d468', '#ff9f68', '#6bb8ff'];

/** Deterministic 2-D synthetic points drawn from a few seeded blobs. */
function makePoints(seed: number, count = 90): number[][] {
  const rng = createRng(seed);
  const blobs = 4;
  const centres = Array.from({ length: blobs }, () => [10 + rng.next() * 80, 10 + rng.next() * 80]);
  const pts: number[][] = [];
  for (let i = 0; i < count; i += 1) {
    const c = centres[rng.int(0, blobs - 1)];
    pts.push([
      Math.max(2, Math.min(98, c[0] + rng.gaussian() * 9)),
      Math.max(2, Math.min(98, c[1] + rng.gaussian() * 9)),
    ]);
  }
  return pts;
}

export function KMeansAnimation() {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const [k, setK] = useState(4);
  const [seed, setSeed] = useState(7);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(!reduced);
  const timer = useRef<number>();

  const points = useMemo(() => makePoints(seed), [seed]);
  const run = useMemo(() => kMeans(points, k, createRng(seed * 31 + k)), [points, k, seed]);
  const steps = run.history;
  const step = steps[Math.min(frame, steps.length - 1)];

  const x = scaleLinear([0, 100], [PAD, W - PAD]);
  const y = scaleLinear([0, 100], [H - PAD, PAD]);
  const silhouette = useMemo(() => silhouetteScore(points, step.assignments), [points, step]);

  useEffect(() => setFrame(0), [k, seed]);

  useEffect(() => {
    if (!playing || reduced) return;
    timer.current = window.setTimeout(() => {
      setFrame((f) => (f >= steps.length - 1 ? f : f + 1));
    }, 700);
    return () => window.clearTimeout(timer.current);
  }, [playing, frame, steps.length, reduced]);

  return (
    <ChartFrame
      title={t('viz.kmeans.title')}
      description={t('viz.kmeans.plain')}
      summary={t('viz.kmeans.summary', {
        k,
        silhouette: silhouetteScore(points, run.assignments).toFixed(2),
        iterations: run.iterations,
      })}
      controls={
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1">
            {t('viz.kmeans.k')}
            <input type="range" min={3} max={8} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-20" aria-label={t('viz.kmeans.k')} />
            <span className="font-mono">{k}</span>
          </label>
          <button className="btn-quiet px-2 py-1" onClick={() => setSeed((s) => s + 1)}>{t('common.seed')} ↻</button>
        </div>
      }
    >
      <div className="mb-2 rounded-lg border border-amber-glow/30 bg-amber-glow/5 px-3 py-1.5 text-[11px] text-amber-glow">
        {t('viz.kmeans.label')}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-md" role="img" aria-label={t('viz.kmeans.title')}>
        <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} fill="none" stroke="rgba(148,173,210,0.12)" />
        {points.map((p, i) => (
          <circle key={i} cx={x(p[0])} cy={y(p[1])} r={2.6} fill={CLUSTER_COLORS[step.assignments[i] % CLUSTER_COLORS.length]} fillOpacity={0.8} />
        ))}
        {step.centroids.map((c, i) => (
          <g key={i} style={{ transition: reduced ? undefined : 'all 0.5s ease' }}>
            <circle cx={x(c[0])} cy={y(c[1])} r={7} fill="none" stroke={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} strokeWidth={2} />
            <line x1={x(c[0]) - 4} y1={y(c[1])} x2={x(c[0]) + 4} y2={y(c[1])} stroke={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} strokeWidth={1.4} />
            <line x1={x(c[0])} y1={y(c[1]) - 4} x2={x(c[0])} y2={y(c[1]) + 4} stroke={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} strokeWidth={1.4} />
          </g>
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setPlaying((p) => !p)}>
            {playing ? t('common.pause') : t('common.play')}
          </button>
          <button className="btn-quiet px-2 py-1 text-xs" onClick={() => setFrame((f) => Math.min(f + 1, steps.length - 1))}>
            {t('common.step')} →
          </button>
          <button className="btn-quiet px-2 py-1 text-xs" onClick={() => { setFrame(0); setPlaying(false); }}>
            {t('common.reset')}
          </button>
        </div>
        <dl className="flex gap-4 font-mono text-[11px] text-haze">
          <div><dt className="inline">{t('viz.kmeans.iteration')}: </dt><dd className="inline text-parchment">{Math.min(frame, steps.length - 1)}</dd></div>
          <div><dt className="inline">{t('viz.kmeans.wcss')}: </dt><dd className="inline text-parchment">{step.inertia.toFixed(0)}</dd></div>
          <div><dt className="inline">{t('viz.kmeans.silhouette')}: </dt><dd className="inline text-parchment">{silhouette.toFixed(2)}</dd></div>
        </dl>
      </div>
    </ChartFrame>
  );
}
