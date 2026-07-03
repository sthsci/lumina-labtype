import { useMemo } from 'react';
import { createRng } from '@/lib/mathematics';
import type { Emblem } from '@/data/schemas';

interface EmblemProps {
  emblem: Emblem;
  size?: number;
  title?: string;
  className?: string;
}

/**
 * Procedural archetype emblem built from abstract visual primitives
 * (distributions, matrix cells, branching graphs, vector fields, contours,
 * trajectories, grids, network motifs). Fully deterministic from {glyph, seed,
 * hue}; no images, no external assets. Decorative — labelled via <title>.
 */
export function EmblemGlyph({ emblem, size = 96, title, className }: EmblemProps) {
  const { glyph, seed, hue } = emblem;
  const paths = useMemo(() => buildGlyph(glyph, seed), [glyph, seed]);
  const stroke = `hsl(${hue}, 78%, 66%)`;
  const strokeSoft = `hsl(${hue}, 60%, 52%)`;
  const fill = `hsl(${hue}, 70%, 60%)`;
  const gid = `emblem-${glyph}-${seed}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? `${glyph} emblem`}
      className={className}
    >
      <title>{title ?? `${glyph} emblem`}</title>
      <defs>
        <radialGradient id={`${gid}-bg`} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor={`hsl(${hue}, 60%, 24%)`} stopOpacity="0.55" />
          <stop offset="100%" stopColor="rgba(7,10,15,0)" />
        </radialGradient>
        <linearGradient id={`${gid}-line`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={stroke} />
          <stop offset="100%" stopColor={strokeSoft} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill={`url(#${gid}-bg)`} />
      <circle cx="50" cy="50" r="47" fill="none" stroke={strokeSoft} strokeOpacity="0.28" strokeWidth="0.6" />
      <g stroke={`url(#${gid}-line)`} fill={fill}>
        {paths}
      </g>
    </svg>
  );
}

function buildGlyph(glyph: Emblem['glyph'], seed: number): JSX.Element[] {
  const rng = createRng(seed);
  const els: JSX.Element[] = [];

  switch (glyph) {
    case 'distribution': {
      // stacked posterior-like bell curves
      for (let k = 0; k < 3; k += 1) {
        const mu = 34 + rng.next() * 32;
        const sigma = 9 + rng.next() * 7;
        const amp = 26 + k * 4;
        let d = `M 18 78`;
        for (let x = 18; x <= 82; x += 2) {
          const y = 78 - amp * Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));
          d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        els.push(<path key={k} d={d} fill="none" strokeWidth={1.4} strokeOpacity={0.5 + k * 0.18} />);
      }
      break;
    }
    case 'lanes': {
      // gel / pipette-tip lanes with bands
      for (let i = 0; i < 5; i += 1) {
        const x = 24 + i * 13;
        els.push(<line key={`l${i}`} x1={x} y1={20} x2={x} y2={82} strokeWidth={0.6} strokeOpacity={0.35} fill="none" />);
        const bands = 2 + rng.int(0, 2);
        for (let b = 0; b < bands; b += 1) {
          const y = 28 + rng.next() * 48;
          els.push(<rect key={`b${i}-${b}`} x={x - 4} y={y} width={8} height={2.4} rx={1} fillOpacity={0.7} stroke="none" />);
        }
      }
      break;
    }
    case 'network': {
      const nodes = Array.from({ length: 7 }, () => ({ x: 22 + rng.next() * 56, y: 22 + rng.next() * 56 }));
      nodes.forEach((n, i) => {
        const m = nodes[(i + 1 + rng.int(0, 2)) % nodes.length];
        els.push(<line key={`e${i}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y} strokeWidth={0.7} strokeOpacity={0.5} fill="none" />);
      });
      nodes.forEach((n, i) => els.push(<circle key={`n${i}`} cx={n.x} cy={n.y} r={2.4 + rng.next() * 1.6} fillOpacity={0.85} stroke="none" />));
      break;
    }
    case 'grid': {
      for (let i = 0; i <= 6; i += 1) {
        const p = 22 + i * 9.3;
        els.push(<line key={`h${i}`} x1={22} y1={p} x2={78} y2={p} strokeWidth={0.5} strokeOpacity={0.4} fill="none" />);
        els.push(<line key={`v${i}`} x1={p} y1={22} x2={p} y2={78} strokeWidth={0.5} strokeOpacity={0.4} fill="none" />);
      }
      for (let k = 0; k < 5; k += 1) {
        els.push(<rect key={`c${k}`} x={22 + rng.int(0, 5) * 9.3} y={22 + rng.int(0, 5) * 9.3} width={9.3} height={9.3} fillOpacity={0.5} stroke="none" />);
      }
      break;
    }
    case 'contour': {
      for (let k = 0; k < 5; k += 1) {
        const r = 8 + k * 7;
        const wobble = 1 + rng.next() * 2;
        els.push(
          <ellipse key={k} cx={50} cy={50} rx={r} ry={r * (0.8 + rng.next() * 0.3)} transform={`rotate(${wobble * 10} 50 50)`} fill="none" strokeWidth={0.8} strokeOpacity={0.55 - k * 0.06} />,
        );
      }
      break;
    }
    case 'branches': {
      let branchId = 0;
      const grow = (x: number, y: number, angle: number, len: number, depth: number) => {
        if (depth === 0 || len < 4) return;
        const x2 = x + Math.cos(angle) * len;
        const y2 = y + Math.sin(angle) * len;
        branchId += 1;
        els.push(<line key={`br${branchId}`} x1={x} y1={y} x2={x2} y2={y2} strokeWidth={0.5 + depth * 0.25} strokeOpacity={0.7} fill="none" />);
        grow(x2, y2, angle - 0.5 - rng.next() * 0.2, len * 0.7, depth - 1);
        grow(x2, y2, angle + 0.5 + rng.next() * 0.2, len * 0.7, depth - 1);
      };
      grow(50, 82, -Math.PI / 2, 20, 4);
      break;
    }
    case 'matrix': {
      const n = 6;
      const cell = 56 / n;
      for (let r = 0; r < n; r += 1) {
        for (let c = 0; c < n; c += 1) {
          els.push(<rect key={`m${r}-${c}`} x={22 + c * cell} y={22 + r * cell} width={cell - 0.8} height={cell - 0.8} fillOpacity={0.14 + rng.next() * 0.7} stroke="none" />);
        }
      }
      break;
    }
    case 'field': {
      for (let i = 0; i < 6; i += 1) {
        for (let j = 0; j < 6; j += 1) {
          const x = 24 + i * 10.4;
          const y = 24 + j * 10.4;
          const a = Math.atan2(y - 50, x - 50) + Math.PI / 2 + (rng.next() - 0.5) * 0.6;
          const len = 4;
          els.push(<line key={`f${i}-${j}`} x1={x} y1={y} x2={x + Math.cos(a) * len} y2={y + Math.sin(a) * len} strokeWidth={0.7} strokeOpacity={0.55} fill="none" />);
        }
      }
      break;
    }
    case 'trajectory': {
      let x = 22;
      let y = 50;
      let d = `M ${x} ${y}`;
      for (let i = 0; i < 40; i += 1) {
        x += 1.5;
        y += (rng.next() - 0.5) * 10;
        y = Math.max(24, Math.min(76, y));
        d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      els.push(<path key="t" d={d} fill="none" strokeWidth={1.2} strokeOpacity={0.75} />);
      els.push(<circle key="tp" cx={x} cy={y} r={2.6} fillOpacity={0.9} stroke="none" />);
      break;
    }
    case 'orbit': {
      els.push(<circle key="core" cx={50} cy={50} r={4} fillOpacity={0.9} stroke="none" />);
      for (let k = 0; k < 3; k += 1) {
        const r = 12 + k * 10;
        const rot = rng.next() * 180;
        els.push(<ellipse key={`o${k}`} cx={50} cy={50} rx={r} ry={r * 0.42} transform={`rotate(${rot} 50 50)`} fill="none" strokeWidth={0.8} strokeOpacity={0.55} />);
        const a = rng.next() * Math.PI * 2;
        els.push(<circle key={`op${k}`} cx={50 + Math.cos(a) * r} cy={50 + Math.sin(a) * r * 0.42} r={2} fillOpacity={0.85} stroke="none" transform={`rotate(${rot} 50 50)`} />);
      }
      break;
    }
  }
  return els;
}
