import { useMemo, useRef, useState } from 'react';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { dimensionOrder, visibleArchetypes } from '@/data/content';
import { euclidean } from '@/lib/mathematics';
import type { ScoreResult } from '@/features/scoring/types';

const SIZE = 300;
const GRID = 30;
const COLORS = ['#5fdcf7', '#f2b054', '#8f7bff', '#4ad6a8', '#ef7d8f', '#a0d468', '#ff9f68', '#6bb8ff', '#c58a4e', '#7bd1ff'];

export function DecisionPlayground({ result }: { result?: ScoreResult }) {
  const { t } = useI18n();
  const [xDim, setXDim] = useState(dimensionOrder[4]); // qualitative_quantitative
  const [yDim, setYDim] = useState(dimensionOrder[12]); // safe_risk
  const svgRef = useRef<SVGSVGElement>(null);

  const xi = dimensionOrder.indexOf(xDim);
  const yi = dimensionOrder.indexOf(yDim);

  const [point, setPoint] = useState<[number, number]>(() =>
    result ? [result.scores[xi], result.scores[yi]] : [50, 50],
  );

  const protos = useMemo(
    () => visibleArchetypes.map((a, idx) => ({ code: a.code, x: a.vector[xi], y: a.vector[yi], idx })),
    [xi, yi],
  );

  const nearestTo = (px: number, py: number) => {
    let best = protos[0];
    let bd = Infinity;
    for (const p of protos) {
      const d = (p.x - px) ** 2 + (p.y - py) ** 2;
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  };

  // region background: nearest archetype per grid cell
  const cells = useMemo(() => {
    const out: { gx: number; gy: number; color: string }[] = [];
    const s = 100 / GRID;
    for (let gx = 0; gx < GRID; gx += 1) {
      for (let gy = 0; gy < GRID; gy += 1) {
        const cx = (gx + 0.5) * s;
        const cy = (gy + 0.5) * s;
        const near = nearestTo(cx, cy);
        out.push({ gx, gy, color: COLORS[near.idx % COLORS.length] });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protos]);

  const toSvg = (v: number) => (v / 100) * SIZE;
  const fromSvg = (v: number) => Math.max(0, Math.min(100, (v / SIZE) * 100));

  const currentNearest = nearestTo(point[0], point[1]);

  const onPointer = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = fromSvg(((e.clientX - rect.left) / rect.width) * SIZE);
    const py = fromSvg(SIZE - ((e.clientY - rect.top) / rect.height) * SIZE);
    setPoint([px, py]);
  };

  const distances = useMemo(() => {
    const full = result ? result.scores.slice() : dimensionOrder.map(() => 50);
    return visibleArchetypes
      .map((a) => {
        const probe = full.slice();
        probe[xi] = point[0];
        probe[yi] = point[1];
        return { code: a.code, dist: euclidean(probe, a.vector) };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);
  }, [point, xi, yi, result]);

  const cellSize = SIZE / GRID;

  return (
    <ChartFrame
      title={t('viz.decision.title')}
      description={t('viz.decision.plain')}
      summary={t('viz.decision.summary', {
        x: t(`dimensions.${xDim}.name`),
        y: t(`dimensions.${yDim}.name`),
        nearest: t(`archetypes.${currentNearest.code}.name`),
      })}
      controls={
        <div className="flex flex-wrap gap-2 text-xs">
          <label className="flex items-center gap-1">
            {t('viz.decision.xDim')}
            <select value={xDim} onChange={(e) => setXDim(e.target.value)} className="rounded bg-ink px-1 py-0.5 text-parchment">
              {dimensionOrder.map((d) => <option key={d} value={d}>{t(`dimensions.${d}.name`)}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1">
            {t('viz.decision.yDim')}
            <select value={yDim} onChange={(e) => setYDim(e.target.value)} className="rounded bg-ink px-1 py-0.5 text-parchment">
              {dimensionOrder.map((d) => <option key={d} value={d}>{t(`dimensions.${d}.name`)}</option>)}
            </select>
          </label>
        </div>
      }
    >
      <div className="mb-2 rounded-lg border border-amber-glow/30 bg-amber-glow/5 px-3 py-1.5 text-[11px] text-amber-glow">
        {t('viz.decision.label')}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full max-w-xs cursor-crosshair touch-none rounded-lg"
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            onPointer(e);
          }}
          onPointerMove={(e) => e.buttons === 1 && onPointer(e)}
          role="img"
          aria-label={t('viz.decision.title')}
        >
          {cells.map((c) => (
            <rect
              key={`${c.gx}-${c.gy}`}
              x={c.gx * cellSize}
              y={SIZE - (c.gy + 1) * cellSize}
              width={cellSize + 0.5}
              height={cellSize + 0.5}
              fill={c.color}
              fillOpacity={0.16}
            />
          ))}
          {protos.map((p) => (
            <g key={p.code}>
              <circle cx={toSvg(p.x)} cy={SIZE - toSvg(p.y)} r={3} fill={COLORS[p.idx % COLORS.length]} />
              <text x={toSvg(p.x) + 4} y={SIZE - toSvg(p.y) + 2} fontSize={6} fill="#e8e2d1">{p.code}</text>
            </g>
          ))}
          <circle cx={toSvg(point[0])} cy={SIZE - toSvg(point[1])} r={7} fill="#fff" stroke="#070a0f" strokeWidth={2} />
          <text x={4} y={SIZE - 4} fontSize={7} fill="#8ea3c4">{t(`dimensions.${xDim}.name`)} →</text>
        </svg>
        <div className="flex-1">
          <p className="mb-1 text-xs text-haze">{t('viz.decision.drag')}</p>
          <p className="mb-3 text-sm">
            {t('viz.decision.nearest')}:{' '}
            <span className="font-semibold text-amber-glow">{t(`archetypes.${currentNearest.code}.name`)}</span>
          </p>
          <table className="w-full text-left text-xs">
            <tbody>
              {distances.map((d, i) => (
                <tr key={d.code} className={`border-t border-line/60 ${i === 0 ? 'text-amber-glow' : 'text-parchment/75'}`}>
                  <td className="py-1 pr-3 font-mono">{i + 1}</td>
                  <td className="py-1 pr-3">{t(`archetypes.${d.code}.name`)}</td>
                  <td className="py-1 text-right font-mono">{d.dist.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ChartFrame>
  );
}
