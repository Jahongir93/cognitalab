// Formula va tenglama tahlili. DOM'siz, Node'da ishlaydi.
//
// Qabul qilinadigan yozuv:
//   - elementlar: H, He, Na ...; indekslar ASCII (H2O) yoki Unicode (H₂O)
//   - qavslar: ( ) [ ] { }; gidrat/qo'shimcha: "CuSO4·5H2O", "NH3·H2O" (· yoki *)
//   - zaryad oxirida: Unicode "²⁺", "⁻" yoki ASCII "^2+", "^-"
//   - tuzilish belgilari e'tiborsiz qoldiriladi: - – — = ≡ (CH2=CH2, CH3–CH2–OH)
//   - polimer: "(–CH2–CH2–)n" — "n" indeksi; koeffitsiyent "n", "2n", "(2n–1)"
//   - elektron: "e⁻" yoki "ē"

export const ATOMIC_MASS = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999,
  F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06,
  Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078, Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996,
  Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.630,
  As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Ag: 107.87, Cd: 112.41,
  Sn: 118.71, Sb: 121.76, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33, Pt: 195.08, Au: 196.97,
  Hg: 200.59, Pb: 207.2, Bi: 208.98,
};

const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', 'ₙ': 'n' };
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-' };
const TO_SUB = Object.fromEntries(Object.entries(SUB).map(([k, v]) => [v, k]));
const TO_SUP = Object.fromEntries(Object.entries(SUP).map(([k, v]) => [v, k]));

/** Polimer "n" uchun sonli qiymat (balansni ikki xil n bilan tekshiramiz). */
export const POLY_N = 1000;

/** Unicode indeks/daraja belgilarini ASCII ko'rinishga keltiradi. Zaryad "^2+" shaklida. */
export function normalizeFormula(text) {
  let s = String(text).trim();
  // oxiridagi Unicode zaryad
  let m = s.match(/([⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻])$/);
  let charge = '';
  // oksidlanish darajasi yozuvi "Mn⁺⁷", "S⁻²", "S⁰" — elektron balansda zaryad kabi hisoblanadi
  const ox = s.match(/([⁺⁻])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$|(⁰)$/);
  if (ox && !m) {
    if (ox[3]) { s = s.slice(0, -1); return [...s].map((c) => SUB[c] ?? c).join(''); }
    const digits = [...ox[2]].map((c) => SUP[c]).join('');
    m = [ox[0], [...ox[2]].join('') + ox[1]];
    void digits;
  }
  if (m) {
    charge = '^' + [...m[1]].map((c) => SUP[c]).join('');
    s = s.slice(0, -m[1].length);
  }
  s = [...s].map((c) => SUB[c] ?? c).join('');
  s = s.replace(/\*/g, '·');
  if (!charge) {
    const a = s.match(/\^(\d*)([+-])$/);
    if (a) { charge = '^' + a[1] + a[2]; s = s.slice(0, -a[0].length); }
  }
  // "^1+" -> "^+"
  charge = charge.replace(/^\^1([+-])$/, '^$1');
  return s + charge;
}

/** Zaryadni ajratib oladi: "SO4^2-" -> { body: "SO4", charge: -2 } */
export function splitCharge(norm) {
  const m = norm.match(/\^(\d*)([+-])$/);
  if (!m) return { body: norm, charge: 0 };
  const n = m[1] ? parseInt(m[1], 10) : 1;
  return { body: norm.slice(0, -m[0].length), charge: m[2] === '+' ? n : -n };
}

/**
 * Formulani atomlarga ajratadi.
 * @param {string} text
 * @param {number} [polyN] polimer "n" qiymati
 * @returns {{atoms: Record<string, number>, charge: number}}
 */
export function parseFormula(text, polyN = POLY_N) {
  const norm = normalizeFormula(text);
  if (norm === 'e^-' || norm === 'ē' || norm === 'e') return { atoms: {}, charge: -1 };
  const { body, charge } = splitCharge(norm);
  const atoms = {};
  // gidrat qismlari
  const parts = body.split('·');
  for (const part of parts) {
    let p = part;
    let mult = 1;
    const mm = p.match(/^(\d+)(?=[A-Z([{])/);
    if (mm && parts.length > 1 && part !== parts[0]) { mult = parseInt(mm[1], 10); p = p.slice(mm[1].length); }
    const a = parseGroup(stripBonds(p), polyN);
    for (const [el, n] of Object.entries(a)) atoms[el] = (atoms[el] || 0) + n * mult;
  }
  return { atoms, charge };
}

function stripBonds(s) {
  return s.replace(/[-–—=≡:|•\s]/g, '');
}

function parseGroup(s, polyN) {
  let i = 0;
  function readCount() {
    let num = '';
    while (i < s.length && /[0-9]/.test(s[i])) num += s[i++];
    if (num) return parseInt(num, 10);
    if (s[i] === 'n' && (i + 1 >= s.length || !/[a-z]/.test(s[i + 1]))) { i++; return polyN; }
    return 1;
  }
  function parseSeq(closer) {
    const res = {};
    while (i < s.length) {
      const c = s[i];
      if (c === '(' || c === '[' || c === '{') {
        i++;
        const inner = parseSeq({ '(': ')', '[': ']', '{': '}' }[c]);
        const n = readCount();
        for (const [el, k] of Object.entries(inner)) res[el] = (res[el] || 0) + k * n;
      } else if (c === ')' || c === ']' || c === '}') {
        if (c !== closer) throw new Error(`Qavs mos emas: "${s}"`);
        i++;
        return res;
      } else if (/[A-Z]/.test(c)) {
        let el = c; i++;
        if (i < s.length && /[a-z]/.test(s[i]) && ATOMIC_MASS[el + s[i]] !== undefined) el += s[i++];
        if (ATOMIC_MASS[el] === undefined) throw new Error(`Noma'lum element "${el}" formulada "${s}"`);
        const n = readCount();
        res[el] = (res[el] || 0) + n;
      } else {
        throw new Error(`Formulada tushunarsiz belgi "${c}": "${s}"`);
      }
    }
    if (closer) throw new Error(`Qavs yopilmagan: "${s}"`);
    return res;
  }
  return parseSeq(null);
}

/** Molyar massa, g/mol (polimer uchun bitta zveno, n=1). */
export function molarMass(text) {
  const { atoms } = parseFormula(text, 1);
  let m = 0;
  for (const [el, n] of Object.entries(atoms)) m += ATOMIC_MASS[el] * n;
  return Math.round(m * 1000) / 1000;
}

/** ASCII formulani chiroyli ko'rinishga: H2SO4 -> H₂SO₄, SO4^2- -> SO₄²⁻ */
export function prettyFormula(text) {
  const norm = normalizeFormula(text);
  const { body, charge } = splitCharge(norm);
  let out = '';
  for (let k = 0; k < body.length; k++) {
    const c = body[k];
    const prev = body[k - 1];
    if (/[0-9]/.test(c) && prev !== undefined && /[A-Za-z)\]}0-9₀-₉]/.test(prev) && !isMultiplierPosition(body, k)) out += TO_SUB[c];
    else if (c === 'n' && prev !== undefined && /[)\]]/.test(prev)) out += 'ₙ';
    else out += c;
  }
  if (charge) {
    const n = Math.abs(charge);
    out += (n > 1 ? [...String(n)].map((d) => TO_SUP[d]).join('') : '') + (charge > 0 ? '⁺' : '⁻');
  }
  return out;
}

function isMultiplierPosition(body, k) {
  // gidrat ko'paytiruvchisi: "·5H2O" dagi 5
  let j = k;
  while (j > 0 && /[0-9]/.test(body[j - 1])) j--;
  return body[j - 1] === '·';
}

// ---------------------------------------------------------------------------
// Tenglamalar

const ARROW_RE = /\s(=|→|⇄|⇌|⟶|->)\s/;
const MARK_RE = /(↓|↑)$/;
// Had oxiridagi izoh: holat/konsentratsiya ("kons.", "suyult.") yoki izomer belgisi ("fruktoza").
// Formulalardagi qavslar doim katta harfli element belgilarini o'z ichiga oladi, shuning uchun
// faqat kichik harfli qavs izoh hisoblanadi.
const ANNOT_RE = /\(([a-zʻ'°.\- ]+)\)$/;

/**
 * Koeffitsiyentni o'qiydi: "2", "n", "2n", "(2n–1)"
 */
function parseCoef(tok, polyN) {
  const m = tok.match(/^(\(\d*n\s*[-–]\s*\d+\)|\d*n(?![a-z])|\d+)\s*/);
  if (!m) return { coef: 1, rest: tok };
  const raw = m[1];
  const rest = tok.slice(m[0].length);
  if (!rest) return { coef: 1, rest: tok }; // butun token raqam bo'lsa — formula sifatida qaraladi
  // "n" dan keyin katta harf bo'lsa koeffitsiyent; aks holda formula (masalan "nitro..." yo'q)
  let coef;
  if (/^\d+$/.test(raw)) coef = parseInt(raw, 10);
  else {
    const mm = raw.match(/^\(?(\d*)n\s*(?:[-–]\s*(\d+))?\)?$/);
    coef = (mm[1] ? parseInt(mm[1], 10) : 1) * polyN - (mm[2] ? parseInt(mm[2], 10) : 0);
  }
  return { coef, rest };
}

/**
 * Tenglama tomoni tokenini ajratadi.
 * @returns {{coef:number, formula:string, mark:string|null, annot:string|null, raw:string}}
 */
export function parseTerm(token, polyN = POLY_N) {
  let t = token.trim();
  let mark = null;
  let annot = null;
  for (let guard = 0; guard < 3; guard++) {
    const m1 = t.match(MARK_RE);
    if (m1) { mark = m1[1]; t = t.slice(0, -1).trim(); continue; }
    const m2 = t.match(ANNOT_RE);
    if (m2) { annot = m2[1]; t = t.slice(0, -m2[0].length).trim(); continue; }
    break;
  }
  const { coef, rest } = parseCoef(t, polyN);
  return { coef, formula: rest.trim(), mark, annot, raw: token.trim() };
}

/**
 * Tenglamani ajratadi.
 * @param {string} eq
 * @returns {{left: ReturnType<typeof parseTerm>[], right: ReturnType<typeof parseTerm>[], arrow: string}}
 */
export function parseEquation(eq, polyN = POLY_N) {
  const m = eq.match(ARROW_RE);
  if (!m) throw new Error(`Tenglamada strelka (" = " yoki " → ") topilmadi: "${eq}"`);
  const idx = m.index;
  const lhs = eq.slice(0, idx);
  const rhs = eq.slice(idx + m[0].length);
  if (ARROW_RE.test(rhs)) throw new Error(`Tenglamada bir nechta strelka: "${eq}"`);
  // " - " / " − " bilan ayirilgan had (elektron balans: "Fe²⁺ − 1e⁻ = Fe³⁺") manfiy koeffitsiyent oladi
  const split = (side) => {
    const out = [];
    for (const chunk of side.split(/\s\+\s/)) {
      const pieces = chunk.split(/\s[-−]\s/);
      pieces.forEach((x, k) => {
        if (!x.trim()) return;
        const t = parseTerm(x, polyN);
        if (k > 0) t.coef = -t.coef;
        out.push(t);
      });
    }
    return out;
  };
  return { left: split(lhs), right: split(rhs), arrow: m[1] };
}

/**
 * Atomlar va zaryad balansini tekshiradi (polimerlar uchun ikki xil n bilan).
 * @returns {{ok: boolean, errors: string[]}}
 */
export function checkBalance(eq) {
  const errors = [];
  for (const n of [POLY_N, POLY_N + 7]) {
    let parsed;
    try { parsed = parseEquation(eq, n); } catch (e) { return { ok: false, errors: [e.message] }; }
    const tot = (side) => {
      const atoms = {}; let charge = 0;
      for (const term of side) {
        const f = parseFormula(term.formula, n);
        for (const [el, k] of Object.entries(f.atoms)) atoms[el] = (atoms[el] || 0) + k * term.coef;
        charge += f.charge * term.coef;
      }
      return { atoms, charge };
    };
    let L, R;
    try { L = tot(parsed.left); R = tot(parsed.right); } catch (e) { return { ok: false, errors: [e.message] }; }
    const els = new Set([...Object.keys(L.atoms), ...Object.keys(R.atoms)]);
    for (const el of els) {
      if ((L.atoms[el] || 0) !== (R.atoms[el] || 0)) errors.push(`${el}: chapda ${L.atoms[el] || 0}, o'ngda ${R.atoms[el] || 0}`);
    }
    if (L.charge !== R.charge) errors.push(`zaryad: chapda ${L.charge}, o'ngda ${R.charge}`);
    if (errors.length) break;
  }
  return { ok: errors.length === 0, errors };
}

/** Ikki formulaning atom tarkibi va zaryadi bir xilmi */
export function sameComposition(a, b) {
  const fa = parseFormula(a), fb = parseFormula(b);
  if (fa.charge !== fb.charge) return false;
  const ka = Object.keys(fa.atoms), kb = Object.keys(fb.atoms);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => fa.atoms[k] === fb.atoms[k]);
}

/** Identifikator uchun normal kalit: bo'shliqlar va tuzilish chiziqlarisiz, zaryad "^2+" shaklida. */
export function speciesKey(text) {
  const { body, charge } = splitCharge(normalizeFormula(text));
  const b = body.replace(/[\s\-–—]/g, '');
  if (!charge) return b;
  const n = Math.abs(charge);
  return `${b}^${n === 1 ? '' : n}${charge > 0 ? '+' : '-'}`;
}
