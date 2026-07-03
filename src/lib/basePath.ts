/**
 * GitHub Pages base-path helpers.
 *
 * Vite injects the configured `base` as import.meta.env.BASE_URL (e.g.
 * "/lumina-labtype/"). React Router uses it as its basename, and absolute asset
 * URLs are built from it. joinBase() is a pure function so it can be unit tested
 * without a bundler.
 */

/** Join the app base with a route/asset path, collapsing duplicate slashes. */
export function joinBase(base: string, path: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`.replace(/\/{2,}/g, '/');
}

/** React Router basename: base without a trailing slash ("" for root). */
export function routerBasename(base: string): string {
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return trimmed === '' ? '/' : trimmed;
}

/** The canonical, absolute site URL for share cards / QR codes. */
export function canonicalUrl(origin: string, base: string): string {
  const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  const b = base.startsWith('/') ? base : `/${base}`;
  return `${cleanOrigin}${b}`.replace(/([^:])\/{2,}/g, '$1/');
}

export const BASE_URL: string =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.BASE_URL : '/';
