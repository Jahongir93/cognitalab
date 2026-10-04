// Ma'lumot validatori: barcha reaksiya yozuvlarini tekshiradi va (ixtiyoriy) dvigatel bilan muvofiqlik testini o'tkazadi.
// Ishga tushirish:  node tools/validate_data.mjs [--consistency] [--json report.json] [--category neytrallanish]
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadDB, loadReactions, DATA } from '../tests/engine/load.mjs';
import { Chemistry } from '../frontend/lab/js/engine/chemistry.js';
import { validateAll, CATEGORIES } from './lib/validate.mjs';
import { checkReaction } from './lib/consistency.mjs';
import { checkBalance } from '../frontend/lab/js/engine/formula.js';

const args = process.argv.slice(2);
const wantConsistency = args.includes('--consistency');
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const onlyCat = args.includes('--category') ? args[args.indexOf('--category') + 1] : null;
const quiet = args.includes('--quiet');

const db = loadDB({ withReactions: true });
let reactions = loadReactions();
if (onlyCat) reactions = reactions.filter((r) => r.category === onlyCat);

const eqPath = join(DATA, 'equipment.json');
const ctx = {};
if (existsSync(eqPath)) ctx.equipment = new Set(JSON.parse(readFileSync(eqPath, 'utf8')).items.map((e) => e.id));
const tplPath = join(DATA, 'templates.json');
if (existsSync(tplPath)) ctx.templates = new Set(JSON.parse(readFileSync(tplPath, 'utf8')).templates.map((t) => t.id));

// bazaning o'zi: modda formulalari
const baseErrors = [];
for (const s of Object.values(db.substances)) {
  if (!s.formula) continue;
  try { checkBalance(`${s.formula} = ${s.formula}`); } catch (e) { baseErrors.push(`${s.id}: ${e.message}`); }
}
for (const [k, a, b] of db.formulaCollisions) baseErrors.push(`formula to'qnashuvi: ${k} -> ${a} / ${b}`);

const { results, counts } = validateAll(db, reactions, ctx);
let errCount = 0, warnCount = 0;
const failedIds = new Set();
for (const r of results) {
  if (r.errors.length) { errCount++; failedIds.add(r.id); if (!quiet) console.log(`XATO ${r.id}:\n  - ${r.errors.join('\n  - ')}`); }
  if (r.warnings.length) { warnCount++; if (!quiet && args.includes('--warnings')) console.log(`ogohlantirish ${r.id}: ${r.warnings.join('; ')}`); }
}

let cons = null;
if (wantConsistency) {
  cons = { pass: 0, fail: 0, failures: [] };
  for (const r of reactions) {
    if (failedIds.has(r.id)) continue;
    const chem = new Chemistry(db);
    const res = checkReaction(chem, r);
    if (res.ok) cons.pass++;
    else { cons.fail++; cons.failures.push({ id: r.id, problems: res.problems }); if (!quiet) console.log(`MUVOFIQLIK ${r.id}: ${res.problems.join('; ')}`); }
  }
}

console.log('\nToifalar bo\'yicha:');
let total = 0;
for (const c of CATEGORIES) {
  const n = counts[c.id] || 0;
  total += n;
  const bad = results.filter((r) => r.category === c.id && r.errors.length).length;
  const mid = reactions.filter((r) => r.category === c.id && r.confidence === "o'rta").length;
  console.log(`  ${String(c.n).padStart(2)}. ${c.id.padEnd(26)} ${String(n).padStart(4)} / ${c.target}   xato: ${bad}   o'rta: ${mid}`);
}
console.log(`Jami: ${total} / 1000; validator xatolari: ${errCount}; ogohlantirishlar: ${warnCount}; baza xatolari: ${baseErrors.length}`);
if (baseErrors.length) console.log(baseErrors.slice(0, 20).join('\n'));
if (cons) console.log(`Muvofiqlik testi: o'tdi ${cons.pass}, yiqildi ${cons.fail}`);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ counts, results, consistency: cons, baseErrors }, null, 1));
void readdirSync;
process.exit(errCount || baseErrors.length || (cons && cons.fail) ? 1 : 0);
