import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import { visibleArchetypes } from '@/data/content';
import { cutTree, hierarchicalCluster, type DendrogramNode } from '@/lib/mathematics';

const SIZE = 340;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_LEAF = 122;
const FAMILY_COLORS = ['#0d7f9b', '#c26d10', '#6d4fc9', '#0f9d76', '#c34f6b'];
const FAMILY_COUNT = 5;

/**
 * Radial "similarity tree" of archetype prototypes, computed by agglomerative
 * clustering (average linkage) at runtime. Family names are AUTHORED labels for
 * the five mathematical similarity groups — explicitly not biological ancestry.
 */
export function PhylogenyTree({ highlight }: { highlight?: string }) {
  const { t } = useI18n();
  const reduced = useReducedMotion();

  const model = useMemo(() => {
    const codes = visibleArchetypes.map((a) => a.code);
    const root = hierarchicalCluster(visibleArchetypes.map((a) => a.vector), 'average');

    // leaf order + angles
    const leaves: number[] = [];
    const collect = (n: DendrogramNode) =>
      n.leaf !== null ? leaves.push(n.leaf) : n.children.forEach(collect);
    collect(root);
    const angleOf = new Map<number, number>();
    leaves.forEach((leaf, i) => angleOf.set(leaf, (i / leaves.length) * Math.PI * 2 - Math.PI / 2));

    // node angle = mean of descendant leaf angles; radius grows outward with merges
    const nodeAngle = new Map<number, number>();
    const computeAngle = (n: DendrogramNode): number => {
      const a =
        n.leaf !== null
          ? angleOf.get(n.leaf)!
          : n.children.map(computeAngle).reduce((s, v) => s + v, 0) / n.children.length;
      nodeAngle.set(n.id, a);
      return a;
    };
    computeAngle(root);
    const maxH = root.height || 1;
    const radiusOf = (n: DendrogramNode) =>
      n.leaf !== null ? R_LEAF : Math.max(10, R_LEAF * (1 - n.height / maxH) * 0.85);

    // links with depth for staggered growth animation
    const links: { x1: number; y1: number; x2: number; y2: number; depth: number }[] = [];
    const walk = (n: DendrogramNode, depth: number) => {
      const pa = nodeAngle.get(n.id)!;
      const pr = radiusOf(n);
      for (const child of n.children) {
        const ca = nodeAngle.get(child.id)!;
        const cr = radiusOf(child);
        links.push({
          x1: CX + Math.cos(pa) * pr,
          y1: CY + Math.sin(pa) * pr,
          x2: CX + Math.cos(ca) * cr,
          y2: CY + Math.sin(ca) * cr,
          depth,
        });
        walk(child, depth + 1);
      }
    };
    walk(root, 0);

    // cut into exactly FAMILY_COUNT clusters by choosing a threshold between
    // the (k-1)th and kth largest merge heights
    const heights: number[] = [];
    const collectHeights = (n: DendrogramNode) => {
      if (n.leaf === null) {
        heights.push(n.height);
        n.children.forEach(collectHeights);
      }
    };
    collectHeights(root);
    heights.sort((a, b) => b - a);
    const threshold =
      heights.length >= FAMILY_COUNT
        ? (heights[FAMILY_COUNT - 2] + heights[FAMILY_COUNT - 1]) / 2
        : 0;
    const clusters = cutTree(root, threshold);
    const familyOf = new Map<number, number>();
    clusters.forEach((cluster, ci) => cluster.forEach((leaf) => familyOf.set(leaf, ci)));

    // family label anchors: mean angle of member leaves
    const familyLabels = clusters.map((cluster, ci) => {
      const angles = cluster.map((leaf) => angleOf.get(leaf)!);
      const mean = angles.reduce((s, v) => s + v, 0) / angles.length;
      return { ci, angle: mean };
    });

    return { codes, leaves, angleOf, links, familyOf, familyLabels, clusterCount: clusters.length };
  }, []);

  const familyName = (ci: number) => t(`viz.phylogeny.familyNames.f${ci % FAMILY_COUNT}`);
  const familiesText = model.familyLabels.map((f) => familyName(f.ci)).join(' · ');

  return (
    <ChartFrame
      title={t('viz.phylogeny.title')}
      description={t('viz.phylogeny.plain')}
      summary={t('viz.phylogeny.summary', { families: familiesText })}
      table={
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-haze"><th className="py-1 pr-3">Archetype</th><th className="py-1">{t('atlas.familyLabel')}</th></tr>
          </thead>
          <tbody>
            {model.leaves.map((leaf) => (
              <tr key={leaf} className="border-t border-line/60">
                <td className="py-1 pr-3">{t(`archetypes.${model.codes[leaf]}.name`)}</td>
                <td className="py-1">{familyName(model.familyOf.get(leaf) ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-lg" role="img" aria-label={t('viz.phylogeny.title')}>
        <circle cx={CX} cy={CY} r={R_LEAF} fill="none" stroke="rgba(52,64,80,0.08)" />
        {model.links.map((l, i) => (
          <motion.line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="rgba(52,64,80,0.45)"
            strokeWidth={0.9}
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : l.depth * 0.12 }}
          />
        ))}
        {model.leaves.map((leaf) => {
          const a = model.angleOf.get(leaf)!;
          const fx = CX + Math.cos(a) * R_LEAF;
          const fy = CY + Math.sin(a) * R_LEAF;
          const lx = CX + Math.cos(a) * (R_LEAF + 10);
          const ly = CY + Math.sin(a) * (R_LEAF + 10);
          const family = model.familyOf.get(leaf) ?? 0;
          const code = model.codes[leaf];
          const isHl = highlight === code;
          return (
            <g key={leaf}>
              <circle cx={fx} cy={fy} r={isHl ? 5 : 3} fill={FAMILY_COLORS[family % FAMILY_COLORS.length]} stroke={isHl ? '#22262c' : 'none'} strokeWidth={1} />
              <text
                x={lx}
                y={ly}
                fontSize={7}
                fill={isHl ? '#c26d10' : '#454c55'}
                fontWeight={isHl ? 'bold' : 'normal'}
                textAnchor={Math.cos(a) < -0.15 ? 'end' : Math.cos(a) > 0.15 ? 'start' : 'middle'}
                dominantBaseline="middle"
              >
                {code}
              </text>
            </g>
          );
        })}
        {model.familyLabels.map((f) => {
          const lx = CX + Math.cos(f.angle) * (R_LEAF + 38);
          const ly = CY + Math.sin(f.angle) * (R_LEAF + 38);
          return (
            <text
              key={f.ci}
              x={lx}
              y={ly}
              fontSize={7.5}
              fill={FAMILY_COLORS[f.ci % FAMILY_COLORS.length]}
              textAnchor="middle"
              dominantBaseline="middle"
              fontStyle="italic"
            >
              {familyName(f.ci)}
            </text>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-[11px] text-haze">{t('viz.phylogeny.note')}</p>
    </ChartFrame>
  );
}
