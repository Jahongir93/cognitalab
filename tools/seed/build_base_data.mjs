// Boshlang'ich ma'lumotlardan frontend/lab/data/{substances,ions,rules}.json fayllarini yasaydi.
// Ishga tushirish: node tools/seed/build_base_data.mjs
// DIQQAT: bu fayllarni qo'lda tahrirlash mumkin, lekin generatorni qayta ishga tushirish ularni qayta yozadi.
import { writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFormula, molarMass, speciesKey, prettyFormula, splitCharge, normalizeFormula } from '../../frontend/lab/js/engine/formula.js';
import { CATIONS, ANIONS, ANION_ORDER, SOLUBILITY, EXTRA_INSOLUBLE, SLIGHT_SOLUBILITY_GL, SPECIAL_PAIRS } from './ions_data.mjs';
import { ACID_BASE, STRONG_ACIDS, METALS as METAL_RULES, COMPLEXES, INDICATORS, REDUCIBLE_IONS, METAL_ALKALI, PPT_ORDER_HINT, ELECTROLYSIS } from './chem_rules_data.mjs';
import * as SD from './substances_data.mjs';
import { balance, formatEq } from '../lib/balance.mjs';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = join(root, 'frontend', 'lab', 'data');
mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------- ionlar
const ions = {};
function addIon(i, kind) {
  const key = speciesKey(i.f);
  const { charge } = splitCharge(normalizeFormula(i.f));
  const { atoms } = parseFormula(i.f);
  void atoms;
  ions[key] = {
    id: key,
    formula: i.f,
    display: prettyFormula(i.f),
    name_uz: i.name + (kind === 'kation' ? ' ioni' : ' ioni'),
    name_short_uz: i.name,
    kind: kind || (charge > 0 ? 'kation' : 'anion'),
    charge,
    M: molarMass(i.f),
    color: i.color || null,
    flame: i.flame ? { color: i.flame, desc_uz: i.flame_uz } : null,
    pKa_h: i.pKa_h ?? null,
  };
}
CATIONS.forEach((c) => addIon(c, 'kation'));
ANIONS.forEach((a) => addIon(a, 'anion'));
SD.EXTRA_IONS_FOR_EDTA.forEach((a) => addIon(a));

// ---------------------------------------------------------------- moddalar
const substances = {};
function put(s, forcedId) {
  const id = forcedId || (s.tag ? `${speciesKey(s.formula)}|${s.tag}` : speciesKey(s.formula));
  s.id = id;
  if (substances[id]) {
    // birlashtirish (qo'lda yozilgan maydonlar ustun)
    Object.assign(substances[id], s);
  } else substances[id] = s;
  return substances[id];
}

const GAS_AIR_M = 29;
function gasInfo(f, g) {
  if (!g) return undefined;
  const M = f ? molarMass(f) : null;
  return {
    water_solubility: g.ws || null,
    smell_uz: g.smell || null,
    toxic: !!g.toxic,
    color: g.col || null,
    rel_density_air: M ? Math.round((M / GAS_AIR_M) * 100) / 100 : null,
  };
}

function solutionsOf(arr) {
  if (!arr) return undefined;
  return arr.map(([c, grade, label]) => ({ conc_M: c, grade, label }));
}

function base(e, cls) {
  const isNull = !!e.formula_null;
  const st = e.st || 's';
  const out = {
    formula: isNull ? null : e.f,
    display: isNull ? null : prettyFormula(e.f),
    name_uz: e.n,
    class: e.c || cls,
    state: st,
    M: isNull ? null : molarMass(e.f),
    appearance: {
      color: e.col ?? (st === 'g' ? (e.gas?.col || null) : null),
      form: e.form || ({ s: 'kukun', l: 'suyuqlik', g: 'gaz', aq: 'eritma' }[st]),
      desc_uz: e.desc || null,
    },
    hazards: e.hz || [],
    storage: e.sto || (st === 'g' ? 'ballon' : 'tiqinli-sklyanka'),
    reagent: e.reagent !== false,
  };
  if (isNull) out.formula_null = true;
  if (e.tag) out.tag = e.tag;
  if (e.aliases?.length) out.aliases = e.aliases;
  if (e.d !== undefined) out.density = e.d;
  if (e.mp !== undefined) out.mp = e.mp;
  if (e.bp !== undefined) out.bp = e.bp;
  if (e.gas) out.gas = gasInfo(isNull ? null : e.f, e.gas);
  if (e.sol) out.solutions = solutionsOf(e.sol);
  if (e.redox) out.redox = e.redox;
  if (e.miscible !== undefined) out.miscible_water = e.miscible;
  if (e.diss) out.dissociation = e.diss;
  if (e.diss_mol) out.dissolve_molecular = e.diss_mol;
  if (e.s !== undefined) out.s_gL = e.s;
  if (e.aq) out.aq_color = { hex: e.aq.col, ref_M: e.aq.ref };
  if (e.indicator) out.indicator = e.indicator;
  if (e.mixture) out.mixture = e.mixture === true ? null : e.mixture;
  if (e.mixture === true) out.mixture_opaque = true;
  if (e.mixture_phase) out.mixture_phase = e.mixture_phase;
  if (e.paper) out.paper = true;
  if (e.index === false) out.index = false;
  if (e.forms) out.forms = e.forms;
  if (e.heat_dil) out.heat_of_dilution = e.heat_dil;
  if (e.conc_from) out.conc_threshold_M = e.conc_from;
  if (e.tex) out.precipitate = { color: e.col, texture: e.tex };
  if (e.acid !== undefined) out.acid_soluble = e.acid;
  if (e.dehyd) out.dehydrates_to = e.dehyd;
  if (e.weak_base) out.weak_base = true;
  return out;
}

// metallar
for (const m of SD.METALS) {
  const s = base(m, 'metall');
  const rule = METAL_RULES.find((r) => r.id === m.f);
  if (rule) s.metal = { ion: rule.ion, E0: rule.E, n: rule.n, water: rule.water || null, film: !!rule.film };
  s.solubility = 'N';
  put(s);
}
for (const x of SD.NONMETALS) {
  const s = base(x, 'metallmas');
  put(s);
}
for (const o of SD.OXIDES) {
  const s = base(o, 'oksid');
  if (o.o) s.oxide = { type: o.o, hydrate: o.hyd || null, slow: !!o.hyd_slow };
  if (o.hyd && !['CO2', 'SO2'].includes(o.f)) {
    const k = balance([o.f, 'H2O'], [o.hyd]);
    if (!k) throw new Error('gidratlanish tenglamasi topilmadi: ' + o.f);
    s.oxide.hydration_eq = formatEq([{ f: o.f, k: k[0] }, { f: 'H2O', k: k[1] }], [{ f: o.hyd, k: k[2] }]);
  }
  if (['asosli', 'amfoter', 'aralash'].includes(o.o) && s.state === 's') s.acid_soluble = o.f === 'MgO' || o.f === 'CaO' ? 'kuchsiz' : 'kuchli';
  if (o.st === 'g' || o.f === 'H2O') s.solubility = null;
  else if (o.f === 'H2O2') s.solubility = 'R';
  else s.solubility = 'N';
  put(s);
}
for (const a of SD.ACIDS) {
  const s = base(a, 'kislota');
  if (a.strong) s.strong_acid = true;
  if (STRONG_ACIDS[a.f]) s.dissociation = { 'H^+': 1, [STRONG_ACIDS[a.f]]: 1 };
  if (a.f === 'H2SO4') s.dissociation = { 'H^+': 1, 'HSO4^-': 1 };
  s.solubility = a.f === 'H2SiO3' ? 'N' : 'R';
  if (a.f === 'H2SiO3') s.precipitate = { color: '#f2f2ee', texture: 'iviqsimon' };
  put(s);
}
for (const b of SD.BASES) {
  const s = base(b, 'asos');
  s.solubility = 'R';
  put(s);
}

// ---------------------------------------------------------------- tuzlar (jadval)
const ION_BY_KEY = (k) => ions[k] || (() => { throw new Error('ion yo\'q: ' + k); })();
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function partText(body, n, organicFirst) {
  const poly = /[A-Z].*[A-Z]|[a-z].*[A-Z]|\d/.test(body) && !/^[A-Z][a-z]?$/.test(body);
  if (n === 1) return body;
  return poly ? `(${body})${n}` : `${body}${n}`;
}
const ORGANIC_ANIONS = new Set(['CH3COO^-', 'HCOO^-', 'C2H5COO^-', 'C3H7COO^-', 'C6H5COO^-', 'C17H35COO^-']);
const cationColorSolid = SD.SALT_SOLID_COLOR;
const HEAVY = { 'Pb^2+': ['zaharli', 'atrof-muhit'], 'Ba^2+': ['zaharli'], 'Ag^+': ['korroziv', 'atrof-muhit'], 'Cu^2+': ['zararli', 'atrof-muhit'], 'Ni^2+': ['zararli', 'kanserogen'], 'Co^2+': ['zararli', 'kanserogen'], 'Cr^3+': ['zararli'], 'Mn^2+': ['zararli'], 'Sn^2+': ['zararli'], 'Sr^2+': [], 'Zn^2+': ['atrof-muhit'], 'Fe^3+': ['zararli'] };
const ANION_HZ = { 'NO3^-': ['oksidlovchi'], 'NO2^-': ['zaharli', 'oksidlovchi'], 'F^-': ['zaharli'], 'S^2-': ['korroziv', 'atrof-muhit'], 'C2O4^2-': ['zararli'] };
const ANION_HZ_SOLUBLE = { 'OH^-': ['korroziv'], 'SiO3^2-': ['korroziv'] };
const AMPHOTERIC = new Set(['Al^3+', 'Zn^2+', 'Cr^3+', 'Pb^2+', 'Sn^2+']);
const ACID_FOR_SOLID = {
  'CO3^2-': 'kuchsiz', 'HCO3^-': 'kuchsiz', 'SO3^2-': 'kuchsiz', 'OH^-': 'kuchsiz', 'PO4^3-': 'kuchli', 'HPO4^2-': 'kuchli', 'C2O4^2-': 'kuchli',
  'SiO3^2-': 'kuchli', 'F^-': 'kuchli', 'CH3COO^-': 'kuchli', 'NO2^-': 'kuchli', 'S^2-': 'kuchli',
};
const SULFIDE_ACID_INSOLUBLE = new Set(['CuS', 'PbS', 'Ag2S', 'NiS', 'CoS', 'SnS', 'HgS']);
const COMMON_SOLID_REAGENTS = new Set(['CaCO3', 'BaCO3', 'MgCO3', 'FeS', 'ZnS', 'CaF2', 'Ca3(PO4)2', 'BaSO4', 'CaSO4', 'Ca(OH)2', 'Mg(OH)2', 'Al(OH)3', 'Cu(OH)2', 'Fe(OH)3', 'PbS', 'Li2CO3']);

function makeSalt(catKey, anKey, code) {
  const cat = ION_BY_KEY(catKey), an = ION_BY_KEY(anKey);
  const zc = cat.charge, za = -an.charge;
  const l = (zc * za) / gcd(zc, za);
  const nc = l / zc, na = l / za;
  const cb = splitCharge(normalizeFormula(cat.formula)).body;
  const ab = splitCharge(normalizeFormula(an.formula)).body;
  let f, alias = null;
  if (ORGANIC_ANIONS.has(anKey)) {
    f = `${partText(ab, na)}${partText(cb, nc)}`;
    alias = `${partText(cb, nc)}${partText(ab, na)}`;
  } else {
    f = `${partText(cb, nc)}${partText(ab, na)}`;
  }
  const key = speciesKey(f);
  const isHydroxide = anKey === 'OH^-';
  let cls = 'tuz';
  if (isHydroxide) cls = AMPHOTERIC.has(catKey) ? 'amfoter-gidroksid' : 'asos';
  const app = SD.SALT_APPEARANCE[key];
  const override = SD.SALT_SOLID_OVERRIDE[key];
  let color = app?.[0] || override?.[0] || cationColorSolid[catKey] || '#f6f6f2';
  if (!app && an.color && !cat.color) color = an.color.hex;
  const s = {
    formula: f,
    display: prettyFormula(f),
    name_uz: `${cat.name_short_uz} ${an.name_short_uz}`,
    class: cls,
    state: 's',
    M: molarMass(f),
    appearance: { color, form: code === 'R' ? 'kristall' : 'kukun', desc_uz: override?.[1] || null },
    hazards: [...new Set([...(HEAVY[catKey] || []), ...(ANION_HZ[anKey] || []), ...(code === 'R' ? ANION_HZ_SOLUBLE[anKey] || [] : [])])],
    storage: catKey === 'Ag^+' || anKey === 'I^-' ? 'qoramtir-sklyanka' : (isHydroxide && code === 'R' ? 'rezina-tiqinli-sklyanka' : 'tiqinli-sklyanka'),
    reagent: code === 'R' || COMMON_SOLID_REAGENTS.has(key),
    solubility: code,
    ions: { [catKey]: nc, [anKey]: na },
  };
  if (alias) s.aliases = [alias];
  if (code === 'R') {
    s.dissociation = { [catKey]: nc, [anKey]: na };
    const sgl = SLIGHT_SOLUBILITY_GL[key];
    if (sgl) s.s_gL = sgl;
    const maxM = (s.s_gL || 200) / s.M;
    s.solutions = [0.1, 0.5, 1].filter((c) => c <= maxM * 0.9).map((c) => ({ conc_M: c, grade: 'suyultirilgan', label: `${String(c).replace('.', ',')} M` }));
    if (!s.solutions.length) s.solutions = [{ conc_M: Math.round(maxM * 0.8 * 1000) / 1000, grade: 'to\'yingan', label: 'to\'yingan eritma' }];
  } else {
    s.precipitate = { color, texture: app?.[1] || (isHydroxide ? 'iviqsimon' : 'mayda-kristall') };
    if (code === 'M') {
      s.s_gL = SLIGHT_SOLUBILITY_GL[key] ?? 1;
      s.dissociation = { [catKey]: nc, [anKey]: na };
    }
    let acid = ACID_FOR_SOLID[anKey] ?? null;
    if (anKey === 'S^2-' && SULFIDE_ACID_INSOLUBLE.has(key)) acid = null;
    if (anKey === 'PO4^3-' && ['Ca^2+', 'Ba^2+', 'Sr^2+', 'Mg^2+'].includes(catKey)) acid = 'kuchsiz';
    s.acid_soluble = acid;
  }
  if (isHydroxide && code === 'R' && ['Na^+', 'K^+', 'Li^+', 'Ba^2+'].includes(catKey)) s.class = 'asos';
  return s;
}

const solubilityTable = {};
for (const [catKey, row] of Object.entries(SOLUBILITY)) {
  const codes = row.trim().split(/\s+/);
  if (codes.length !== ANION_ORDER.length) throw new Error('Eruvchanlik jadvali qatori uzunligi xato: ' + catKey);
  solubilityTable[catKey] = {};
  codes.forEach((code, i) => {
    const anKey = ANION_ORDER[i];
    solubilityTable[catKey][anKey] = code;
    if (code === '-') return;
    if (catKey === 'NH4^+' && anKey === 'OH^-') return; // NH3·H2O alohida
    const s = makeSalt(catKey, anKey, code);
    const existing = substances[speciesKey(s.formula)];
    if (existing) return; // qo'lda yozilgani ustun (NaOH, KOH ...)
    put(s);
  });
}
for (const x of EXTRA_INSOLUBLE) {
  solubilityTable[x.cation] = solubilityTable[x.cation] || {};
  solubilityTable[x.cation][x.anion] = x.code;
}

// ---------------------------------------------------------------- maxsus noorganik va organik
function addList(list, cls) {
  for (const e of list) {
    if (e.skip || e.custom_skip || e.ion_only) continue;
    const s = base(e, cls);
    if (s.state === 's' && s.solubility === undefined) s.solubility = e.diss ? 'R' : (e.tex ? 'N' : null);
    if (s.state === 'aq' || s.dissociation) s.solubility = 'R';
    if (e.tex && !s.precipitate) s.precipitate = { color: e.col, texture: e.tex };
    if (e.tex) s.solubility = 'N';
    const key = s.tag ? `${speciesKey(s.formula)}|${s.tag}` : (s.formula_null ? e.f : speciesKey(s.formula));
    const prev = substances[key];
    if (prev) {
      // jadvaldan yasalgan tuzni boyitish
      for (const [k, v] of Object.entries(s)) if (v !== undefined && v !== null && !(Array.isArray(v) && !v.length)) prev[k] = v;
    } else put(s, key);
  }
}
addList(SD.SPECIAL_INORGANIC, 'tuz');
addList(SD.ORGANIC, 'organik');

// toifa mualliflari qo'shgan moddalar: tools/seed/extra/*.json (qisqa formatda, substances_data.mjs kabi)
const extraDir = join(dirname(fileURLToPath(import.meta.url)), 'extra');
if (existsSync(extraDir)) {
  for (const f of readdirSync(extraDir).filter((x) => x.endsWith('.json')).sort()) {
    const list = JSON.parse(readFileSync(join(extraDir, f), 'utf8'));
    const fresh = list.filter((e) => {
      const key = e.tag ? `${speciesKey(e.f)}|${e.tag}` : (e.formula_null ? e.f : speciesKey(e.f));
      if (substances[key]) { console.log(`  (${f}) allaqachon bor, o'tkazib yuborildi: ${key}`); return false; }
      return true;
    });
    addList(fresh, 'organik');
    for (const e of fresh) if (e.c === undefined) { const key = speciesKey(e.f); if (substances[key]) substances[key].class = e.cls || substances[key].class; }
  }
}

// organik moddalar uchun eruvchanlik (sodda): miscible_water yoki gas
for (const s of Object.values(substances)) {
  if (s.class === 'organik' || ['alkan', 'alken', 'alkin', 'aren', 'spirt', 'aldegid', 'keton', 'karbon-kislota', 'murakkab-efir', 'oddiy-efir', 'galogenalkan', 'galogenalken', 'amin', 'yog\'', 'polimer', 'dien', 'sikloalkan', 'uglevod', 'aminokislota', 'fenol'].includes(s.class)) {
    if (s.solubility === undefined || s.solubility === null) {
      if (s.miscible_water === true) s.solubility = 'R';
      else if (s.miscible_water === false) s.solubility = 'N';
      else if (s.solutions) s.solubility = 'R';
      else if (s.class === 'polimer' || s.class === 'yog\'') s.solubility = 'N';
      else if (s.state === 'g') s.solubility = null;
    }
  }
}
// sinf aniqlashtirish
for (const s of Object.values(substances)) if (s.class === 'organik') s.class = 'organik';

// kislota-asos tizimiga havola
for (const sys of ACID_BASE) {
  for (const form of sys.forms) {
    const s = substances[speciesKey(form)];
    if (s) s.acid_system = sys.id;
    const io = ions[speciesKey(form)];
    if (io) io.acid_system = sys.id;
  }
}

// ---------------------------------------------------------------- qoidalar
const rules = {
  solubility_table: solubilityTable,
  slight_solubility_gL: SLIGHT_SOLUBILITY_GL,
  special_pairs: SPECIAL_PAIRS,
  acid_base: ACID_BASE,
  strong_acids: STRONG_ACIDS,
  metals: METAL_RULES,
  complexes: COMPLEXES,
  indicators: INDICATORS,
  reducible_ions: REDUCIBLE_IONS,
  metal_alkali: METAL_ALKALI,
  ppt_order_hint: PPT_ORDER_HINT,
  electrolysis: ELECTROLYSIS,
};

const sorted = Object.fromEntries(Object.entries(substances).sort(([a], [b]) => a.localeCompare(b)));
const atomic = (name, obj) => { const tmp = join(outDir, `.${name}.${process.pid}.tmp`); writeFileSync(tmp, JSON.stringify(obj, null, 1)); renameSync(tmp, join(outDir, name)); };
atomic('substances.json', sorted);
atomic('ions.json', ions);
atomic('rules.json', rules);
console.log(`moddalar: ${Object.keys(sorted).length}, ionlar: ${Object.keys(ions).length}`);
