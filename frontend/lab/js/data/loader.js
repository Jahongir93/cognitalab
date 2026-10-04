// Ma'lumotlarni yuklash. Asosiy fayllar boshida, toifalar bo'yicha to'liq tajriba fayllari kerak bo'lganda.
import { ChemDB } from '../engine/db.js';
import { checkBalance } from '../engine/formula.js';

const BASE = new URL('../../data/', import.meta.url);
const cache = new Map();

async function json(path) {
  if (cache.has(path)) return cache.get(path);
  const p = fetch(new URL(path, BASE)).then((r) => {
    if (!r.ok) throw new Error(`${path}: ${r.status}`);
    return r.json();
  });
  cache.set(path, p);
  return p;
}

/** Laboratoriya ishga tushishi uchun kerakli ma'lumotlar */
export async function loadCore(onProgress = () => {}) {
  const files = ['substances.json', 'ions.json', 'rules.json', 'equipment.json', 'ports.json', 'templates.json', 'reactions/index.json', 'reactions/engine.json', 'mechanisms.json'];
  const out = {};
  let done = 0;
  await Promise.all(files.map(async (f) => {
    try { out[f] = await json(f); } catch (e) { if (!['templates.json', 'mechanisms.json'].includes(f)) throw e; out[f] = null; }
    onProgress(++done / files.length);
  }));
  // dvigatel yozuvlarini yengil tekshirish: balanssiz yoki tahlil qilinmaydiganlari tashlab yuboriladi
  const engineRecs = (out['reactions/engine.json']?.reactions || []).filter((r) => {
    const eq = r.equation?.ionic_net || r.equation?.molecular;
    if (!eq) return !!r.no_reaction;
    try { return checkBalance(eq).ok; } catch { return false; }
  });
  const db = new ChemDB({ substances: out['substances.json'], ions: out['ions.json'], rules: out['rules.json'], reactions: engineRecs });
  return {
    db,
    equipment: out['equipment.json'],
    ports: out['ports.json'],
    templates: out['templates.json']?.templates || [],
    mechanisms: out['mechanisms.json'] || { templates: {} },
    catalog: out['reactions/index.json'],
  };
}

/** Toifa faylidagi to'liq tajribalar */
export async function loadCategory(category) {
  const j = await json(`reactions/${category}.json`);
  return j.reactions || [];
}

/** Bitta tajriba (to'liq yozuv) */
export async function loadReaction(catalog, id) {
  const item = catalog.items.find((x) => x.id === id);
  if (!item) return null;
  const list = await loadCategory(item.c);
  return list.find((r) => r.id === id) || null;
}
