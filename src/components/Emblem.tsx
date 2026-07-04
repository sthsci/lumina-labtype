import { useMemo } from 'react';
import { createRng } from '@/lib/mathematics';
import type { Emblem } from '@/data/schemas';

interface EmblemProps {
  emblem: Emblem;
  /** Archetype code — selects the hand-drawn iconic motif. */
  code?: string;
  size?: number;
  title?: string;
  className?: string;
}

/**
 * LBTI archetype emblems — "specimen badge" system.
 *
 * Each archetype gets a hand-authored, iconic lab motif (pipette, gel lanes,
 * flow gate, posterior curve, commit graph, phase orbit …) drawn flat on a
 * hue-tinted paper disc. Deterministic, no images, no glow. Unknown codes fall
 * back to the older seeded procedural glyphs so nothing ever renders empty.
 */
export function EmblemGlyph({ emblem, code, size = 96, title, className }: EmblemProps) {
  const { glyph, seed, hue } = emblem;

  // badge palette derived from the archetype hue family
  const deep = `hsl(${hue}, 52%, 30%)`;
  const mid = `hsl(${hue}, 46%, 46%)`;
  const soft = `hsl(${hue}, 42%, 72%)`;
  const tint = `hsl(${hue}, 45%, 93%)`;
  const accent = '#c77414';
  const ink = '#2a2e33';

  const motif = code ? MOTIFS[code] : undefined;
  const fallback = useMemo(
    () => (motif ? null : buildFallbackGlyph(glyph, seed)),
    [motif, glyph, seed],
  );

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? code ?? `${glyph} emblem`}
      className={className}
    >
      <title>{title ?? code ?? `${glyph} emblem`}</title>
      {/* specimen disc */}
      <circle cx="50" cy="50" r="47" fill={tint} />
      <circle cx="50" cy="50" r="47" fill="none" stroke={deep} strokeOpacity="0.85" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="41.5" fill="none" stroke={deep} strokeOpacity="0.2" strokeWidth="1" />
      {motif ? (
        motif({ deep, mid, soft, accent, ink })
      ) : (
        <g stroke={mid} fill={mid}>
          {fallback}
        </g>
      )}
    </svg>
  );
}

interface MotifColors {
  deep: string;
  mid: string;
  soft: string;
  accent: string;
  ink: string;
}
type MotifFn = (c: MotifColors) => JSX.Element;

/* ------------------------------------------------------------------ *
 * 21 iconic motifs, one per archetype code. Flat editorial drawing,   *
 * strong silhouette, 2–3 colours, all inside r≈36 of centre (50,50).  *
 * ------------------------------------------------------------------ */
const MOTIFS: Record<string, MotifFn> = {
  /* Prior Alchemist — dashed wide prior morphing into a sharp posterior */
  BAYES: ({ deep, mid, accent }) => (
    <g fill="none">
      <line x1="22" y1="72" x2="78" y2="72" stroke={deep} strokeWidth="1.6" />
      <path d="M24 71 Q40 52 50 51 Q60 52 76 71" stroke={mid} strokeWidth="2" strokeDasharray="4 3" />
      <path d="M30 71 Q48 24 56 24 Q64 24 72 71" stroke={deep} strokeWidth="3" />
      <line x1="56" y1="71" x2="56" y2="26" stroke={accent} strokeWidth="1.6" strokeDasharray="2 3" />
      <circle cx="56" cy="24" r="3" fill={accent} stroke="none" />
    </g>
  ),

  /* Precision Operator — pipette with droplet and volume ticks */
  PIPET: ({ deep, mid, soft, accent }) => (
    <g>
      <rect x="45" y="20" width="10" height="8" rx="2" fill={deep} />
      <rect x="46.5" y="28" width="7" height="26" rx="2" fill={mid} />
      <path d="M48 54 L52 54 L50.8 68 L49.2 68 Z" fill={deep} />
      <g stroke={soft} strokeWidth="1.4">
        <line x1="46.5" y1="34" x2="50" y2="34" />
        <line x1="46.5" y1="40" x2="50" y2="40" />
        <line x1="46.5" y1="46" x2="50" y2="46" />
      </g>
      <path d="M50 72 Q46.8 76.5 50 79 Q53.2 76.5 50 72Z" fill={accent} />
      <circle cx="33" cy="66" r="1.8" fill={soft} />
      <circle cx="67" cy="62" r="1.8" fill={soft} />
    </g>
  ),

  /* Reviewer Two Reincarnated — magnifier scrutinising gel bands */
  R2D2: ({ deep, mid, soft, accent }) => (
    <g>
      <g fill={soft}>
        <rect x="26" y="30" width="14" height="4" rx="2" />
        <rect x="26" y="44" width="14" height="4" rx="2" />
        <rect x="26" y="58" width="14" height="4" rx="2" />
        <rect x="46" y="30" width="14" height="4" rx="2" />
        <rect x="46" y="58" width="14" height="4" rx="2" />
      </g>
      <rect x="46" y="44" width="14" height="4" rx="2" fill={accent} />
      <circle cx="53" cy="46" r="13" fill="none" stroke={deep} strokeWidth="3.2" />
      <line x1="62.5" y1="55.5" x2="74" y2="67" stroke={deep} strokeWidth="4.4" strokeLinecap="round" />
      <text x="53" y="50.5" textAnchor="middle" fontSize="11" fontWeight="700" fill={mid} fontFamily="Georgia, serif">?</text>
    </g>
  ),

  /* Diagram Architect — boxes-and-arrows mechanism, one arrow still dashed */
  FIG1: ({ deep, mid, accent }) => (
    <g fill="none" strokeWidth="2">
      <rect x="24" y="26" width="18" height="13" rx="2.5" stroke={deep} fill="none" />
      <rect x="58" y="26" width="18" height="13" rx="2.5" stroke={deep} fill="none" />
      <rect x="41" y="59" width="18" height="13" rx="2.5" stroke={mid} fill="none" />
      <line x1="42" y1="32.5" x2="56" y2="32.5" stroke={deep} markerEnd="none" />
      <path d="M53 30 L57 32.5 L53 35Z" fill={deep} stroke="none" />
      <path d="M33 40 Q33 52 44 62" stroke={mid} />
      <path d="M40.5 59.5 L45.5 63.5 L39.5 64.5Z" fill={mid} stroke="none" />
      <path d="M67 40 Q67 52 57 61" stroke={accent} strokeDasharray="3.5 3" />
      <path d="M59.5 57.5 L55 63 L61.5 62.5Z" fill={accent} stroke="none" />
    </g>
  ),

  /* Null Result Guardian — error bars straddling a zero line, proudly flat */
  NULL: ({ deep, mid, accent }) => (
    <g fill="none">
      <circle cx="50" cy="49" r="26" stroke={mid} strokeOpacity="0.35" strokeWidth="1.5" />
      <line x1="26" y1="49" x2="74" y2="49" stroke={accent} strokeWidth="2" strokeDasharray="5 3" />
      {[34, 50, 66].map((x, i) => (
        <g key={i} stroke={deep} strokeWidth="2.2">
          <line x1={x} y1={49 - 10 - i} x2={x} y2={49 + 10 + i} />
          <line x1={x - 4} y1={49 - 10 - i} x2={x + 4} y2={49 - 10 - i} />
          <line x1={x - 4} y1={49 + 10 + i} x2={x + 4} y2={49 + 10 + i} />
          <circle cx={x} cy="49" r="2.6" fill={deep} stroke="none" />
        </g>
      ))}
    </g>
  ),

  /* Version-Control Paladin — branching commit graph, merged and tidy */
  GIT: ({ deep, mid, accent }) => (
    <g fill="none" strokeWidth="2.6">
      <path d="M35 76 L35 24" stroke={deep} />
      <path d="M35 62 Q35 46 55 44 L55 38" stroke={mid} />
      <path d="M55 30 Q55 22 42 22" stroke={mid} strokeOpacity="0" />
      <path d="M35 36 Q35 30 35 30" stroke={deep} />
      <path d="M55 38 Q55 28 38 26" stroke={mid} />
      {[
        [35, 72, deep],
        [35, 52, deep],
        [35, 26, deep],
        [55, 38, mid],
      ].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={y as number} r="4.4" fill="#fdfcf8" stroke={c as string} />
      ))}
      <circle cx="55" cy="58" r="4.4" fill={accent} stroke={accent} />
      <path d="M63 68 l4 4 l7 -8" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  ),

  /* Spreadsheet Sorcerer — grid with a glowing Σ cell */
  EXCEL: ({ deep, mid, soft, accent }) => (
    <g>
      <rect x="26" y="27" width="48" height="46" rx="3" fill="none" stroke={deep} strokeWidth="2.2" />
      <g stroke={mid} strokeWidth="1.2" strokeOpacity="0.75">
        <line x1="26" y1="39" x2="74" y2="39" />
        <line x1="26" y1="50" x2="74" y2="50" />
        <line x1="26" y1="61" x2="74" y2="61" />
        <line x1="42" y1="27" x2="42" y2="73" />
        <line x1="58" y1="27" x2="58" y2="73" />
      </g>
      <rect x="27" y="28" width="47" height="11" fill={soft} fillOpacity="0.6" />
      <rect x="58.8" y="50.8" width="14.4" height="10.2" fill={accent} fillOpacity="0.9" />
      <text x="66" y="59" textAnchor="middle" fontSize="8.6" fontWeight="700" fill="#fdfcf8" fontFamily="Georgia, serif">Σ</text>
      <circle cx="34" cy="45" r="1.7" fill={deep} />
      <circle cx="50" cy="56" r="1.7" fill={deep} />
      <circle cx="34" cy="67" r="1.7" fill={deep} />
    </g>
  ),

  /* Ask-Everything Explorer — compass of radiating enquiry rays */
  OMNI: ({ deep, mid, soft, accent }) => (
    <g fill="none">
      <circle cx="50" cy="50" r="5" fill={deep} stroke="none" />
      {[
        [50, 22, deep, 3],
        [76, 42, mid, 2.4],
        [70, 70, accent, 2.4],
        [50, 79, mid, 2],
        [27, 65, soft, 2],
        [24, 36, mid, 2.4],
      ].map(([x, y, c, w], i) => (
        <g key={i}>
          <line x1="50" y1="50" x2={x as number} y2={y as number} stroke={c as string} strokeWidth={w as number} />
          <circle cx={x as number} cy={y as number} r={3} fill={c as string} stroke="none" />
        </g>
      ))}
    </g>
  ),

  /* Deadline Nocturnalist — moon over a midnight culture flask */
  NIGHT: ({ deep, mid, soft, accent }) => (
    <g>
      <path d="M67 24 A12.5 12.5 0 1 0 79 40 A10 10 0 0 1 67 24Z" fill={accent} />
      <circle cx="30" cy="30" r="1.7" fill={soft} />
      <circle cx="40" cy="22" r="1.3" fill={soft} />
      <path d="M44 36 L56 36 L56 47 L67 68 A4 4 0 0 1 63.5 74 L36.5 74 A4 4 0 0 1 33 68 L44 47 Z" fill="none" stroke={deep} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M39.5 62 L60.5 62 L64 69 A2.2 2.2 0 0 1 62 71.5 L38 71.5 A2.2 2.2 0 0 1 36 69 Z" fill={mid} />
      <circle cx="47" cy="58" r="1.8" fill={mid} />
      <circle cx="54" cy="55" r="1.4" fill={mid} />
    </g>
  ),

  /* Reproducibility Inspector — three identical dishes, stamped ✓ */
  REPRO: ({ deep, mid, accent }) => (
    <g fill="none">
      {[
        [34, 38],
        [66, 38],
        [50, 64],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="14" stroke={i === 2 ? deep : mid} strokeWidth="2.4" />
          <circle cx={x - 4} cy={y - 3} r="2.6" fill={i === 2 ? deep : mid} stroke="none" />
          <circle cx={x + 4} cy={y + 4} r="1.9" fill={i === 2 ? deep : mid} stroke="none" />
        </g>
      ))}
      <path d="M58 66 l4.5 4.5 l8 -9" stroke={accent} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),

  /* Eternal Experiment Extender — checklist that never quite ends */
  TODO: ({ deep, mid, soft, accent }) => (
    <g>
      <rect x="30" y="22" width="40" height="56" rx="4" fill="none" stroke={deep} strokeWidth="2.4" />
      <rect x="42" y="18" width="16" height="7" rx="2.5" fill={deep} />
      {[34, 46, 58].map((y, i) => (
        <g key={i}>
          <rect x="36" y={y} width="7" height="7" rx="1.5" fill="none" stroke={mid} strokeWidth="1.8" />
          <line x1="47" y1={y + 3.5} x2="64" y2={y + 3.5} stroke={soft} strokeWidth="2.4" />
          {i < 2 && <path d={`M37.5 ${y + 3.5} l2 2.4 l3.4 -4.6`} fill="none" stroke={mid} strokeWidth="1.8" />}
        </g>
      ))}
      <rect x="36" y="70" width="7" height="7" rx="1.5" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="2.5 2" transform="translate(0,-2)" />
      <text x="55" y="74.5" fontSize="8" fill={accent} fontFamily="Georgia, serif" fontStyle="italic">+1…</text>
    </g>
  ),

  /* Strategic Pivot Specialist — trajectory with a decisive right-angle pivot */
  ESC: ({ deep, mid, accent }) => (
    <g fill="none">
      <path d="M24 70 L56 70" stroke={mid} strokeWidth="3" strokeDasharray="6 4" />
      <path d="M56 70 Q62 70 62 64 L62 32" stroke={deep} strokeWidth="3.4" />
      <path d="M56.5 38 L62 28 L67.5 38Z" fill={deep} stroke="none" />
      <circle cx="24" cy="70" r="3.4" fill={mid} stroke="none" />
      <g stroke={accent} strokeWidth="1.8">
        <line x1="68" y1="66" x2="74" y2="66" />
        <line x1="70" y1="72" x2="76" y2="72" />
      </g>
    </g>
  ),

  /* Model-Universe Builder — phase-portrait orbits around an attractor */
  MODEL: ({ deep, mid, accent }) => (
    <g fill="none">
      <ellipse cx="50" cy="50" rx="27" ry="15" stroke={mid} strokeWidth="2" transform="rotate(-18 50 50)" />
      <ellipse cx="50" cy="50" rx="18" ry="9.5" stroke={deep} strokeWidth="2.4" transform="rotate(-18 50 50)" />
      <ellipse cx="50" cy="50" rx="9" ry="4.6" stroke={deep} strokeWidth="2" transform="rotate(-18 50 50)" strokeOpacity="0.6" />
      <circle cx="50" cy="50" r="3.4" fill={accent} stroke="none" />
      <path d="M73 36 L78 42 L70.5 43Z" fill={mid} stroke="none" />
      <circle cx="30" cy="66" r="2.4" fill={deep} stroke="none" />
    </g>
  ),

  /* Funding Summoner — sealed proposal with a rising sparkline */
  GRANT: ({ deep, mid, soft, accent }) => (
    <g>
      <rect x="30" y="24" width="40" height="52" rx="3.5" fill="none" stroke={deep} strokeWidth="2.4" />
      <g stroke={soft} strokeWidth="2.2">
        <line x1="37" y1="34" x2="63" y2="34" />
        <line x1="37" y1="41" x2="57" y2="41" />
      </g>
      <path d="M36 64 L45 56 L52 60 L64 47" fill="none" stroke={mid} strokeWidth="2.6" />
      <path d="M59.5 46.5 L65.5 45.5 L64 51.5Z" fill={mid} />
      <circle cx="62" cy="68" r="7.5" fill={accent} />
      <path d="M59 68 l2.2 2.2 l4-4.6" fill="none" stroke="#fdfcf8" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ),

  /* Early-Release Sprinter — paper plane, speed lines, v1 tag */
  PREPRINT: ({ deep, mid, accent }) => (
    <g>
      <path d="M28 54 L74 30 L58 68 L50 54 Z" fill="none" stroke={deep} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M74 30 L50 54" stroke={deep} strokeWidth="2" />
      <path d="M50 54 L48 66 L54 60" fill="none" stroke={mid} strokeWidth="2" strokeLinejoin="round" />
      <g stroke={mid} strokeWidth="2" strokeLinecap="round">
        <line x1="24" y1="40" x2="34" y2="40" />
        <line x1="20" y1="47" x2="30" y2="47" />
      </g>
      <rect x="58" y="66" width="16" height="10" rx="2.5" fill={accent} />
      <text x="66" y="73.6" textAnchor="middle" fontSize="7.2" fontWeight="700" fill="#fdfcf8" fontFamily="Menlo, monospace">v1</text>
    </g>
  ),

  /* Independent Research Hermit — one luminous cell in a wide quiet field */
  SOLO: ({ deep, mid, soft }) => (
    <g fill="none">
      <circle cx="50" cy="50" r="30" stroke={soft} strokeWidth="1.8" strokeDasharray="4 5" />
      <circle cx="50" cy="50" r="12" fill={mid} fillOpacity="0.25" stroke={deep} strokeWidth="2.6" />
      <circle cx="46.5" cy="47" r="4.6" fill={deep} stroke="none" />
      <circle cx="56" cy="54" r="1.8" fill={deep} stroke="none" />
    </g>
  ),

  /* Control Condition Guardian — paired tubes, + and − */
  CONTROL: ({ deep, mid, soft, accent }) => (
    <g>
      {[
        [40, true],
        [60, false],
      ].map(([x, filled], i) => (
        <g key={i}>
          <path
            d={`M${(x as number) - 6} 28 L${(x as number) - 6} 62 A6 6 0 0 0 ${(x as number) + 6} 62 L${(x as number) + 6} 28`}
            fill="none"
            stroke={deep}
            strokeWidth="2.4"
          />
          <line x1={(x as number) - 9} y1="28" x2={(x as number) + 9} y2="28" stroke={deep} strokeWidth="2.4" />
          {filled ? (
            <path d={`M${(x as number) - 6} 46 L${(x as number) + 6} 46 L${(x as number) + 6} 62 A6 6 0 0 1 ${(x as number) - 6} 62Z`} fill={mid} />
          ) : (
            <path d={`M${(x as number) - 6} 56 L${(x as number) + 6} 56 L${(x as number) + 6} 62 A6 6 0 0 1 ${(x as number) - 6} 62Z`} fill={soft} />
          )}
        </g>
      ))}
      <text x="40" y="78.5" textAnchor="middle" fontSize="10" fontWeight="700" fill={accent} fontFamily="Menlo, monospace">+</text>
      <text x="60" y="78" textAnchor="middle" fontSize="10" fontWeight="700" fill={deep} fontFamily="Menlo, monospace">−</text>
    </g>
  ),

  /* Workflow Tamer — pipeline of valves flowing left to right */
  PIPELINE: ({ deep, mid, accent }) => (
    <g fill="none">
      <path d="M22 50 L78 50" stroke={mid} strokeWidth="3" />
      {[30, 50, 70].map((x, i) => (
        <circle key={i} cx={x} cy="50" r="7.5" fill="#fdfcf8" stroke={deep} strokeWidth="2.6" />
      ))}
      <circle cx="30" cy="50" r="3" fill={deep} stroke="none" />
      <circle cx="50" cy="50" r="3" fill={deep} stroke="none" />
      <path d="M67 47 L74 50 L67 53Z" fill={accent} stroke="none" />
      <path d="M30 42.5 L30 34 L50 34 L50 42.5" stroke={mid} strokeWidth="2" strokeDasharray="3 2.5" />
      <path d="M50 57.5 L50 66 L70 66 L70 57.5" stroke={mid} strokeWidth="2" strokeDasharray="3 2.5" />
    </g>
  ),

  /* You Became the Supervisor — org tree crowned with a calendar star */
  PI: ({ deep, mid, soft, accent }) => (
    <g fill="none">
      <path d="M50 34 L50 44 M50 44 L34 54 M50 44 L66 54" stroke={mid} strokeWidth="2.2" />
      <circle cx="50" cy="28" r="8" fill={accent} stroke="none" />
      <path d="M50 23.5 l1.6 3.3 3.6 .4 -2.7 2.5 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.7 -2.5 3.6 -.4Z" fill="#fdfcf8" />
      <circle cx="34" cy="60" r="6.5" fill="#fdfcf8" stroke={deep} strokeWidth="2.2" />
      <circle cx="66" cy="60" r="6.5" fill="#fdfcf8" stroke={deep} strokeWidth="2.2" />
      <g stroke={soft} strokeWidth="1.8">
        <line x1="30" y1="74" x2="38" y2="74" />
        <line x1="62" y1="74" x2="70" y2="74" />
      </g>
    </g>
  ),

  /* Meeting Invisibility Specialist — a cell fading out of the frame */
  GHOST: ({ deep, mid, soft }) => (
    <g fill="none">
      <circle cx="42" cy="48" r="15" stroke={deep} strokeWidth="2.4" strokeDasharray="6 4" />
      <circle cx="38.5" cy="44.5" r="4" fill={mid} fillOpacity="0.5" stroke="none" />
      <circle cx="63" cy="56" r="9" stroke={mid} strokeWidth="1.8" strokeDasharray="3.5 4.5" strokeOpacity="0.65" />
      <circle cx="75" cy="62" r="4.5" stroke={soft} strokeWidth="1.5" strokeDasharray="2.5 4" />
      <line x1="28" y1="70" x2="46" y2="70" stroke={soft} strokeWidth="2" strokeLinecap="round" />
    </g>
  ),

  /* Presentation-First Perfectionist — framed figure with a sparkle */
  POLISH: ({ deep, mid, soft, accent }) => (
    <g>
      <rect x="27" y="30" width="46" height="36" rx="3" fill="none" stroke={deep} strokeWidth="2.6" />
      <rect x="31" y="34" width="38" height="28" rx="1.5" fill={soft} fillOpacity="0.45" />
      <path d="M34 56 L44 46 L52 52 L64 40" fill="none" stroke={mid} strokeWidth="2.4" />
      <path d="M68 26 l1.9 4.6 4.6 1.9 -4.6 1.9 -1.9 4.6 -1.9 -4.6 -4.6 -1.9 4.6 -1.9Z" fill={accent} />
      <line x1="38" y1="72" x2="62" y2="72" stroke={mid} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  ),
};

/* ---------------- fallback: legacy procedural glyphs ------------------- */

function buildFallbackGlyph(glyph: Emblem['glyph'], seed: number): JSX.Element[] {
  const rng = createRng(seed);
  const els: JSX.Element[] = [];

  switch (glyph) {
    case 'distribution': {
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
