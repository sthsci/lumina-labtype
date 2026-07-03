import { motion } from 'framer-motion';
import { createRng } from '@/lib/mathematics';

/**
 * Lightweight, seeded SVG animation for each pipeline stage. Motion is decorative
 * and honours reduced-motion (renders the settled state with no looping).
 */
export function PipelineStageArt({ stage, reduced }: { stage: string; reduced: boolean }) {
  const rng = createRng(stage);
  const loop = reduced ? undefined : { repeat: Infinity, repeatType: 'reverse' as const, duration: 1.6 };
  const dots = Array.from({ length: 26 }, () => ({
    x: 10 + rng.next() * 80,
    y: 10 + rng.next() * 80,
    r: 0.8 + rng.next() * 2.2,
  }));

  const accent = '#5fdcf7';
  const warm = '#f2b64c';

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label={stage}>
      <title>{stage}</title>

      {stage === 'acquire' && (
        <g>
          {dots.map((d, i) => (
            <motion.circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={accent}
              initial={reduced ? false : { opacity: 0, cx: d.x - 30 }}
              animate={{ opacity: 0.8, cx: d.x }}
              transition={{ delay: reduced ? 0 : i * 0.03, duration: 0.5 }}
            />
          ))}
        </g>
      )}

      {stage === 'qc' && (
        <g>
          <rect x="14" y="14" width="72" height="72" rx="4" fill="none" stroke={accent} strokeOpacity="0.4" />
          <motion.line
            x1="14"
            x2="86"
            y1="20"
            y2="20"
            stroke={accent}
            strokeWidth="1.5"
            animate={reduced ? { y1: 80, y2: 80 } : { y1: [16, 84, 16], y2: [16, 84, 16] }}
            transition={loop}
          />
          {dots.slice(0, 16).map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={1.6} fill={i % 7 === 0 ? warm : accent} opacity="0.7" />
          ))}
        </g>
      )}

      {stage === 'vector' && (
        <g>
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.rect
              key={i}
              x={18 + i * 8}
              width="5"
              rx="1"
              fill={accent}
              initial={reduced ? false : { height: 0, y: 82 }}
              animate={{ height: 12 + ((i * 13) % 50), y: 82 - (12 + ((i * 13) % 50)) }}
              transition={{ delay: reduced ? 0 : i * 0.06, duration: 0.5 }}
            />
          ))}
        </g>
      )}

      {stage === 'normalise' && (
        <g>
          <motion.path
            d="M14 82 Q50 10 86 82"
            fill="none"
            stroke={warm}
            strokeWidth="1.6"
            animate={reduced ? {} : { d: ['M14 82 Q50 10 86 82', 'M14 82 Q50 46 86 82', 'M14 82 Q50 10 86 82'] }}
            transition={loop}
          />
          <line x1="14" y1="82" x2="86" y2="82" stroke={accent} strokeOpacity="0.4" />
        </g>
      )}

      {stage === 'project' && (
        <g>
          <line x1="12" y1="88" x2="88" y2="88" stroke={accent} strokeOpacity="0.4" />
          <line x1="12" y1="88" x2="12" y2="12" stroke={accent} strokeOpacity="0.4" />
          {dots.map((d, i) => (
            <motion.circle
              key={i}
              r={d.r}
              fill={i % 6 === 0 ? warm : accent}
              initial={reduced ? false : { cx: 50, cy: 50, opacity: 0 }}
              animate={{ cx: d.x, cy: d.y, opacity: 0.75 }}
              transition={{ delay: reduced ? 0 : i * 0.02, duration: 0.6 }}
            />
          ))}
        </g>
      )}

      {stage === 'neighbourhood' && (
        <g>
          {dots.slice(0, 6).map((d, i) => (
            <motion.line
              key={i}
              x1="50"
              y1="50"
              x2={d.x}
              y2={d.y}
              stroke={accent}
              strokeOpacity="0.5"
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: reduced ? 0 : i * 0.1, duration: 0.5 }}
            />
          ))}
          <circle cx="50" cy="50" r="3.5" fill={warm} />
          {dots.slice(0, 6).map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={2.4} fill={accent} />
          ))}
        </g>
      )}

      {stage === 'distance' && (
        <g>
          <circle cx="50" cy="50" r="3.5" fill={warm} />
          {[16, 28, 40].map((r, i) => (
            <motion.circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={accent}
              strokeOpacity="0.4"
              animate={reduced ? {} : { r: [r, r + 4, r] }}
              transition={{ ...loop, delay: i * 0.2 }}
            />
          ))}
          {dots.slice(0, 5).map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={2.4} fill={accent} />
          ))}
        </g>
      )}

      {stage === 'stability' && (
        <g>
          {dots.map((d, i) => (
            <motion.circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={i % 5 === 0 ? warm : accent}
              animate={reduced ? { opacity: 0.7 } : { opacity: [0.2, 0.9, 0.2] }}
              transition={{ ...loop, delay: i * 0.05 }}
            />
          ))}
        </g>
      )}

      {stage === 'annotate' && (
        <g>
          <motion.circle
            cx="50"
            cy="50"
            r="26"
            fill="none"
            stroke={warm}
            strokeWidth="1.6"
            initial={reduced ? false : { pathLength: 0, rotate: -90 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduced ? 0 : 1 }}
            style={{ transformOrigin: 'center' }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="6"
            fill={accent}
            initial={reduced ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: reduced ? 0 : 0.4 }}
            style={{ transformOrigin: 'center' }}
          />
        </g>
      )}
    </svg>
  );
}
