/**
 * LBTI visualisation palette — light "lab notebook" edition.
 *
 * An original diverging scale (cool → paper-neutral → warm) tuned for the warm
 * paper background, distinguishable for common colour-vision deficiencies
 * (blue vs. amber). Where colour carries meaning, components also provide a
 * non-colour channel (labels, size, ordering, or a data table).
 */
import { interpolateRgbBasis } from 'd3-interpolate';

// cool (low) → paper neutral → warm (high)
const diverging = interpolateRgbBasis([
  '#2f6fb0', // low endpoint — ink blue
  '#7fa3c8',
  '#d4d0c4', // neutral midpoint — warm paper grey
  '#d09a50',
  '#c26d10', // high endpoint — amber
]);

/** Map a 0..100 score to a diverging colour. */
export function scoreColor(score: number): string {
  return diverging(Math.max(0, Math.min(1, score / 100)));
}

/** Map a centred value in [-1, 1] to the diverging colour. */
export function centredColor(z: number): string {
  return diverging(Math.max(0, Math.min(1, (z + 1) / 2)));
}

/** Categorical colours for the five dimension groups (dark enough for paper). */
export const GROUP_COLORS: Record<string, string> = {
  question: '#0e7490',
  evidence: '#6d4fc9',
  execution: '#c26d10',
  collaboration: '#0f9d76',
  sustainability: '#c34f6b',
};

export const SIGNAL = {
  positive: '#c26d10',
  negative: '#2f6fb0',
  neutral: '#8a919c',
  user: '#0e7490',
  primary: '#c26d10',
  secondary: '#6d4fc9',
};

/** Shared SVG chart tokens (axis text, ink text, hairlines) for the paper theme. */
export const CHART = {
  axis: '#5d6570',
  ink: '#262b31',
  hairline: 'rgba(52, 64, 80, 0.25)',
  surface: '#fdfcf8',
};

/** Categorical palette for cluster/family colouring on paper. */
export const CLUSTER_PALETTE = [
  '#0e7490',
  '#c26d10',
  '#6d4fc9',
  '#0f9d76',
  '#c34f6b',
  '#6f8f24',
  '#b8562a',
  '#2f6fb0',
];

export function groupColor(groupId: string): string {
  return GROUP_COLORS[groupId] ?? SIGNAL.neutral;
}
