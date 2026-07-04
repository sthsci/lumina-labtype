import { useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { visibleArchetypes } from '@/data/content';
import { cutTree, hierarchicalCluster, type DendrogramNode, type Linkage } from '@/lib/mathematics';
import type { ScoreResult } from '@/features/scoring/types';

const LINKAGES: Linkage[] = ['average', 'complete', 'ward'];
const ROW = 20;
const PAD_L = 8;
const LABEL_W = 66;

interface Positioned {
  node: DendrogramNode;
  y: number;
}

export function Dendrogram({ result }: { result?: ScoreResult }) {
  const { t } = useI18n();
  const [linkage, setLinkage] = useState<Linkage>('average');
  const [threshold, setThreshold] = useState(0);

  const { root, leaves, maxHeight, positions } = useMemo(() => {
    const codes = visibleArchetypes.map((a) => a.code);
    const root = hierarchicalCluster(visibleArchetypes.map((a) => a.vector), linkage);
    const leaves: number[] = [];
    const collect = (n: DendrogramNode) => (n.leaf !== null ? leaves.push(n.leaf) : n.children.forEach(collect));
    collect(root);
    const leafY = new Map<number, number>();
    leaves.forEach((leaf, i) => leafY.set(leaf, i * ROW + ROW / 2));
    const positions = new Map<number, Positioned>();
    const assignY = (n: DendrogramNode): number => {
      if (n.leaf !== null) {
        const yy = leafY.get(n.leaf)!;
        positions.set(n.id, { node: n, y: yy });
        return yy;
      }
      const ys = n.children.map(assignY);
      const yy = ys.reduce((a, b) => a + b, 0) / ys.length;
      positions.set(n.id, { node: n, y: yy });
      return yy;
    };
    assignY(root);
    return { root, leaves, maxHeight: root.height, positions, codes };
  }, [linkage]);

  const H = leaves.length * ROW;
  const W = 260;
  const x = scaleLinear([0, maxHeight * 1.05], [W - LABEL_W, PAD_L]);
  const thresholdDist = threshold * maxHeight;
  const clusters = cutTree(root, thresholdDist);
  const clusterOf = new Map<number, number>();
  clusters.forEach((c, ci) => c.forEach((leaf) => clusterOf.set(leaf, ci)));
  const CLUSTER_COLORS = ['#0d7f9b', '#c26d10', '#6d4fc9', '#0f9d76', '#c34f6b', '#6f8f24'];

  const lines: JSX.Element[] = [];
  const drawNode = (n: DendrogramNode) => {
    if (n.leaf !== null) return;
    const py = positions.get(n.id)!.y;
    const px = x(n.height);
    n.children.forEach((child) => {
      const cy = positions.get(child.id)!.y;
      const cx = x(child.leaf !== null ? 0 : child.height);
      lines.push(<path key={`${n.id}-${child.id}`} d={`M ${px} ${py} L ${px} ${cy} L ${cx} ${cy}`} fill="none" stroke="rgba(52,64,80,0.4)" strokeWidth={0.8} />);
      drawNode(child);
    });
  };
  drawNode(root);

  const codes = visibleArchetypes.map((a) => a.code);
  const winner = result?.primary;
  const secondary = result?.secondary;

  return (
    <ChartFrame
      title={t('viz.dendro.title')}
      description={t('viz.dendro.plain')}
      summary={t('viz.dendro.summary', { linkage: t(`viz.dendro.${linkage}`), clusters: clusters.length })}
      controls={
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex gap-1">
            {LINKAGES.map((l) => (
              <button key={l} className={`rounded px-2 py-1 ${linkage === l ? 'bg-lumina-400 text-void' : 'text-haze'}`} onClick={() => setLinkage(l)} aria-pressed={linkage === l}>
                {t(`viz.dendro.${l}`)}
              </button>
            ))}
          </div>
        </div>
      }
      table={
        <table className="w-full text-left text-xs">
          <thead><tr className="text-haze"><th className="py-1 pr-3">Archetype</th><th className="py-1">Cluster</th></tr></thead>
          <tbody>
            {leaves.map((leaf) => (
              <tr key={leaf} className="border-t border-line/60">
                <td className="py-1 pr-3">{t(`archetypes.${codes[leaf]}.name`)}</td>
                <td className="py-1 font-mono">{(clusterOf.get(leaf) ?? 0) + 1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="mb-3 flex items-center gap-2 text-xs text-haze">
        <span>{t('viz.dendro.threshold')}</span>
        <input type="range" min={0} max={1} step={0.02} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="flex-1" aria-label={t('viz.dendro.threshold')} />
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H + 6}`} className="mx-auto w-full max-w-md" role="img" aria-label={t('viz.dendro.title')}>
          {threshold > 0 && <line x1={x(thresholdDist)} y1={0} x2={x(thresholdDist)} y2={H} stroke="#c26d10" strokeOpacity={0.5} strokeDasharray="3 2" />}
          {lines}
          {leaves.map((leaf) => {
            // leaf node ids equal their original index in hierarchicalCluster
            const py = positions.get(leaf)!.y;
            const isWinner = codes[leaf] === winner;
            const isSecondary = codes[leaf] === secondary;
            const cc = CLUSTER_COLORS[(clusterOf.get(leaf) ?? 0) % CLUSTER_COLORS.length];
            return (
              <g key={leaf}>
                <circle cx={x(0)} cy={py} r={2.4} fill={threshold > 0 ? cc : '#5d6570'} />
                <text
                  x={W - LABEL_W + 4}
                  y={py + 2.5}
                  fontSize={7}
                  fill={isWinner ? '#c26d10' : isSecondary ? '#6d4fc9' : '#262b31'}
                  fontWeight={isWinner || isSecondary ? 'bold' : 'normal'}
                >
                  {codes[leaf]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </ChartFrame>
  );
}
