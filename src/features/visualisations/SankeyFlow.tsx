import { useMemo, useState } from 'react';
import { ChartFrame } from '@/components/ChartFrame';
import { useI18n } from '@/i18n/I18nProvider';
import { archetypeByCode, dimensionGroups, dimensionOrder, dimensions } from '@/data/content';
import { groupColor } from './palette';
import type { ScoreResult } from '@/features/scoring/types';

const W = 340;
const H = 360;
const COL = [40, 170, 300];

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  h: number;
  color: string;
  kind: 'group' | 'dim' | 'arch';
}

export function SankeyFlow({ result }: { result: ScoreResult }) {
  const { t } = useI18n();
  const [focus, setFocus] = useState<string | null>(null);

  const { nodes, links } = useMemo(() => {
    const nodes: Record<string, Node> = {};
    const links: { from: string; to: string; value: number; color: string }[] = [];

    // groups (col 0)
    const gGap = 8;
    const gH = (H - gGap * (dimensionGroups.length - 1)) / dimensionGroups.length;
    dimensionGroups.forEach((g, i) => {
      nodes[`g:${g.id}`] = {
        id: `g:${g.id}`,
        label: t(`groups.${g.id}.name`),
        x: COL[0],
        y: i * (gH + gGap),
        h: gH,
        color: groupColor(g.id),
        kind: 'group',
      };
    });

    // dimensions (col 1), ordered by group
    const dimGap = 3;
    const dimH = (H - dimGap * (dimensionOrder.length - 1)) / dimensionOrder.length;
    const ordered = dimensionGroups.flatMap((g) => g.dimensions);
    ordered.forEach((id, i) => {
      const group = dimensions.find((d) => d.id === id)!.group;
      nodes[`d:${id}`] = {
        id: `d:${id}`,
        label: t(`dimensions.${id}.name`),
        x: COL[1],
        y: i * (dimH + dimGap),
        h: dimH,
        color: groupColor(group),
        kind: 'dim',
      };
      links.push({ from: `g:${group}`, to: `d:${id}`, value: 1, color: groupColor(group) });
    });

    // top archetypes (col 2)
    const top = result.topFive.slice(0, 5);
    const aGap = 8;
    const aH = (H - aGap * (top.length - 1)) / top.length;
    top.forEach((code, i) => {
      nodes[`a:${code}`] = {
        id: `a:${code}`,
        label: code,
        x: COL[2],
        y: i * (aH + aGap),
        h: aH,
        color: '#f2b054',
        kind: 'arch',
      };
      // dim -> archetype alignment
      const vec = archetypeByCode.get(code)!.vector;
      dimensionOrder.forEach((id, di) => {
        const align = 1 - Math.abs(result.scores[di] - vec[di]) / 100;
        if (align > 0.55) {
          links.push({ from: `d:${id}`, to: `a:${code}`, value: (align - 0.5) * 2, color: '#5c6a7d' });
        }
      });
    });

    return { nodes, links };
  }, [result, t]);

  const isActive = (nodeId: string) => {
    if (!focus) return true;
    if (nodeId === focus) return true;
    return links.some(
      (l) => (l.from === focus && l.to === nodeId) || (l.to === focus && l.from === nodeId),
    );
  };
  const linkActive = (l: { from: string; to: string }) =>
    !focus || l.from === focus || l.to === focus;

  const path = (from: Node, to: Node) => {
    const x1 = from.x + 10;
    const y1 = from.y + from.h / 2;
    const x2 = to.x;
    const y2 = to.y + to.h / 2;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  };

  return (
    <ChartFrame
      title={t('viz.sankey.title')}
      description={t('viz.sankey.plain')}
      summary={t('viz.sankey.summary')}
      table={
        <table className="w-full text-left text-xs">
          <thead><tr className="text-haze"><th className="py-1 pr-3">Group</th><th className="py-1 pr-3">Dimension</th><th className="py-1">Your score</th></tr></thead>
          <tbody>
            {dimensionGroups.flatMap((g) =>
              g.dimensions.map((id) => (
                <tr key={id} className="border-t border-line/60">
                  <td className="py-1 pr-3">{t(`groups.${g.id}.name`)}</td>
                  <td className="py-1 pr-3">{t(`dimensions.${id}.name`)}</td>
                  <td className="py-1 font-mono">{Math.round(result.scores[dimensionOrder.indexOf(id)])}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      }
    >
      <svg viewBox={`0 0 ${W} ${H + 4}`} className="mx-auto w-full max-w-lg" role="img" aria-label={t('viz.sankey.title')}>
        {links.map((l, i) => {
          const from = nodes[l.from];
          const to = nodes[l.to];
          if (!from || !to) return null;
          return (
            <path
              key={i}
              d={path(from, to)}
              fill="none"
              stroke={l.color}
              strokeOpacity={linkActive(l) ? 0.15 + l.value * 0.35 : 0.04}
              strokeWidth={0.6 + l.value * 2.4}
            />
          );
        })}
        {Object.values(nodes).map((n) => (
          <g
            key={n.id}
            onMouseEnter={() => setFocus(n.id)}
            onMouseLeave={() => setFocus(null)}
            onFocus={() => setFocus(n.id)}
            onBlur={() => setFocus(null)}
            tabIndex={0}
            role="img"
            aria-label={n.label}
            style={{ cursor: 'pointer' }}
          >
            <rect x={n.x} y={n.y} width={10} height={n.h} rx={2} fill={n.color} fillOpacity={isActive(n.id) ? 0.95 : 0.25} />
            <text
              x={n.kind === 'arch' ? n.x - 3 : n.x + 13}
              y={n.y + n.h / 2 + 2}
              fontSize={n.kind === 'dim' ? 5.5 : 7}
              fill={isActive(n.id) ? '#e8e2d1' : '#5c6a7d'}
              textAnchor={n.kind === 'arch' ? 'end' : 'start'}
            >
              {n.kind === 'arch' ? n.label : n.label}
            </text>
          </g>
        ))}
      </svg>
    </ChartFrame>
  );
}
