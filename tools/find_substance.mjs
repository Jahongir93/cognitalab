// Bazadan modda/ion qidirish: node tools/find_substance.mjs <so'rov> [so'rov2 ...]
// So'rov formula, id yoki o'zbekcha nomning bir qismi bo'lishi mumkin.
import { loadDB } from '../tests/engine/load.mjs';
const db = loadDB({ withReactions: false });
for (const q of process.argv.slice(2)) {
  const r = db.resolve(q);
  if (r) console.log(`== "${q}" -> ${r.kind} ${r.id}: ${r.data.name_uz} | formula: ${r.data.formula} | holat: ${r.data.state ?? ''} | eruvchanlik: ${r.data.solubility ?? ''}${r.data.precipitate ? ' | cho\'kma: ' + JSON.stringify(r.data.precipitate) : ''}`);
  const ql = q.toLowerCase();
  const hits = [...Object.values(db.substances), ...Object.values(db.ions)].filter((s) => (s.name_uz || '').toLowerCase().includes(ql) || (s.id || '').toLowerCase().includes(ql) || (s.aliases || []).some((a) => a.toLowerCase().includes(ql)));
  for (const s of hits.slice(0, 15)) console.log(`   ${s.id.padEnd(28)} ${s.name_uz}${s.aliases ? '  (alias: ' + s.aliases.join(', ') + ')' : ''}`);
  if (!r && !hits.length) console.log(`-- "${q}" topilmadi`);
}
