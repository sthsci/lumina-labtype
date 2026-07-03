import { useMemo, useState } from 'react';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { archetypeByCode, dimensionOrder } from '@/data/content';
import { hierarchicalCluster, type DendrogramNode } from '@/lib/mathematics';
import { centredColor, scoreColor } from './palette';
import type { ScoreResult } from '@/features/scoring/types';

export function ResponseHeatmap({ result }: { result: ScoreResult }) {
  const { t } = useI18n();
  const [centred, setCentred] = useState(false);
  const [clustered, setClustered] = useState(false);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  const columns = useMemo(() => {
    const cols = [{ code: 'you', vector: result.scores, label: t('common.you') }];
    for (const code of result.topFive.slice(0, 5)) {
      cols.push({ code, vector: archetypeByCode.get(code)!.vector, label: t(`archetypes.${code}.name`) });
    }
    return cols;
  }, [result, t]);

  // optional hierarchical row ordering by dimension similarity across columns
  const rowOrder = useMemo(() => {
    if (!clustered) return dimensionOrder.map((_, i) => i);
    const rows = dimensionOrder.map((_, i) => columns.map((c) => c.vector[i]));
    const tree = hierarchicalCluster(rows, 'average');
    const order: number[] = [];
    const walk = (node: DendrogramNode) => {
      if (node.leaf !== null) order.push(node.leaf);
      else node.children.forEach(walk);
    };
    walk(tree);
    return order;
  }, [clustered, columns]);

  const cell = (rowIdx: number, col: (typeof columns)[number]) => {
    const raw = col.vector[rowIdx];
    return centred ? (raw - 50) / 50 : raw;
  };
  const color = (rowIdx: number, col: (typeof columns)[number]) =>
    centred ? centredColor((col.vector[rowIdx] - 50) / 50) : scoreColor(col.vector[rowIdx]);

  const cw = 100 / (columns.length + 0.001);

  return (
    <ChartFrame
      title={t('viz.heatmap.title')}
      description={t('viz.heatmap.plain')}
      summary={t('viz.heatmap.summary', { rows: dimensionOrder.length, cols: columns.length })}
      controls={
        <>
          <button
            className="btn-quiet px-2 py-1 text-xs"
            onClick={() => setCentred((v) => !v)}
            aria-pressed={centred}
          >
            {centred ? t('viz.common.centredScores') : t('viz.common.rawScores')}
          </button>
          <button
            className="btn-quiet px-2 py-1 text-xs"
            onClick={() => setClustered((v) => !v)}
            aria-pressed={clustered}
          >
            {clustered ? t('viz.heatmap.cluster') : t('viz.heatmap.unsorted')}
          </button>
        </>
      }
      table={
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-haze">
              <th className="py-1 pr-2" />
              {columns.map((c) => (
                <th key={c.code} className="py-1 pr-2">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowOrder.map((ri) => (
              <tr key={ri} className="border-t border-line/60">
                <td className="py-1 pr-2">{t(`dimensions.${dimensionOrder[ri]}.name`)}</td>
                {columns.map((c) => (
                  <td key={c.code} className="py-1 pr-2 font-mono">
                    {centred ? cell(ri, c).toFixed(2) : Math.round(cell(ri, c) as number)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
          {/* column headers */}
          <div className="flex pl-[38%] text-[10px] text-haze">
            {columns.map((c, ci) => (
              <div key={c.code} className="truncate px-0.5 text-center" style={{ width: `${cw}%` }} title={c.label}>
                {ci === 0 ? <span className="text-lumina-200">{c.label}</span> : c.label}
              </div>
            ))}
          </div>
          {/* rows */}
          {rowOrder.map((ri, displayIdx) => (
            <div key={ri} className="flex items-center">
              <div className="w-[38%] truncate py-0.5 pr-2 text-right text-[10px] text-haze" title={t(`dimensions.${dimensionOrder[ri]}.name`)}>
                {t(`dimensions.${dimensionOrder[ri]}.name`)}
              </div>
              <div className="flex flex-1">
                {columns.map((c, ci) => {
                  const v = cell(ri, c);
                  const isHover = hover?.r === displayIdx && hover?.c === ci;
                  return (
                    <button
                      key={c.code}
                      className="relative h-6 flex-1 border border-void/40 focus:z-10 focus:outline focus:outline-2 focus:outline-lumina-300"
                      style={{ background: color(ri, c) }}
                      onMouseEnter={() => setHover({ r: displayIdx, c: ci })}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover({ r: displayIdx, c: ci })}
                      onBlur={() => setHover(null)}
                      aria-label={`${t(`dimensions.${dimensionOrder[ri]}.name`)}, ${c.label}: ${centred ? (v as number).toFixed(2) : Math.round(v as number)}`}
                    >
                      {isHover && (
                        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 font-mono text-[10px] text-parchment shadow-panel">
                          {centred ? (v as number).toFixed(2) : Math.round(v as number)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 font-mono text-[10px] text-haze">
        <span>{centred ? '−1' : '0'}</span>
        <span className="h-2 w-32 rounded-full" style={{ background: 'linear-gradient(90deg,#3b82c4,#5c6a7d,#f2b054)' }} />
        <span>{centred ? '+1' : '100'}</span>
      </div>
    </ChartFrame>
  );
}
