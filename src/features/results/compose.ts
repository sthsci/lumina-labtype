/**
 * Deterministic result-prose composition.
 *
 * Assembles a personalised description from authored translation modules only —
 * no generative text. The output is an ordered list of marker-free paragraphs:
 *   base archetype description
 *   + work-context paragraph
 *   + career-stage paragraph
 *   + strongest-dimension paragraph
 *   + most-balanced-dimension paragraph
 *   + primary/secondary interaction paragraph
 *   + entropy + stability paragraph
 */
import { interpolate, hasUnresolvedMarkers } from '@/lib/templates/templates';
import { resolvePath, type LanguageCode, translations } from '@/i18n';
import { dimensionOrder } from '@/data/content';
import type { ScoreResult } from '@/features/scoring/types';
import type { TestContext } from '@/lib/storage/storage';

export interface ComposeOptions {
  stabilityPercent?: number;
}

function str(lang: LanguageCode, key: string): string {
  const v = resolvePath(translations[lang], key);
  return typeof v === 'string' ? v : '';
}

/** Index of the dimension whose score is farthest from the neutral midpoint. */
function strongestDimensionIndex(scores: number[]): number {
  let best = 0;
  let bestDev = -1;
  scores.forEach((s, i) => {
    const dev = Math.abs(s - 50);
    if (dev > bestDev) {
      bestDev = dev;
      best = i;
    }
  });
  return best;
}

/** Index of the dimension whose score is closest to the neutral midpoint. */
function balancedDimensionIndex(scores: number[]): number {
  let best = 0;
  let bestDev = Infinity;
  scores.forEach((s, i) => {
    const dev = Math.abs(s - 50);
    if (dev < bestDev) {
      bestDev = dev;
      best = i;
    }
  });
  return best;
}

export function composeResultProse(
  result: ScoreResult,
  context: TestContext | null,
  lang: LanguageCode,
  opts: ComposeOptions = {},
): string[] {
  const paragraphs: string[] = [];
  const push = (text: string) => {
    if (text && text.trim() !== '') paragraphs.push(text);
  };

  const dimName = (i: number) => str(lang, `dimensions.${dimensionOrder[i]}.name`);
  const dimLow = (i: number) => str(lang, `dimensions.${dimensionOrder[i]}.low`);
  const dimHigh = (i: number) => str(lang, `dimensions.${dimensionOrder[i]}.high`);
  const archName = (code: string) => str(lang, `archetypes.${code}.name`);

  // 1. base description
  push(str(lang, `archetypes.${result.primary}.description`));

  // 2. context field paragraph
  if (context?.field) push(str(lang, `templates.field.${context.field}`));

  // 3. career stage paragraph
  if (context?.stage) push(str(lang, `templates.stage.${context.stage}`));

  // 4. strongest dimension
  const si = strongestDimensionIndex(result.scores);
  const strongEndpoint = result.scores[si] >= 50 ? dimHigh(si) : dimLow(si);
  push(interpolate(str(lang, 'templates.strongest'), { dimension: dimName(si), endpoint: strongEndpoint }));

  // 5. most balanced dimension
  const bi = balancedDimensionIndex(result.scores);
  push(
    interpolate(str(lang, 'templates.balanced'), {
      dimension: dimName(bi),
      low: dimLow(bi),
      high: dimHigh(bi),
    }),
  );

  // 6. primary/secondary interaction
  push(
    interpolate(str(lang, 'templates.interaction'), {
      primary: archName(result.primary),
      secondary: archName(result.secondary),
    }),
  );

  // 7. entropy + stability
  push(str(lang, result.entropy < 0.6 ? 'templates.entropyLow' : 'templates.entropyHigh'));
  if (opts.stabilityPercent !== undefined) {
    const key = opts.stabilityPercent >= 60 ? 'templates.stabilityStable' : 'templates.stabilityMixed';
    push(interpolate(str(lang, key), { stability: Math.round(opts.stabilityPercent) }));
  }

  // guard: never let a raw {marker} escape to the UI
  return paragraphs.filter((p) => !hasUnresolvedMarkers(p));
}
