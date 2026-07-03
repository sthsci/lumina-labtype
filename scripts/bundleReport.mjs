/**
 * Tiny bundle-analysis report: lists every dist asset with raw and gzip size.
 * Run with `npm run analyze`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dir = 'dist/assets';
const rows = readdirSync(dir)
  .map((file) => {
    const path = join(dir, file);
    const raw = statSync(path).size;
    const gzip = gzipSync(readFileSync(path)).length;
    return { file, raw, gzip };
  })
  .sort((a, b) => b.gzip - a.gzip);

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
let totalRaw = 0;
let totalGzip = 0;
console.log('asset'.padEnd(44), 'raw'.padStart(10), 'gzip'.padStart(10));
for (const r of rows) {
  totalRaw += r.raw;
  totalGzip += r.gzip;
  console.log(r.file.padEnd(44), kb(r.raw).padStart(10), kb(r.gzip).padStart(10));
}
console.log('—'.repeat(66));
console.log('total'.padEnd(44), kb(totalRaw).padStart(10), kb(totalGzip).padStart(10));
