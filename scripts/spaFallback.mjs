/**
 * GitHub Pages SPA route export.
 *
 * Pages serves normal files with a 200 status, but falls back to 404.html for
 * unknown paths. Copying index.html into each app route gives public direct
 * links a proper 200 response. The 404 copy remains as a backup for unexpected
 * paths, where React Router can still render the in-app not-found view.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const routes = [
  'intro',
  'context',
  'test',
  'pipeline',
  'result',
  'ml-lab',
  'atlas',
  'cohort',
  'letterbox',
  'methodology',
  'privacy',
  'disclaimer',
  'about',
];

if (!existsSync('dist/index.html')) {
  console.error('dist/index.html not found — run the build first.');
  process.exit(1);
}

for (const route of routes) {
  mkdirSync(`dist/${route}`, { recursive: true });
  copyFileSync('dist/index.html', `dist/${route}/index.html`);
}

copyFileSync('dist/index.html', 'dist/404.html');
console.log(`✓ Static route pages created: ${routes.length} routes + dist/404.html`);
