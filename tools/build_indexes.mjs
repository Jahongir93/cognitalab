// Brauzer uchun yengil indekslar: reactions/index.json (katalog ro'yxati) va reactions/engine.json
// (dvigatelga kerakli maydonlar). To'liq toifa fayllari kerak bo'lganda yuklanadi.
// Faqat validatordan o'tgan yozuvlar indeksga kiradi.
// Ishga tushirish: node tools/build_indexes.mjs
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadDB, loadReactions, DATA } from '../tests/engine/load.mjs';
import { validateAll, CATEGORIES } from './lib/validate.mjs';

const db = loadDB({ withReactions: false });
const reactions = loadReactions();
const ctx = {};
const eqPath = join(DATA, 'equipment.json');
if (existsSync(eqPath)) ctx.equipment = new Set(JSON.parse(readFileSync(eqPath, 'utf8')).items.map((e) => e.id));
const { results } = validateAll(db, reactions, ctx);
const bad = new Set(results.filter((r) => r.errors.length).map((r) => r.id));

const catalog = [];
const engine = [];
for (const r of reactions) {
  if (bad.has(r.id)) continue;
  catalog.push({
    id: r.id, c: r.category, t: r.title_uz, l: r.level, tp: r.topic_uz || null, cf: r.confidence === "o'rta" ? 1 : 0,
    eq: r.equation?.molecular || null, s: (r.reactants || []).map((x) => x.species),
  });
  if (r.engine === 'record') {
    engine.push({
      id: r.id, category: r.category, engine: 'record', title_uz: r.title_uz,
      equation: { molecular: r.equation?.molecular || null, ionic_net: r.equation?.ionic_net || null },
      reactants: (r.reactants || []).map((x) => ({ species: x.species, state: x.state, conc_min_M: x.conc_min_M, conc_max_M: x.conc_max_M })),
      conditions: r.conditions, kinetics: r.kinetics,
      observations: { heat: r.observations?.heat, flame: r.observations?.flame || null, effects: r.observations?.effects || [], precipitate: r.observations?.precipitate || null, gas: r.observations?.gas || null, solution_color_change: r.observations?.solution_color_change || null, text_uz: r.observations?.text_uz || '' },
      ...(r.no_reaction ? { no_reaction: true, match: r.match, explanation_uz: r.explanation_uz } : {}),
      ...(r.blocks_rules === false ? { blocks_rules: false } : {}),
    });
  }
}
const cats = CATEGORIES.map((c) => ({ ...c, count: catalog.filter((x) => x.c === c.id).length, file: `${c.id}.json` }));
writeFileSync(join(DATA, 'reactions', 'index.json'), JSON.stringify({ categories: cats, items: catalog }));
writeFileSync(join(DATA, 'reactions', 'engine.json'), JSON.stringify({ reactions: engine }));
console.log(`katalog: ${catalog.length}, dvigatel yozuvlari: ${engine.length}, chiqarilgan (xato): ${bad.size}`);
