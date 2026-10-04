// Node'da ma'lumotlarni yuklash (brauzersiz testlar uchun)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ChemDB } from '../../frontend/lab/js/engine/db.js';
import { Chemistry } from '../../frontend/lab/js/engine/chemistry.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DATA = join(ROOT, 'frontend', 'lab', 'data');
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

export function loadReactions() {
  const dir = join(DATA, 'reactions');
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const j = read(join(dir, f));
    out.push(...(j.reactions || j));
  }
  return out;
}

export function loadDB({ withReactions = true } = {}) {
  return new ChemDB({
    substances: read(join(DATA, 'substances.json')),
    ions: read(join(DATA, 'ions.json')),
    rules: read(join(DATA, 'rules.json')),
    reactions: withReactions ? loadReactions() : [],
  });
}

export function makeChem(opts) {
  const db = loadDB(opts);
  return new Chemistry(db);
}

/** Idishni t soniya davomida dt qadam bilan yangilash */
export function run(chem, v, seconds = 10, env = {}, dt = 0.1) {
  const ev = [];
  for (let t = 0; t < seconds; t += dt) ev.push(...chem.step(v, dt, env));
  return ev;
}
