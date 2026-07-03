/**
 * Deterministic template interpolation for personalised result prose.
 *
 * Result text is assembled from authored modules (never generative AI). A
 * template is a string with {placeholder} markers; interpolate() replaces them
 * from a typed variables object. hasUnresolvedMarkers() is used by a runtime
 * guard and a test so no raw {marker} ever reaches the interface.
 */

export type TemplateVars = Record<string, string | number>;

const MARKER = /\{(\w+)\}/g;

export function interpolate(template: string, vars: TemplateVars): string {
  return template.replace(MARKER, (whole, key: string) => {
    const value = vars[key];
    return value === undefined ? whole : String(value);
  });
}

/** True if the string still contains an unresolved {marker}. */
export function hasUnresolvedMarkers(text: string): boolean {
  MARKER.lastIndex = 0;
  return MARKER.test(text);
}

/** List the marker names referenced by a template. */
export function markersIn(template: string): string[] {
  const names: string[] = [];
  let match: RegExpExecArray | null;
  MARKER.lastIndex = 0;
  while ((match = MARKER.exec(template)) !== null) names.push(match[1]);
  return names;
}
