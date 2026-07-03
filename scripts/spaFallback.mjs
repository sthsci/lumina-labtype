/**
 * GitHub Pages SPA fallback.
 *
 * Pages serves 404.html for unknown paths. Copying the built index.html to
 * 404.html means a direct visit to e.g. /lumina-labtype/result loads the app,
 * and React Router then renders the right view. Runs automatically after
 * `npm run build`.
 */
import { copyFileSync, existsSync } from 'node:fs';

if (!existsSync('dist/index.html')) {
  console.error('dist/index.html not found — run the build first.');
  process.exit(1);
}
copyFileSync('dist/index.html', 'dist/404.html');
console.log('✓ SPA fallback created: dist/404.html');
