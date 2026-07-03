/**
 * Content loader. Imports every authored JSON file, validates it against its
 * Zod schema at module load (fail fast on malformed content), and exposes
 * typed, derived views used throughout the app and the scoring engine.
 */
import dimensionsJson from './dimensions/dimensions.json';
import scoringJson from './configuration/scoring-config.json';
import themesJson from './configuration/theme-groups.json';
import archetypesJson from './archetypes/archetypes.json';
import hiddenJson from './configuration/hidden-rules.json';
import {
  ArchetypesFileSchema,
  DimensionsFileSchema,
  HiddenRulesFileSchema,
  ScoringConfigSchema,
  ThemeGroupsSchema,
  type Archetype,
} from './schemas';

export const dimensionsFile = DimensionsFileSchema.parse(dimensionsJson);
export const scoringConfig = ScoringConfigSchema.parse(scoringJson);
export const themeGroups = ThemeGroupsSchema.parse(themesJson);
export const archetypesFile = ArchetypesFileSchema.parse(archetypesJson);
export const hiddenRulesFile = HiddenRulesFileSchema.parse(hiddenJson);

/** Canonical dimension order used for every vector in the app. */
export const dimensionOrder = scoringConfig.dimensionOrder;

/** Per-dimension classifier importance (alpha_d), aligned to dimensionOrder. */
export const dimensionImportance: number[] = dimensionOrder.map((id) => {
  const dim = dimensionsFile.dimensions.find((d) => d.id === id);
  if (!dim) throw new Error(`dimensionOrder references unknown dimension: ${id}`);
  return dim.importance;
});

export const dimensionGroups = dimensionsFile.groups;
export const dimensions = dimensionsFile.dimensions;
export const archetypes: Archetype[] = archetypesFile.archetypes;
export const visibleArchetypes = archetypes.filter((a) => !a.hidden);
export const hiddenArchetypes = archetypes.filter((a) => a.hidden);
export const archetypeByCode = new Map(archetypes.map((a) => [a.code, a] as const));
export const questions = scoringConfig.questions;
export const questionIds = questions.map((q) => q.id);
export const themes = themeGroups.themes;
export const hiddenRules = hiddenRulesFile.rules;

/** Index of a dimension id within dimensionOrder (or -1). */
export const dimensionIndex = (id: string): number => dimensionOrder.indexOf(id);

/**
 * Cross-file referential integrity. Runs in the validate:content step and in a
 * unit test. Returns a list of human-readable problems (empty = valid).
 */
export function validateContentIntegrity(): string[] {
  const problems: string[] = [];
  const dimIds = new Set(dimensionOrder);
  const qIds = new Set(questionIds);
  const codes = new Set(archetypes.map((a) => a.code));

  // dimensionOrder must exactly cover dimensions.json
  if (dimensionOrder.length !== dimensions.length) {
    problems.push('dimensionOrder length does not match dimensions list');
  }
  for (const d of dimensions) {
    if (!dimIds.has(d.id)) problems.push(`dimension ${d.id} missing from dimensionOrder`);
  }

  // group membership must reference real dimensions
  for (const g of dimensionGroups) {
    for (const d of g.dimensions) {
      if (!dimIds.has(d)) problems.push(`group ${g.id} references unknown dimension ${d}`);
    }
  }

  // question weights must reference real dimensions; themes must be known
  const themeSet = new Set(themes);
  for (const q of questions) {
    for (const dim of Object.keys(q.weights)) {
      if (!dimIds.has(dim)) problems.push(`question ${q.id} weights unknown dimension ${dim}`);
    }
    for (const t of q.themes) {
      if (!themeSet.has(t)) problems.push(`question ${q.id} uses unknown theme ${t}`);
    }
  }

  // archetype vectors + collaborator references
  for (const a of archetypes) {
    if (a.vector.length !== dimensionOrder.length) {
      problems.push(`archetype ${a.code} vector length mismatch`);
    }
    if (!codes.has(a.idealCollaborator)) {
      problems.push(`archetype ${a.code} idealCollaborator ${a.idealCollaborator} not found`);
    }
    if (!codes.has(a.difficultCollaborator)) {
      problems.push(`archetype ${a.code} difficultCollaborator ${a.difficultCollaborator} not found`);
    }
  }

  // hidden rules must reference real archetypes, dimensions and questions
  for (const rule of hiddenRules) {
    if (!codes.has(rule.archetype)) {
      problems.push(`hidden rule ${rule.id} targets unknown archetype ${rule.archetype}`);
    }
    for (const cond of rule.conditions) {
      if ('dimension' in cond && !dimIds.has(cond.dimension)) {
        problems.push(`hidden rule ${rule.id} references unknown dimension ${cond.dimension}`);
      }
      if ('questionId' in cond && !qIds.has(cond.questionId)) {
        problems.push(`hidden rule ${rule.id} references unknown question ${cond.questionId}`);
      }
    }
  }

  return problems;
}
