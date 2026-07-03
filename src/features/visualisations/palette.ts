/**
 * LUMINA visualisation palette.
 *
 * An original diverging scale (cool → neutral → warm) chosen to stay legible on
 * the dark theme and to remain distinguishable for common colour-vision
 * deficiencies (blue vs. amber). Where colour carries meaning, components also
 * provide a non-colour channel (labels, size, ordering, or a data table).
 */
import { interpolateRgbBasis } from 'd3-interpolate';

// cool (low) → neutral → warm (high)
const diverging = interpolateRgbBasis([
  '#3b82c4', // low endpoint — blue
  '#5a93b8',
  '#5c6a7d', // neutral midpoint — desaturated slate
  '#c58a4e',
  '#f2b054', // high endpoint — amber
]);

/** Map a 0..100 score to a diverging colour. */
export function scoreColor(score: number): string {
  return diverging(Math.max(0, Math.min(1, score / 100)));
}

/** Map a centred value in [-1, 1] to the diverging colour. */
export function centredColor(z: number): string {
  return diverging(Math.max(0, Math.min(1, (z + 1) / 2)));
}

/** Categorical colours for the five dimension groups. */
export const GROUP_COLORS: Record<string, string> = {
  question: '#5fdcf7',
  evidence: '#8f7bff',
  execution: '#f2b054',
  collaboration: '#4ad6a8',
  sustainability: '#ef7d8f',
};

export const SIGNAL = {
  positive: '#f2a24c',
  negative: '#4aa9ff',
  neutral: '#7d8aa0',
  user: '#5fdcf7',
  primary: '#f2b054',
  secondary: '#8f7bff',
};

export function groupColor(groupId: string): string {
  return GROUP_COLORS[groupId] ?? SIGNAL.neutral;
}
