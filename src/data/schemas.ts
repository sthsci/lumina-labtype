/**
 * Zod schemas for every authored content file.
 *
 * These run in development (via the content loader), in the `validate:content`
 * build step, and in unit tests. They are the single source of truth for the
 * shape of the JSON data and for the inferred TypeScript types used app-wide.
 */
import { z } from 'zod';

/* ----------------------------- dimensions ------------------------------ */

export const DimensionSchema = z.object({
  id: z.string().min(1),
  group: z.string().min(1),
  importance: z.number().positive(),
});

export const DimensionsFileSchema = z.object({
  version: z.string(),
  groups: z
    .array(
      z.object({
        id: z.string().min(1),
        dimensions: z.array(z.string().min(1)).length(3),
      }),
    )
    .length(5),
  dimensions: z.array(DimensionSchema).length(15),
});

/* --------------------------- scoring config ---------------------------- */

export const QuestionWeightSchema = z.object({
  id: z.string().regex(/^q\d{2}$/),
  weights: z.record(z.string(), z.number()).refine((w) => Object.keys(w).length > 0, {
    message: 'each question must contribute to at least one dimension',
  }),
  themes: z.array(z.string().min(1)).min(1),
});

export const ScoringConfigSchema = z.object({
  version: z.string(),
  dimensionOrder: z.array(z.string().min(1)).length(15),
  softmaxTemperature: z.number().positive(),
  entropyTopK: z.number().int().positive(),
  bootstrap: z.object({
    defaultReplicates: z.number().int().positive(),
    options: z.array(z.number().int().positive()).min(1),
    seed: z.string().min(1),
  }),
  synthetic: z.object({
    defaultPerArchetype: z.number().int().positive(),
    noise: z.number().nonnegative(),
    seed: z.string().min(1),
  }),
  questions: z.array(QuestionWeightSchema).min(30).max(36),
});

/* ----------------------------- theme groups ---------------------------- */

export const ThemeGroupsSchema = z.object({
  version: z.string(),
  themes: z.array(z.string().min(1)).min(1),
});

/* ----------------------------- archetypes ------------------------------ */

export const EmblemSchema = z.object({
  glyph: z.enum([
    'distribution',
    'lanes',
    'network',
    'grid',
    'contour',
    'branches',
    'matrix',
    'field',
    'trajectory',
    'orbit',
  ]),
  seed: z.number().int(),
  hue: z.number().min(0).max(360),
});

export const ArchetypeSchema = z.object({
  code: z.string().min(1),
  hidden: z.boolean(),
  vector: z.array(z.number().min(0).max(100)).length(15),
  emblem: EmblemSchema,
  idealCollaborator: z.string().min(1),
  difficultCollaborator: z.string().min(1),
});

export const ArchetypesFileSchema = z.object({
  version: z.string(),
  comment: z.string().optional(),
  archetypes: z.array(ArchetypeSchema).min(18),
});

/* ---------------------------- hidden rules ----------------------------- */

export const HiddenConditionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('dimensionAbove'), dimension: z.string(), value: z.number() }),
  z.object({ type: z.literal('dimensionBelow'), dimension: z.string(), value: z.number() }),
  z.object({ type: z.literal('answerAtLeast'), questionId: z.string(), value: z.number() }),
  z.object({ type: z.literal('answerAtMost'), questionId: z.string(), value: z.number() }),
]);

export const HiddenRuleSchema = z.object({
  id: z.string().min(1),
  archetype: z.string().min(1),
  conditions: z.array(HiddenConditionSchema).min(1),
});

export const HiddenRulesFileSchema = z.object({
  version: z.string(),
  comment: z.string().optional(),
  rules: z.array(HiddenRuleSchema),
});

/* ---------------------------- translations ----------------------------- */

const ArchetypeContentSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  strengths: z.array(z.string().min(1)).length(3),
  blindSpots: z.array(z.string().min(1)).length(3),
  teamRole: z.string().min(1),
  reviewerTwo: z.string().min(1),
  failureMode: z.string().min(1),
  survivalAdvice: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(3),
  shareCard: z.string().min(1),
});

const DimensionContentSchema = z.object({
  name: z.string().min(1),
  low: z.string().min(1),
  high: z.string().min(1),
  description: z.string().min(1),
});

/**
 * The translation schema is intentionally permissive at the leaves (any nested
 * record of non-empty strings) but strict about the top-level namespaces that
 * MUST exist in every language. Key-for-key parity between languages is checked
 * separately by the translation-completeness test.
 */
const stringTree: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string().min(1), z.array(z.string().min(1)), z.record(z.string(), stringTree)]),
);

export const TranslationFileSchema = z.object({
  meta: z.object({ code: z.string(), name: z.string(), dir: z.enum(['ltr', 'rtl']) }),
  common: z.record(z.string(), stringTree),
  nav: z.record(z.string(), stringTree),
  landing: z.record(z.string(), stringTree),
  intro: z.record(z.string(), stringTree),
  context: z.record(z.string(), stringTree),
  question: z.record(z.string(), stringTree),
  pipeline: z.record(z.string(), stringTree),
  result: z.record(z.string(), stringTree),
  cohort: z.record(z.string(), stringTree),
  mllab: z.record(z.string(), stringTree),
  atlas: z.record(z.string(), stringTree),
  methodology: z.record(z.string(), stringTree),
  privacy: z.record(z.string(), stringTree),
  disclaimer: z.record(z.string(), stringTree),
  about: z.record(z.string(), stringTree),
  viz: z.record(z.string(), stringTree),
  groups: z.record(z.string(), z.object({ name: z.string().min(1), description: z.string().min(1) })),
  dimensions: z.record(z.string(), DimensionContentSchema),
  themes: z.record(z.string(), z.string().min(1)),
  questions: z.record(z.string(), z.string().min(1)),
  archetypes: z.record(z.string(), ArchetypeContentSchema),
  templates: z.record(z.string(), stringTree),
});

/* ------------------------------- types --------------------------------- */

export type DimensionsFile = z.infer<typeof DimensionsFileSchema>;
export type Dimension = z.infer<typeof DimensionSchema>;
export type ScoringConfig = z.infer<typeof ScoringConfigSchema>;
export type QuestionWeight = z.infer<typeof QuestionWeightSchema>;
export type ThemeGroups = z.infer<typeof ThemeGroupsSchema>;
export type Archetype = z.infer<typeof ArchetypeSchema>;
export type ArchetypesFile = z.infer<typeof ArchetypesFileSchema>;
export type Emblem = z.infer<typeof EmblemSchema>;
export type HiddenRule = z.infer<typeof HiddenRuleSchema>;
export type HiddenCondition = z.infer<typeof HiddenConditionSchema>;
export type HiddenRulesFile = z.infer<typeof HiddenRulesFileSchema>;
export type TranslationFile = z.infer<typeof TranslationFileSchema>;
export type ArchetypeContent = z.infer<typeof ArchetypeContentSchema>;
