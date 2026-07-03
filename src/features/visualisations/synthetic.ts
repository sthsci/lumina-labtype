/**
 * Synthetic reference profiles.
 *
 * These are deterministic, seeded points scattered around each archetype
 * prototype with bounded Gaussian noise. They exist ONLY to make PCA, k-means
 * and clustering views legible — they are NOT real users and never represent
 * real people. All values are clamped to 0..100. Same seed => same points.
 */
import { clamp, createRng } from '@/lib/mathematics';
import { archetypes, dimensionOrder, scoringConfig, visibleArchetypes } from '@/data/content';

export interface SyntheticPoint {
  /** 15-d profile aligned to dimensionOrder. */
  vector: number[];
  /** Archetype code this point was generated around. */
  source: string;
  id: string;
}

export interface SyntheticOptions {
  perArchetype?: number;
  noise?: number;
  seed?: string;
  includeHidden?: boolean;
}

export function generateSyntheticProfiles(options: SyntheticOptions = {}): SyntheticPoint[] {
  const perArchetype = options.perArchetype ?? scoringConfig.synthetic.defaultPerArchetype;
  const noise = options.noise ?? scoringConfig.synthetic.noise;
  const seed = options.seed ?? scoringConfig.synthetic.seed;
  const pool = options.includeHidden ? archetypes : visibleArchetypes;

  const rng = createRng(seed);
  const points: SyntheticPoint[] = [];
  for (const a of pool) {
    for (let i = 0; i < perArchetype; i += 1) {
      const vector = a.vector.map((c) => clamp(c + rng.gaussian() * noise, 0, 100));
      points.push({ vector, source: a.code, id: `${a.code}-syn-${i}` });
    }
  }
  return points;
}

/** Convenience: the archetype prototype matrix aligned to dimensionOrder. */
export function prototypeMatrix(includeHidden = false): { code: string; vector: number[] }[] {
  const pool = includeHidden ? archetypes : visibleArchetypes;
  return pool.map((a) => ({ code: a.code, vector: a.vector.slice() }));
}

export { dimensionOrder };
