import { useMemo, useState } from 'react';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { visibleArchetypes } from '@/data/content';
import { cosineSimilarity, euclidean, hierarchicalCluster, pearson, type DendrogramNode } from '@/lib/mathematics';
import type { ScoreResult } from '@/features/scoring/types';

type Metric = 'euclidean' | 'cosine' | 'pearson';
const METRICS: Metric[] = ['euclidean', 'cosine', 'pearson'];

// perceptual: 0 (dissimilar) -> 1 (similar)
function simColor(v: number): string {
  const t = Math.max(0, Math.min(1, v));
  // paper (dissimilar) -> deep teal ink (similar)
  const l = 94 - t * 60;
  return `hsl(${190 - t * 14}, ${14 + t * 48}%, ${l}%)`;
}

export function SimilarityMatrix({ result }: { result?: ScoreResult }) {
  const { t } = useI18n();
  const [metric, setMetric] = useState<Metric>('cosine');
  const [hover, setHover] = useState<{ i: number; j: number } | null>(null);

  const { order, sim, codes } = useMemo(() => {
    const codes = visibleArchetypes.map((a) => a.code);
    const vectors = visibleArchetypes.map((a) => a.vector);
    const n = vectors.length;
    const raw = Array.from({ length: n }, () => new Array(n).fill(0));
    let maxD = 0;
    for (let i = 0; i < n; i += 1)
      for (let j = 0; j < n; j += 1) maxD = Math.max(maxD, euclidean(vectors[i], vectors[j]));
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        if (metric === 'cosine') raw[i][j] = (cosineSimilarity(vectors[i], vectors[j]) + 1) / 2;
        else if (metric === 'pearson') raw[i][j] = (pearson(vectors[i], vectors[j]) + 1) / 2;
        else raw[i][j] = 1 - euclidean(vectors[i], vectors[j]) / (maxD || 1);
      }
    }
    // cluster ordering by vector similarity
    const tree = hierarchicalCluster(vectors, 'average');
    const order: number[] = [];
    const walk = (node: DendrogramNode) => {
      if (node.leaf !== null) order.push(node.leaf);
      else node.children.forEach(walk);
    };
    walk(tree);
    return { order, sim: raw, codes };
  }, [metric]);

  const cell = 100 / order.length;
  const winner = result?.primary;

  return (
    <ChartFrame
      title={t('viz.similarity.title')}
      description={t('viz.similarity.plain')}
      summary={t('viz.similarity.summary', {
        metric: t(`viz.metrics.${metric}`),
        primary: winner ? t(`archetypes.${winner}.name`) : t('viz.common.prototype'),
      })}
      controls={
        <div className="flex gap-1">
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
    >
      <div className="overflow-x-auto">
        <svg viewBox="0 0 118 118" className="mx-auto w-full max-w-md" role="img" aria-label={t('viz.similarity.title')}>
          <g transform="translate(18,0)">
            {order.map((ri, ii) =>
              order.map((ci, jj) => {
                const isWinnerRow = winner && codes[ri] === winner;
                const isWinnerCol = winner && codes[ci] === winner;
                const isHover = hover?.i === ii && hover?.j === jj;
                return (
                  <rect
                    key={`${ii}-${jj}`}
                    x={jj * cell}
                    y={ii * cell}
                    width={cell + 0.2}
                    height={cell + 0.2}
                    fill={simColor(sim[ri][ci])}
                    stroke={isWinnerRow || isWinnerCol ? '#c26d10' : isHover ? '#22262c' : 'none'}
                    strokeWidth={isWinnerRow || isWinnerCol ? 0.4 : isHover ? 0.4 : 0}
                    onMouseEnter={() => setHover({ i: ii, j: jj })}
                    onMouseLeave={() => setHover(null)}
                  >
                    <title>{`${codes[ri]} · ${codes[ci]}: ${sim[ri][ci].toFixed(2)}`}</title>
                  </rect>
                );
              }),
            )}
            {order.map((ri, ii) => (
              <text key={`r${ii}`} x={-1} y={ii * cell + cell / 2 + 1} fontSize={2.6} fill={winner && codes[ri] === winner ? '#c26d10' : '#5d6570'} textAnchor="end" dominantBaseline="middle">
                {codes[ri]}
              </text>
            ))}
          </g>
        </svg>
      </div>
      {hover && (
        <p className="mt-2 text-center font-mono text-xs text-parchment/80">
          {codes[order[hover.i]]} · {codes[order[hover.j]]}: {sim[order[hover.i]][order[hover.j]].toFixed(2)}
        </p>
      )}
    </ChartFrame>
  );
}
