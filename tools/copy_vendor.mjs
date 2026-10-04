// Three.js va kerakli addon'larni node_modules'dan frontend/lab/vendor/three/ ga nusxalaydi.
// Ishga tushirish: npm install && npm run vendor
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'three');
const dst = join(root, 'frontend', 'lab', 'vendor', 'three');
const files = [
  'build/three.module.js',
  'build/three.core.js',
  'examples/jsm/controls/OrbitControls.js',
  'examples/jsm/environments/RoomEnvironment.js',
  'examples/jsm/geometries/RoundedBoxGeometry.js',
  'examples/jsm/utils/BufferGeometryUtils.js',
  'LICENSE',
];
for (const f of files) {
  const out = join(dst, f.replace('examples/jsm/', 'addons/'));
  mkdirSync(dirname(out), { recursive: true });
  cpSync(join(src, f), out);
}
const version = JSON.parse(readFileSync(join(src, 'package.json'), 'utf8')).version;
writeFileSync(join(dst, 'VERSION'), version + '\n');
console.log(`three@${version} -> ${dst}`);
