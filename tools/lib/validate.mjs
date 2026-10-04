// Reaksiya yozuvlarini tekshirish (validator). tools/validate_data.mjs va testlar ishlatadi.
import { checkBalance, parseEquation, speciesKey } from '../../frontend/lab/js/engine/formula.js';

export const CATEGORIES = [
  { id: 'neytrallanish', n: 1, target: 60, prefix: 'neytr', title_uz: 'Neytrallanish' },
  { id: 'ion-almashinish-chokma', n: 2, target: 120, prefix: 'chokma', title_uz: "Ion almashinish: cho'kma hosil bo'lishi" },
  { id: 'ion-almashinish-gaz', n: 3, target: 50, prefix: 'gaz', title_uz: 'Ion almashinish: gaz ajralishi' },
  { id: 'metall-kislota', n: 4, target: 40, prefix: 'metkis', title_uz: 'Metall + kislota' },
  { id: 'metall-tuz', n: 5, target: 50, prefix: 'mettuz', title_uz: 'Metall + tuz eritmasi (faollik qatori)' },
  { id: 'metall-suv-ishqor', n: 6, target: 25, prefix: 'metsuv', title_uz: 'Metall + suv, metall + ishqor' },
  { id: 'oksidlar', n: 7, target: 55, prefix: 'oksid', title_uz: 'Oksidlarning reaksiyalari' },
  { id: 'amfoter-kompleks', n: 8, target: 40, prefix: 'amfot', title_uz: "Amfoter gidroksidlar va kompleks birikmalar" },
  { id: 'termik-parchalanish', n: 9, target: 45, prefix: 'termik', title_uz: 'Termik parchalanish' },
  { id: 'yonish-birikish', n: 10, target: 45, prefix: 'yonish', title_uz: 'Yonish va birikish reaksiyalari' },
  { id: 'oksidlanish-qaytarilish', n: 11, target: 90, prefix: 'redoks', title_uz: 'Eritmadagi oksidlanish-qaytarilish' },
  { id: 'gazlar', n: 12, target: 40, prefix: 'gazolish', title_uz: "Gazlarni olish va xossalarini o'rganish" },
  { id: 'gidroliz-indikatorlar', n: 13, target: 30, prefix: 'gidroliz', title_uz: 'Tuzlar gidrolizi va indikatorlar' },
  { id: 'elektrokimyo', n: 14, target: 30, prefix: 'elektro', title_uz: 'Elektroliz va galvanik elementlar' },
  { id: 'sifat-reaksiyalari', n: 15, target: 60, prefix: 'sifat', title_uz: 'Kation va anionlarning sifat reaksiyalari' },
  { id: 'uglevodorodlar', n: 16, target: 50, prefix: 'uglevod', title_uz: 'Uglevodorodlar' },
  { id: 'spirtlar-fenollar', n: 17, target: 30, prefix: 'spirt', title_uz: 'Spirtlar, fenollar, oddiy efirlar' },
  { id: 'aldegid-ketonlar', n: 18, target: 25, prefix: 'aldegid', title_uz: 'Aldegidlar va ketonlar' },
  { id: 'karbon-kislotalar', n: 19, target: 35, prefix: 'karbon', title_uz: "Karbon kislotalar, murakkab efirlar, yog'lar" },
  { id: 'aminlar-oqsillar', n: 20, target: 20, prefix: 'amin', title_uz: 'Aminlar, aminokislotalar, oqsillar' },
  { id: 'uglevodlar', n: 21, target: 15, prefix: 'sakarid', title_uz: 'Uglevodlar' },
  { id: 'polimerlar', n: 22, target: 15, prefix: 'polimer', title_uz: 'Polimerlar' },
  { id: 'titrlash', n: 23, target: 20, prefix: 'titr', title_uz: 'Titrlash' },
  { id: 'kinetika-muvozanat', n: 24, target: 10, prefix: 'kinetik', title_uz: "Kinetika, muvozanat, termokimyo va ko'rgazmali tajribalar" },
];

export const ENUMS = {
  engine: ['rules', 'record'],
  level: ['7-sinf', '8-sinf', '9-sinf', '10-sinf', '11-sinf', 'litsey', 'universitet', 'umumiy'],
  kinetics: ['bir-zumda', 'tez', "o'rtacha", 'sekin', 'juda-sekin'],
  heat: ['kuchli-ekzotermik', 'ekzotermik', 'sezilarsiz', 'endotermik', 'kuchli-endotermik'],
  confidence: ['yuqori', "o'rta"],
  state: ['aq', 's', 'l', 'g'],
  medium: ['kislotali', 'neytral', 'ishqoriy'],
  texture: ['suzmasimon', 'iviqsimon', 'mayda-kristall', 'kristall', 'kukunsimon', "oltin-yomg'ir", 'kolloid'],
  mechanism: ['neytrallanish', 'ion-almashinish', 'oksidlanish-qaytarilish', 'kompleks', 'gidroliz', 'elektroliz', 'galvanik', 'termik-parchalanish', 'birikish', "o'rin-olish", 'sifat-reaksiya', 'fizik', 'organik'],
  organic: ['SR', 'AdE', 'AdR', 'SN1', 'SN2', 'E1', 'E2', 'SEAr', 'AdN', 'atsil', 'aldol', 'oksidlanish', 'qaytarilish', 'polimer-radikal', 'polimer-ion', 'polikondensatlanish'],
  effects: ['sparks', 'light', 'smoke', 'glow', 'pop', 'foam', 'crystals', 'deposit', 'fog', 'condensate', 'layers', 'volcano', 'mirror', 'color-gas', 'bubbles', 'flame', 'heat-haze', 'swirl', 'dissolve', 'turbidity', 'splash', 'boil', 'crack'],
};

const REQUIRED = ['id', 'category', 'title_uz', 'level', 'engine', 'reactants', 'conditions', 'equation', 'mechanism', 'observations', 'kinetics', 'apparatus', 'procedure_uz', 'safety_uz', 'explanation_uz', 'questions_uz', 'confidence'];

const ANNOT_WORDS = /^(kons|konts|suyult|suyultirilgan|konsentrlangan|eritma|aq|q|s|g|l|kr|kristall|qattiq|gaz|suyuq|ortiqcha|yetishmaydi|tuyilgan|kukun|bo'lak|qizdirilgan|t°|t)\.?$/;

/**
 * @param {import('../../frontend/lab/js/engine/db.js').ChemDB} db
 * @param {any} r
 * @param {{equipment?:Set<string>, templates?:Set<string>}} ctx
 * @returns {{errors:string[], warnings:string[]}}
 */
export function validateReaction(db, r, ctx = {}) {
  const errors = [];
  const warnings = [];
  const E = (m) => errors.push(m);
  for (const k of REQUIRED) if (r[k] === undefined) E(`majburiy maydon yo'q: ${k}`);
  if (errors.length) return { errors, warnings };
  if (!/^[a-z0-9-]+-\d{4}$/.test(r.id)) E(`id formati noto'g'ri: ${r.id}`);
  const cat = CATEGORIES.find((c) => c.id === r.category);
  if (!cat) E(`noma'lum toifa: ${r.category}`);
  else if (!r.id.startsWith(cat.prefix + '-')) E(`id prefiksi toifaga mos emas (${cat.prefix}-NNNN kutiladi)`);
  if (!ENUMS.engine.includes(r.engine)) E(`engine: ${r.engine}`);
  if (!ENUMS.level.includes(r.level)) E(`level: ${r.level}`);
  if (!ENUMS.kinetics.includes(r.kinetics)) E(`kinetics: ${r.kinetics}`);
  if (!ENUMS.confidence.includes(r.confidence)) E(`confidence: ${r.confidence}`);
  if (typeof r.title_uz !== 'string' || r.title_uz.length < 8) E('title_uz juda qisqa');
  if (!Array.isArray(r.procedure_uz) || !r.procedure_uz.length) E("procedure_uz bo'sh");
  if (!Array.isArray(r.questions_uz) || !r.questions_uz.length) E("questions_uz bo'sh");
  if (!r.explanation_uz || r.explanation_uz.length < 20) E('explanation_uz juda qisqa');
  if (!r.safety_uz || r.safety_uz.length < 10) E('safety_uz juda qisqa');
  if (!Array.isArray(r.apparatus) || !r.apparatus.length) E("apparatus bo'sh");
  else if (ctx.equipment) for (const a of r.apparatus) if (!ctx.equipment.has(a)) E(`jihoz katalogda yo'q: ${a}`);
  if (r.template && ctx.templates && !ctx.templates.has(r.template)) E(`asbob andozasi yo'q: ${r.template}`);

  // reaktivlar
  if (!Array.isArray(r.reactants) || !r.reactants.length) E("reactants bo'sh");
  const reactIds = [];
  for (const re of r.reactants || []) {
    const ent = db.substances[re.species] ? { id: re.species } : db.resolve(re.species);
    if (!ent) { E(`reaktiv bazada yo'q: ${re.species}`); continue; }
    if (!db.substances[ent.id]) { E(`reaktiv modda bo'lishi kerak (ion emas): ${re.species}`); continue; }
    reactIds.push(ent.id);
    if (!ENUMS.state.includes(re.state)) E(`reaktiv holati: ${re.state}`);
    if (re.state === 'aq' && !(re.conc_M > 0) && !db.substances[ent.id].mixture && !db.substances[ent.id].mixture_opaque && !db.substances[ent.id].formula_null) E(`eritma konsentratsiyasi yo'q: ${re.species}`);
    if (re.conc_M > 25) E(`konsentratsiya juda katta: ${re.species} ${re.conc_M}`);
  }

  // shartlar
  const c = r.conditions || {};
  if (c.medium && !ENUMS.medium.includes(c.medium)) E(`medium: ${c.medium}`);
  if (c.catalyst) {
    for (const k of [].concat(c.catalyst)) if (!db.substances[k] && !db.resolve(k)) E(`katalizator bazada yo'q: ${k}`);
  }
  if (c.temp_min_C !== undefined && c.temp_min_C !== null && (typeof c.temp_min_C !== 'number' || c.temp_min_C < -20 || c.temp_min_C > 1100)) E('temp_min_C oralig\'i');

  // tenglamalar
  const eq = r.equation || {};
  const eqs = [];
  if (!r.no_reaction && !r.flame_test && !r.equation_free) {
    if (!eq.molecular) E("molekulyar tenglama yo'q");
  }
  if (r.no_reaction && r.engine === 'record') {
    if (!Array.isArray(r.match) || !r.match.length) E("no_reaction yozuvi uchun match (zarrachalar ro'yxati) kerak");
    else for (const m of r.match) if (!db.resolve(m) && !db.substances[m]) E(`match zarrachasi bazada yo'q: ${m}`);
  }
  if (r.flame_test) {
    const ion = db.ions[r.flame_test.ion];
    if (!ion || !ion.flame) E(`alanga sinovi ioni noto'g'ri: ${r.flame_test.ion}`);
    else if (r.observations?.flame?.color && r.observations.flame.color.toLowerCase() !== ion.flame.color.toLowerCase()) E('alanga rangi bazadagidan farq qiladi');
  }
  if (r.equation_free && (!r.equation_free_uz || r.equation_free_uz.length < 15)) E('equation_free uchun izoh (equation_free_uz) kerak');
  for (const key of ['molecular', 'ionic_full', 'ionic_net']) {
    if (!eq[key]) continue;
    eqs.push([key, eq[key]]);
  }
  for (const [key, text] of eqs) {
    const b = checkBalance(text);
    if (!b.ok) { E(`${key} balanssiz: ${b.errors.join('; ')} — "${text}"`); continue; }
    let p;
    try { p = parseEquation(text, 1); } catch (e) { E(`${key}: ${e.message}`); continue; }
    for (const t of [...p.left, ...p.right]) {
      const annot = t.annot && !ANNOT_WORDS.test(t.annot) ? t.annot : null;
      if (t.formula === 'e⁻' || t.formula === 'ē') continue;
      if (!db.resolve(t.formula, annot)) E(`${key}: "${t.formula}${annot ? '(' + annot + ')' : ''}" bazada topilmadi`);
    }
    if (key === 'molecular' && /[⁺⁻]/.test(text.replace(/e⁻/g, ''))) warnings.push('molekulyar tenglamada ion zaryadi bor');
  }
  for (const line of eq.electron_balance || []) {
    const b = checkBalance(line);
    if (!b.ok) E(`elektron balans satri xato: "${line}" (${b.errors.join('; ')})`);
  }

  // reaktivlar molekulyar tenglama chap tomonida bo'lishi kerak
  let molParsed = null;
  if (eq.molecular) {
    try { molParsed = db.parseEq(eq.molecular); } catch { /* yuqorida xato yozilgan */ }
  }
  if (molParsed) {
    const leftIds = new Set(molParsed.left.map((t) => t.id));
    const rightIds = new Set(molParsed.right.map((t) => t.id));
    for (const id of reactIds) {
      const s = db.substances[id];
      if (leftIds.has(id)) continue;
      // aralashma reaktivlar (ohakli suv, Lugol ...) komponentlari orqali
      if (s.mixture && Object.keys(s.mixture).some((k) => leftIds.has(k) || [...leftIds].some((l) => sameIons(db, l, k)))) continue;
      if (s.mixture_opaque || s.formula_null) continue;
      if (c.catalyst && [].concat(c.catalyst).map((k) => db.keyOf(k)).includes(id)) continue;
      if (s.indicator) continue;
      if (id === 'H2O' || s.dissolve_molecular) continue;
      if (r.no_reaction) continue;
      warnings.push(`reaktiv molekulyar tenglama chap tomonida yo'q: ${id}`);
    }
    const obs = r.observations || {};
    if (obs.precipitate) {
      const pid = db.keyOf(obs.precipitate.species);
      const t = molParsed.right.find((x) => x.id === pid);
      if (!t) E(`kuzatuvdagi cho'kma ${obs.precipitate.species} tenglama o'ng tomonida yo'q`);
      else if (t.mark !== '↓' && db.substances[pid]?.state !== 's') E(`cho'kma ${pid} tenglamada ↓ bilan belgilanmagan`);
      const dbc = db.substances[pid]?.precipitate?.color || db.substances[pid]?.appearance?.color;
      if (dbc && obs.precipitate.color && obs.precipitate.color.toLowerCase() !== dbc.toLowerCase()) warnings.push(`cho'kma rangi bazadagidan farq qiladi (${obs.precipitate.color} / ${dbc})`);
      if (obs.precipitate.texture && !ENUMS.texture.includes(obs.precipitate.texture)) E(`texture: ${obs.precipitate.texture}`);
    }
    if (obs.gas) {
      const gid = db.keyOf(obs.gas.species);
      const t = molParsed.right.find((x) => x.id === gid);
      if (!t) E(`kuzatuvdagi gaz ${obs.gas.species} tenglama o'ng tomonida yo'q`);
      else if (t.mark !== '↑' && db.substances[gid]?.state !== 'g') warnings.push(`gaz ${gid} tenglamada ↑ bilan belgilanmagan`);
    }
    void rightIds;
  }
  const obs = r.observations || {};
  if (obs.heat && !ENUMS.heat.includes(obs.heat)) E(`heat: ${obs.heat}`);
  for (const ef of obs.effects || []) if (!ENUMS.effects.includes(ef.type)) E(`effekt turi noma'lum: ${ef.type}`);
  const mech = r.mechanism || {};
  if (!ENUMS.mechanism.includes(mech.type)) E(`mechanism.type: ${mech.type}`);
  if (mech.organic) {
    if (!ENUMS.organic.includes(mech.organic.template)) E(`organik mexanizm andozasi: ${mech.organic.template}`);
  }
  if (r.engine === 'record' && !r.no_reaction && !eq.ionic_net && !eq.molecular) E("record dvigateli uchun tenglama yo'q");
  return { errors, warnings };
}

function sameIons(db, a, b) { return a === b; }

/** Takrorlanishni aniqlash imzosi */
export function signature(db, r) {
  const ids = (r.reactants || []).map((x) => `${db.keyOf(x.species)}:${x.state}${x.conc_min_M ? '>' + x.conc_min_M : ''}${x.conc_max_M ? '<' + x.conc_max_M : ''}`).sort();
  const c = r.conditions || {};
  return `${r.category}|${ids.join('+')}|T${c.temp_min_C ?? (c.heating ? 'h' : '')}|${c.temp_max_C ?? ''}|${[].concat(c.catalyst || []).join(',')}|${c.medium || ''}|${c.light ? 'L' : ''}|${r.equation?.molecular || ''}`;
}

/** Barcha yozuvlarni tekshirish */
export function validateAll(db, reactions, ctx = {}) {
  const results = [];
  const ids = new Map();
  const sigs = new Map();
  for (const r of reactions) {
    const res = validateReaction(db, r, ctx);
    if (ids.has(r.id)) res.errors.push(`takroriy id: ${r.id}`);
    ids.set(r.id, true);
    const sig = signature(db, r);
    if (sigs.has(sig)) res.errors.push(`takroriy tajriba (${sigs.get(sig)} bilan bir xil reaktivlar, shartlar va tenglama)`);
    else sigs.set(sig, r.id);
    results.push({ id: r.id, category: r.category, ...res });
  }
  const counts = {};
  for (const r of reactions) counts[r.category] = (counts[r.category] || 0) + 1;
  return { results, counts };
}

export { speciesKey };
