/**
 * Content validation for authored data files.
 *
 * Run with `npm run validate:content` (also part of `npm run check` and CI).
 * Validates:
 *   1. every JSON content file against its Zod schema,
 *   2. cross-file referential integrity (questions ↔ dimensions ↔ archetypes ↔ rules),
 *   3. translation completeness: identical key sets, no empty strings, and
 *      coverage of every archetype/question/dimension/theme in all languages.
 */
import { TranslationFileSchema } from '../src/data/schemas';
import {
  archetypes,
  dimensionOrder,
  questionIds,
  themes,
  validateContentIntegrity,
} from '../src/data/content';
import en from '../src/data/translations/en.json';
import zhCN from '../src/data/translations/zh-CN.json';
import zhTW from '../src/data/translations/zh-TW.json';

const problems: string[] = [];

/* 1 + 2. schema parsing happens inside content.ts imports; integrity here */
problems.push(...validateContentIntegrity());

/* 3. translations */
const files = { en, 'zh-CN': zhCN, 'zh-TW': zhTW } as const;

function flatten(obj: unknown, prefix = ''): Map<string, string | string[]> {
  const out = new Map<string, string | string[]>();
  if (Array.isArray(obj)) {
    out.set(prefix, obj as string[]);
    return out;
  }
  if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      for (const [k, v] of flatten(value, prefix ? `${prefix}.${key}` : key)) out.set(k, v);
    }
    return out;
  }
  out.set(prefix, obj as string);
  return out;
}

const flat: Record<string, Map<string, string | string[]>> = {};
for (const [lang, data] of Object.entries(files)) {
  const parsed = TranslationFileSchema.safeParse(data);
  if (!parsed.success) {
    problems.push(`[${lang}] schema: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    continue;
  }
  flat[lang] = flatten(data);
}

if (flat.en) {
  const refKeys = [...flat.en.keys()].sort();
  for (const lang of Object.keys(files)) {
    if (!flat[lang]) continue;
    const keys = new Set(flat[lang].keys());
    for (const k of refKeys) if (!keys.has(k)) problems.push(`[${lang}] missing key: ${k}`);
    for (const k of keys) if (!refKeys.includes(k)) problems.push(`[${lang}] extra key: ${k}`);
    for (const [k, v] of flat[lang]) {
      if (typeof v === 'string' && v.trim() === '') problems.push(`[${lang}] empty string: ${k}`);
      if (Array.isArray(v) && v.some((s) => s.trim() === '')) problems.push(`[${lang}] empty array item: ${k}`);
    }
    // coverage of content entities
    for (const a of archetypes) {
      if (!flat[lang].has(`archetypes.${a.code}.name`)) problems.push(`[${lang}] archetype ${a.code} missing name`);
    }
    for (const q of questionIds) if (!flat[lang].has(`questions.${q}`)) problems.push(`[${lang}] question ${q} missing`);
    for (const d of dimensionOrder) if (!flat[lang].has(`dimensions.${d}.name`)) problems.push(`[${lang}] dimension ${d} missing`);
    for (const th of themes) if (!flat[lang].has(`themes.${th}`)) problems.push(`[${lang}] theme ${th} missing`);
  }
}

if (problems.length > 0) {
  console.error(`✗ Content validation failed with ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log('✓ Content validation passed: schemas, integrity, and 3-language completeness.');
