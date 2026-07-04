import { useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { createRng, fitPca, kMeans, projectPoint, silhouetteScore } from '@/lib/mathematics';
import { prototypeMatrix } from './synthetic';
import type { CohortRecord } from '@/features/cohort/cohortStorage';

const W = 520;
const H = 360;
const PAD = 38;
const CLUSTER_COLORS = ['#0d7f9b', '#c26d10', '#6d4fc9', '#0f9d76', '#c34f6b'];

function spreadDomain(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}

function jitter(id: string): [number, number] {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const angle = (hash % 360) * (Math.PI / 180);
  const radius = 1.8 + ((hash >>> 8) % 18) / 10;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

export function CohortMap({ records }: { records: CohortRecord[] }) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState<string | null>(null);

  const model = useMemo(() => {
    if (records.length === 0) return null;
    const prototypes = prototypeMatrix(false);
    const fitMatrix = [...prototypes.map((p) => p.vector), ...records.map((record) => record.vector)];
    const pca = fitPca(fitMatrix);
    const protoPts = prototypes.map((p) => ({ code: p.code, xy: projectPoint(p.vector, pca, 2) }));
    const clusters =
      records.length >= 3
        ? kMeans(records.map((record) => record.vector), Math.min(5, Math.max(2, Math.round(Math.sqrt(records.length)))), createRng('cohort-atlas-v1')).assignments
        : records.map((_, i) => i);
    const cellPts = records.map((record, i) => ({
      record,
      cluster: clusters[i],
      xy: projectPoint(record.vector, pca, 2),
      jitter: jitter(record.id),
    }));
    const clusterCount = new Set(clusters).size;
    const silhouette = records.length >= 3 ? silhouetteScore(records.map((record) => record.vector), clusters) : 0;
    return { pca, protoPts, cellPts, clusterCount, silhouette };
  }, [records]);

  if (!model) {
    return (
      <section className="panel p-5">
        <h2 className="text-base font-semibold">{t('cohort.emptyTitle')}</h2>
        <p className="mt-2 text-sm text-haze">{t('cohort.emptyBody')}</p>
      </section>
    );
  }

  const allX = [...model.protoPts.map((p) => p.xy[0]), ...model.cellPts.map((p) => p.xy[0])];
  const allY = [...model.protoPts.map((p) => p.xy[1]), ...model.cellPts.map((p) => p.xy[1])];
  const x = scaleLinear(spreadDomain(allX), [PAD, W - PAD]);
  const y = scaleLinear(spreadDomain(allY), [H - PAD, PAD]);
  const pc1 = Math.round(model.pca.explainedVariance[0] * 100);
  const pc2 = Math.round(model.pca.explainedVariance[1] * 100);
  const hoveredCell = model.cellPts.find((cell) => cell.record.id === hovered);

  return (
    <ChartFrame
      title={t('cohort.plotTitle')}
      description={t('cohort.plotDescription')}
      summary={t('cohort.plotSummary', {
        count: records.length,
        clusters: model.clusterCount,
        pc1,
        pc2,
      })}
      controls={
        <>
          <span className="rounded bg-slate850/60 px-2 py-1 font-mono text-[10px] text-haze">
            {t('cohort.cellCount', { count: records.length })}
          </span>
          <span className="rounded bg-slate850/60 px-2 py-1 font-mono text-[10px] text-haze">
            {t('cohort.silhouette', { value: model.silhouette.toFixed(2) })}
          </span>
        </>
      }
      table={
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-haze">
              <th className="py-1 pr-3">{t('cohort.table.cell')}</th>
              <th className="py-1 pr-3">{t('cohort.table.cluster')}</th>
              <th className="py-1 pr-3">{t('common.primary')}</th>
              <th className="py-1 pr-3">PC1</th>
              <th className="py-1 pr-3">PC2</th>
              <th className="py-1">{t('cohort.table.recorded')}</th>
            </tr>
          </thead>
          <tbody>
            {model.cellPts.map((cell, i) => (
              <tr key={cell.record.id} className="border-t border-line/60">
                <td className="py-1 pr-3 font-mono">{i + 1}</td>
                <td className="py-1 pr-3 font-mono">{cell.cluster + 1}</td>
                <td className="py-1 pr-3">
                  <span className="font-mono text-haze">{cell.record.primary}</span>{' '}
                  {t(`archetypes.${cell.record.primary}.name`)}
                </td>
                <td className="py-1 pr-3 font-mono">{cell.xy[0].toFixed(1)}</td>
                <td className="py-1 pr-3 font-mono">{cell.xy[1].toFixed(1)}</td>
                <td className="py-1">{new Date(cell.record.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-3xl" role="img" aria-label={t('cohort.plotTitle')}>
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="rgba(52,64,80,0.2)" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="rgba(52,64,80,0.2)" />
        <text x={W - PAD} y={H - PAD + 14} fontSize={10} fill="#5d6570" textAnchor="end">
          PC1 · {pc1}%
        </text>
        <text x={PAD - 8} y={PAD} fontSize={10} fill="#5d6570" textAnchor="end" transform={`rotate(-90 ${PAD - 8} ${PAD})`}>
          PC2 · {pc2}%
        </text>

        {model.protoPts.map((point) => (
          <g key={point.code}>
            <circle cx={x(point.xy[0])} cy={y(point.xy[1])} r={2.2} fill="#5d6570" fillOpacity={0.28} />
            <text x={x(point.xy[0]) + 4} y={y(point.xy[1]) + 3} fontSize={7} fill="#5d6570" fillOpacity={0.55}>
              {point.code}
            </text>
          </g>
        ))}

        {model.cellPts.map((cell, i) => {
          const cx = x(cell.xy[0]) + cell.jitter[0];
          const cy = y(cell.xy[1]) + cell.jitter[1];
          const active = hovered === cell.record.id;
          return (
            <g
              key={cell.record.id}
              onMouseEnter={() => setHovered(cell.record.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(cell.record.id)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
            >
              <circle
                cx={cx}
                cy={cy}
                r={active ? 7 : 5}
                fill={CLUSTER_COLORS[cell.cluster % CLUSTER_COLORS.length]}
                fillOpacity={0.9}
                stroke="#070a0f"
                strokeWidth={1.2}
              />
              <text x={cx} y={cy + 2.5} textAnchor="middle" fontSize={6.5} fill="#071016" fontWeight={700}>
                {i + 1}
              </text>
            </g>
          );
        })}

        {hoveredCell && (
          <g pointerEvents="none">
            <rect
              x={Math.min(W - 190, x(hoveredCell.xy[0]) + 12)}
              y={Math.max(12, y(hoveredCell.xy[1]) - 32)}
              width={176}
              height={42}
              rx={7}
              fill="#0c111b"
              stroke="rgba(52,64,80,0.35)"
            />
            <text x={Math.min(W - 178, x(hoveredCell.xy[0]) + 20)} y={Math.max(30, y(hoveredCell.xy[1]) - 14)} fontSize={10} fill="#262b31">
              {t('cohort.hoverCell', { cell: model.cellPts.indexOf(hoveredCell) + 1, cluster: hoveredCell.cluster + 1 })}
            </text>
            <text x={Math.min(W - 178, x(hoveredCell.xy[0]) + 20)} y={Math.max(30, y(hoveredCell.xy[1]) + 2)} fontSize={9} fill="#5d6570">
              {hoveredCell.record.primary} · {t(`archetypes.${hoveredCell.record.primary}.name`)}
            </text>
          </g>
        )}
      </svg>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-haze">
        {Array.from({ length: model.clusterCount }, (_, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }} />
            {t('cohort.clusterLabel', { cluster: i + 1 })}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-haze/40" />
          {t('cohort.prototypeLabel')}
        </span>
      </div>
    </ChartFrame>
  );
}
