// Qoidaga asoslangan toifalar generatorlari uchun umumiy yordamchilar.
// Natija — oddiy JSON yozuvlar (frontend/lab/data/reactions/<toifa>.json). Generator faqat boshlang'ich to'ldirish uchun.
import { writeFileSync, renameSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDB } from '../../../tests/engine/load.mjs';
import { balance, eqText } from '../../lib/balance.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const db = loadDB({ withReactions: false });

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const sub = (id) => {
  const s = db.substances[id];
  if (!s) throw new Error(`modda yo'q: ${id}`);
  return s;
};
export const nameOf = (id) => (db.substances[id] ? db.substances[id].name_uz : db.ions[id].name_uz);
/** Qavs ichidagi izohsiz qisqa nom: "natriy gidroksid (o'yuvchi natriy)" -> "natriy gidroksid" */
export const shortName = (id) => nameOf(id).replace(/\s*\(.*\)\s*$/, '');
export const formulaOf = (id) => (db.substances[id] ? db.substances[id].formula : db.ions[id].formula);
export const pretty = (id) => db.displayOf(id);

/**
 * Had: { id, k, ph: 'aq'|'s'|'l'|'g', mark?: '↓'|'↑', annot? }
 */
export function term(id, ph = 'aq', k = 1, extra = {}) {
  return { id, ph, k, ...extra };
}

export function eqString(left, right, arrow = '=') {
  const side = (arr) => arr.map((t) => `${t.k === 1 ? '' : t.k}${eqText(formulaOf(t.id))}${t.annot ? `(${t.annot})` : ''}${t.mark || ''}`).join(' + ');
  return `${side(left)} ${arrow} ${side(right)}`;
}

/** Koeffitsiyentlarni avtomatik topish */
export function balanced(left, right) {
  const k = balance(left.map((t) => formulaOf(t.id)), right.map((t) => formulaOf(t.id)));
  if (!k) throw new Error(`tenglashtirib bo'lmadi: ${left.map((t) => t.id).join('+')} = ${right.map((t) => t.id).join('+')}`);
  left.forEach((t, i) => { t.k = k[i]; });
  right.forEach((t, i) => { t.k = k[left.length + i]; });
  return { left, right };
}

/** Moddaning eritmadagi ionlari (ionli tenglama uchun) yoki null (molekula holida yoziladi) */
export function ionsFor(t) {
  if (t.ph !== 'aq' || t.mark) return null;
  if (db.ions[t.id]) return [[t.id, 1]];
  const s = sub(t.id);
  if (t.id === 'H2SO4') return [['H^+', 2], ['SO4^2-', 1]];
  if (s.dissociation && s.dissociation['HSO4^-']) {
    // maktab an'anasi: NaHSO4 = Na⁺ + H⁺ + SO4²⁻
    return [...Object.entries(s.dissociation).filter(([i]) => i !== 'HSO4^-'), ['H^+', s.dissociation['HSO4^-']], ['SO4^2-', s.dissociation['HSO4^-']]];
  }
  if (s.strong_acid && s.dissociation) return Object.entries(s.dissociation);
  if (s.dissociation && (s.solubility === 'R' || t.forceIonic)) return Object.entries(s.dissociation).filter(([i]) => i !== 'H2O');
  return null;
}

function gcd(a, b) { return b ? gcd(b, a % b) : a; }

/** To'liq va qisqartirilgan ionli tenglamalar */
export function ionicEqs(left, right, arrow = '=') {
  const expand = (arr) => {
    const out = [];
    for (const t of arr) {
      const ions = ionsFor(t);
      if (ions) for (const [ion, n] of ions) out.push({ id: ion, k: n * t.k, ion: true });
      else out.push({ id: t.id, k: t.k, mark: t.mark, annot: t.annot });
    }
    // bir xil zarrachalarni jamlash
    const m = new Map();
    for (const x of out) {
      const key = x.id + (x.mark || '');
      if (m.has(key)) m.get(key).k += x.k; else m.set(key, { ...x });
    }
    return [...m.values()];
  };
  const L = expand(left), R = expand(right);
  const full = eqString(L, R, arrow);
  // qisqartirish
  const nl = L.map((x) => ({ ...x })), nr = R.map((x) => ({ ...x }));
  for (const a of nl) {
    const b = nr.find((y) => y.id === a.id && !y.mark && !a.mark && db.ions[a.id]);
    if (!b) continue;
    const c = Math.min(a.k, b.k);
    a.k -= c; b.k -= c;
  }
  const fl = nl.filter((x) => x.k > 0), fr = nr.filter((x) => x.k > 0);
  if (!fl.length || !fr.length) return { full, net: null };
  const g = [...fl, ...fr].reduce((acc, x) => gcd(acc, x.k), 0) || 1;
  fl.forEach((x) => { x.k /= g; }); fr.forEach((x) => { x.k /= g; });
  return { full, net: eqString(fl, fr, arrow) };
}

/** Cho'kma ko'rinishi bazadan */
export function pptObs(id) {
  const s = sub(id);
  return { species: id, color: s.precipitate?.color || s.appearance.color, texture: s.precipitate?.texture || 'mayda-kristall' };
}

const TEX_UZ = { suzmasimon: 'suzmasimon', iviqsimon: 'iviqsimon (dirildoq)', 'mayda-kristall': 'mayda kristall', kristall: 'kristall', kukunsimon: 'kukunsimon', "oltin-yomg'ir": 'yaltiroq oltinrang tangachalar ("oltin yomg\'ir")', kolloid: 'kolloid' };
export const textureUz = (t) => TEX_UZ[t] || t;

const COLOR_WORDS = [
  ['#f4f4ee', 'oq'], ['#f6f6f2', 'oq'], ['#f8f8f4', 'oq'], ['#f2f4f4', 'oq'], ['#f4f6f6', 'oq'], ['#f4f4f0', 'oq'], ['#f6f6f0', 'oq'],
];
/** Hex rangni o'zbekcha so'z bilan taxminiy ifodalash (cho'kma tavsifi uchun) */
export function colorWord(hex) {
  const known = {
    '#151515': 'qora', '#1a1a18': 'qora', '#4a3424': "qo'ng'ir-qora", '#9a4a1c': "qizil-qo'ng'ir", '#4a9be0': "ko'k", '#c8d8b0': "oq-yashilsimon (havoda qo'ng'irlashadi)",
    '#7ec27a': 'och yashil', '#d97a9a': 'pushti', '#6f8f6a': 'kulrang-yashil', '#f0e2dc': "oq (havoda qo'ng'irlashadi)", '#f2ecc0': 'och sariq', '#f2df5a': 'sariq', '#ffd21a': 'yorqin sariq',
    '#e8b7a0': 'och pushti (badan rang)', '#5a3a20': "qo'ng'ir", '#f2d23a': 'sariq', '#f5d31a': 'sariq', '#f7c400': 'sariq', '#a8321e': "g'isht-qizil", '#3fa36b': 'yashil', '#f2eee0': 'oq',
    '#f0e8c8': 'oq-sarg\'ish', '#d8dcc8': 'kulrang-oq', '#f2dcd6': 'och pushti', '#8cc88c': 'och yashil', '#e09ab0': 'pushti', '#6fb3e0': "ko'k", '#c87ab8': 'binafsha-pushti',
    '#f0e6c0': 'oq-sarg\'ish', '#d8e0d0': 'oq-yashilsimon', '#9ad09a': 'och yashil', '#f2e0e0': 'och pushti', '#7a8f9a': 'kulrang-yashil', '#5a6ad0': "ko'k-binafsha", '#5aaad8': 'havorang',
    '#f0dcd8': 'och pushti', '#c8d0b8': 'kulrang-yashil', '#f2eac0': 'och sariq', '#8ec8e8': 'och havorang', '#b8e0b0': 'och yashil', '#f0b8c8': 'och pushti', '#f4e4e4': 'och pushti',
    '#e2e8d8': 'oq', '#f2e6e2': 'oq', '#b8deb0': 'och yashil', '#e8b0c0': 'och pushti', '#e0702a': "to'q sariq", '#f2f2ec': 'oq',
  };
  const h = hex.toLowerCase();
  if (known[h]) return known[h];
  const f = COLOR_WORDS.find(([c]) => c === h);
  return f ? f[1] : 'oq';
}

let counters = {};
export function nextId(prefix) {
  counters[prefix] = (counters[prefix] || 0) + 1;
  return `${prefix}-${String(counters[prefix]).padStart(4, '0')}`;
}
export function resetIds() { counters = {}; }

/** Yozuvni yig'ish (maydonlar tartibi sxemadagidek) */
export function makeRecord(o) {
  return {
    id: o.id,
    category: o.category,
    title_uz: o.title,
    level: o.level || 'umumiy',
    topic_uz: o.topic || null,
    engine: o.engine || 'rules',
    ...(o.no_reaction ? { no_reaction: true } : {}),
    ...(o.match ? { match: o.match } : {}),
    ...(o.extra || {}),
    reactants: o.reactants,
    conditions: { heating: false, temp_min_C: null, catalyst: null, medium: null, light: false, note_uz: null, ...(o.conditions || {}) },
    equation: { molecular: null, ionic_full: null, ionic_net: null, electron_balance: null, ...(o.equation || {}) },
    mechanism: { type: o.mechType || 'ion-almashinish', steps_uz: o.steps || [], organic: null },
    observations: { precipitate: null, gas: null, solution_color_change: null, heat: 'sezilarsiz', flame: null, effects: [], text_uz: '', ...(o.obs || {}) },
    kinetics: o.kinetics || 'bir-zumda',
    apparatus: o.apparatus || ['probirka', 'tomizgich'],
    procedure_uz: o.procedure,
    safety_uz: o.safety,
    explanation_uz: o.explanation,
    questions_uz: o.questions,
    confidence: o.confidence || 'yuqori',
  };
}

export function writeCategory(category, reactions) {
  const p = join(ROOT, 'frontend', 'lab', 'data', 'reactions', `${category}.json`);
  const tmp = p + '.tmp';
  writeFileSync(tmp, JSON.stringify({ category, generated_by: 'tools/seed/reactions', reactions }, null, 1));
  renameSync(tmp, p);
  console.log(`${category}: ${reactions.length}`);
}

/** Xavf belgilari asosida xavfsizlik matni */
export function safetyFor(ids, extra = '') {
  const hz = new Set(ids.flatMap((id) => db.substances[id]?.hazards || []));
  const parts = [];
  if (hz.has('korroziv')) parts.push("kislota va ishqorlar terini kuydiradi — ko'zoynak va qo'lqopdan foydalaning");
  if (hz.has('zaharli')) parts.push("zaharli moddalar bilan ishlaganda ularni og'izga, teriga tekkizmang, ishdan so'ng qo'lni yuving");
  if (hz.has('oksidlovchi')) parts.push('oksidlovchilarni yonuvchan moddalardan uzoqda saqlang');
  if (hz.has('kanserogen')) parts.push("kanserogen moddalar bilan faqat qo'lqopda, oz miqdorda ishlang");
  if (hz.has('atrof-muhit')) parts.push("chiqindini rakovinaga emas, maxsus chiqindi idishiga to'king");
  if (hz.has('yonuvchan')) parts.push("yonuvchan moddalarni ochiq alangadan uzoqda tuting");
  if (!parts.length) parts.push("reaktivlarni tatib ko'rmang, probirkani og'zini o'zingizga qaratmang");
  return cap(parts.join('; ')) + '.' + (extra ? ' ' + extra : '');
}

/** Sonni o'zbekcha yozish: 0.4 -> "0,4" */
export function fmt(x, digits = 2) {
  const r = Math.round(x * 10 ** digits) / 10 ** digits;
  return String(r).replace('.', ',');
}

const WEAK_ANIONS = new Set(['CH3COO^-', 'HCOO^-', 'CO3^2-', 'HCO3^-', 'S^2-', 'HS^-', 'SO3^2-', 'PO4^3-', 'HPO4^2-', 'SiO3^2-', 'C2O4^2-', 'F^-', 'NO2^-', 'C6H5COO^-', 'C2H5COO^-', 'C3H7COO^-', 'C17H35COO^-', 'ClO^-', 'C6H5O^-']);
const ACIDIC_ANIONS = new Set(['HSO4^-', 'H2PO4^-', 'HSO3^-', 'HC2O4^-']);
/** Tuz eritmasi muhitining sababi (tarkibiga ko'ra) */
export function mediumReason(saltId, medium) {
  const s = sub(saltId);
  const ions = Object.keys(s.dissociation || s.ions || {}).filter((k) => db.ions[k]);
  const cat = ions.find((k) => db.ions[k].charge > 0);
  const an = ions.find((k) => db.ions[k].charge < 0);
  const nm = shortName(saltId);
  const weakCat = cat && (cat === 'NH4^+' || (db.ions[cat].pKa_h !== null && db.ions[cat].pKa_h < 11));
  const weakAn = an && WEAK_ANIONS.has(an);
  const word = { kislotali: 'kislotali', ishqoriy: 'ishqoriy', neytral: 'neytral' }[medium] || medium;
  if (an && ACIDIC_ANIONS.has(an)) return `${cap(nm)} — nordon tuz: ${db.ions[an].display} ioni H⁺ ionini ajratadi, shuning uchun eritma muhiti ${word}.`;
  if (an === 'HPO4^2-' || an === 'HCO3^-') return `${cap(nm)} eritmasida ${db.ions[an].display} ionining gidrolizi uning dissotsilanishidan ustun, shuning uchun muhit ${word}.`;
  if (weakCat && weakAn) return `${cap(nm)} kuchsiz asos va kuchsiz kislotadan hosil bo'lgan: ikkala ion ham gidrolizlanadi, muhit ${word} (ta'sirlar bir-biriga yaqin).`;
  if (weakAn) return `${cap(nm)} kuchsiz kislota qoldig'i (${db.ions[an].display}) gidrolizlanib OH⁻ ionlarini hosil qiladi — eritma muhiti ${word}.`;
  if (weakCat) return `${cap(nm)} eritmasida ${db.ions[cat].display} kationi gidrolizlanib H⁺ ionlarini hosil qiladi — eritma muhiti ${word}.`;
  return `Kuchli kislota va kuchli asosdan hosil bo'lgan ${nm} gidrolizlanmaydi — eritma muhiti ${word}.`;
}

/** Boshqa toifalarda allaqachon ishlatilgan reaktivlar to'plamlari (takrorlanmaslik uchun) */
export function takenSignatures(exceptCategory) {
  const dir = join(ROOT, 'frontend', 'lab', 'data', 'reactions');
  const set = new Set();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json') && !['index.json', 'engine.json'].includes(x))) {
    try {
      const j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      if (j.category === exceptCategory) continue;
      for (const r of j.reactions || []) {
        const ids = (r.reactants || []).filter((x) => !db.substances[db.keyOf(x.species)]?.indicator).map((x) => db.keyOf(x.species)).sort();
        set.add(ids.join('+'));
      }
    } catch { /* boshqa agent yozayotgan bo'lishi mumkin */ }
  }
  return set;
}
