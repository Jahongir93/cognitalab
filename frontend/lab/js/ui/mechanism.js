// "Mexanizm" paneli: tenglamalar (molekulyar, to'liq va qisqartirilgan ionli), elektron balans,
// organik reaksiyalar uchun bosqichma-bosqich animatsiyali SVG (data/mechanisms.json andozalari)
// va anorganik reaksiya turlari uchun sodda animatsiyali sxema.
//
// Ishlatish:
//   import { renderMechanism } from './ui/mechanism.js';
//   const panel = renderMechanism(container, record, mechanisms, { tab: 'anim' });
//   ...
//   panel.destroy();
//
// Faqat DOM API ishlatiladi; ma'lumotlardan kelgan matnlar textContent orqali qo'yiladi
// (formulaHTML() esa avval escape qiladi).

import { parseEquation, parseFormula } from '../engine/formula.js';
import { uz } from '../i18n/uz.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const M = uz.mechanism || {};
const L = {
  title: M.title || 'Reaksiya mexanizmi',
  molecular: M.molecular || 'Molekulyar tenglama',
  ionicFull: M.ionicFull || "To'liq ionli tenglama",
  ionicNet: M.ionicNet || 'Qisqartirilgan ionli tenglama',
  electron: M.electron || 'Elektron balans',
  steps: M.steps || 'Bosqichlar',
  play: M.play || "Ko'rsatish",
  pause: M.pause || "To'xtatish",
  next: M.stepNext || 'Keyingi bosqich',
  prev: 'Oldingi bosqich',
  oxidant: M.oxidant || 'Oksidlovchi',
  reductant: M.reductant || 'Qaytaruvchi',
  equations: 'Tenglamalar',
  anim: 'Animatsiya',
  scheme: 'Sxema',
  noEquation: 'Tenglama keltirilmagan.',
  legend: 'Ushbu reaksiyada',
  stepN: '{i}-bosqich',
  oxidation: 'oksidlanish',
  reduction: 'qaytarilish',
  derived: "Oksidlanish darajalari tenglamadan avtomatik aniqlangan.",
  noTemplate: "Bu reaksiya uchun mexanizm andozasi ko'rsatilmagan.",
  replay: 'Qaytadan',
  cathode: 'Katod (−)',
  anode: 'Anod (+)',
  saltBridge: "tuz ko'prigi",
  spectators: 'kuzatuvchi ionlar',
  multiplier: "ko'paytuvchi",
  noReaction: 'reaksiya ketmaydi',
  noReactionText: "Bu sharoitda kimyoviy reaksiya ketmaydi — kuzatiladigan o'zgarish yo'q. Sababi «Bosqichlar» bo'limida tushuntirilgan.",
};

/** Anorganik mexanizm turlarining nomi va qisqa tavsifi */
const INORGANIC = {
  neytrallanish: { name: 'Neytrallanish', text: "Kislotaning H⁺ ionlari asosning OH⁻ ionlari bilan birikib, kam dissotsilanadigan suv molekulasini hosil qiladi (proton ko'chishi). Kation va kislota qoldig'i tuz holida qoladi." },
  'ion-almashinish': { name: 'Ion almashinish', text: "Eritmadagi ionlar juftlarini almashtiradi. Reaksiya oxirigacha boradi, agar cho'kma (↓), gaz (↑) yoki kam dissotsilanadigan modda (masalan, H₂O) hosil bo'lsa. Qolgan ionlar o'zgarmaydi — ular kuzatuvchi ionlar." },
  'oksidlanish-qaytarilish': { name: 'Oksidlanish-qaytarilish', text: "Elektronlar qaytaruvchidan oksidlovchiga o'tadi: qaytaruvchi elektron berib oksidlanadi (oksidlanish darajasi ortadi), oksidlovchi elektron olib qaytariladi (oksidlanish darajasi kamayadi). Berilgan va olingan elektronlar soni teng." },
  kompleks: { name: 'Kompleks hosil bo\'lish', text: "Markaziy ion (odatda d-metall kationi) bo'sh orbitallariga ligandlarning (NH₃, OH⁻, CN⁻, H₂O …) elektron juftlarini qabul qilib, donor-akseptor bog'lar hosil qiladi. Ligandlar soni — koordinatsion son." },
  gidroliz: { name: 'Gidroliz', text: "Tuz (yoki boshqa modda) ionlari suv molekulalari bilan ta'sirlashadi: kuchsiz kislota anioni H⁺ ni, kuchsiz asos kationi OH⁻ ni bog'laydi. Natijada eritmada H⁺ yoki OH⁻ ortib, muhit kislotali yoki ishqoriy bo'ladi." },
  elektroliz: { name: 'Elektroliz', text: "O'zgarmas tok ta'sirida kationlar katodga (−) borib qaytariladi, anionlar anodga (+) borib oksidlanadi. Katodda qaytarilish, anodda oksidlanish boradi." },
  galvanik: { name: 'Galvanik element', text: "Faolroq metall (anod, −) oksidlanadi, elektronlar tashqi zanjir orqali katodga (+) o'tadi va u yerda kam faol metall ionlari qaytariladi. Tuz ko'prigi orqali ionlar harakatlanib, eritmalarni elektroneytral saqlaydi." },
  'termik-parchalanish': { name: 'Termik parchalanish', text: "Qizdirilganda murakkab modda bir nechta oddiyroq moddalarga ajraladi; issiqlik bog'larni uzish uchun energiya beradi (odatda endotermik)." },
  birikish: { name: 'Birikish', text: "Ikki yoki undan ortiq modda birikib, bitta murakkabroq modda hosil qiladi." },
  "o'rin-olish": { name: "O'rin olish", text: "Oddiy modda (faolroq metall yoki galogen) murakkab modda tarkibidagi atom yoki ionning o'rnini egallaydi; bu oksidlanish-qaytarilish reaksiyasining xususiy holi." },
  'sifat-reaksiya': { name: 'Sifat reaksiyasi', text: "Ma'lum ion yoki moddani aniqlash uchun xarakterli belgi beruvchi reaksiya: o'ziga xos rangli cho'kma, eritma rangining o'zgarishi yoki gaz ajralishi." },
  fizik: { name: 'Fizik jarayon', text: "Kimyoviy o'zgarish bo'lmaydi: moddalar tarkibi saqlanadi, faqat agregat holat, eruvchanlik yoki taqsimlanish o'zgaradi." },
  organik: { name: 'Organik reaksiya', text: '' },
};

// ---------------------------------------------------------------------------
// Formulalar: indeks va darajalar

const SUP_CH = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '−' };
const SUB_CH = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', 'ₙ': 'n' };

/**
 * Formulani bo'laklarga ajratadi: [{t, k}] — k: 'n' (oddiy), 'sub', 'sup'.
 * Qabul qiladi: "SO4^2-", "SO₄²⁻", "Ca(OH)2", "2KMnO4", "(–CH2–CH2–)n", "Mn⁺⁷", "Br^δ+".
 */
export function formulaParts(str) {
  const s = String(str ?? '');
  const parts = [];
  const push = (t, k) => {
    const last = parts[parts.length - 1];
    if (last && last.k === k) last.t += t; else parts.push({ t, k });
  };
  const isWordBreak = (c) => c === undefined || /[\s,;:·=→⇄⇌+]/.test(c);
  let prevRaw; // oldingi asl belgi
  let prevKind = 'n';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next = s[i + 1];
    if (SUP_CH[c] !== undefined) { push(SUP_CH[c], 'sup'); prevRaw = c; prevKind = 'sup'; continue; }
    if (SUB_CH[c] !== undefined) { push(SUB_CH[c], 'sub'); prevRaw = c; prevKind = 'sub'; continue; }
    if (c === '^') {
      let j = i + 1; let run = '';
      while (j < s.length && /[0-9+\-−δ•]/.test(s[j])) { run += s[j] === '-' ? '−' : s[j]; j++; }
      if (run) { push(run, 'sup'); i = j - 1; prevRaw = s[j - 1]; prevKind = 'sup'; continue; }
    }
    if (/[0-9]/.test(c) && prevRaw !== undefined && (/[A-Za-z)\]}]/.test(prevRaw) || (prevKind === 'sub' && /[0-9]/.test(prevRaw)))) {
      // "e⁻" kabi emas, harf yoki yopuvchi qavsdan keyingi raqam — indeks
      if (!(prevRaw === 'e' && i >= 1 && (i < 2 || /[\s+]/.test(s[i - 2])))) { push(c, 'sub'); prevRaw = c; prevKind = 'sub'; continue; }
    }
    if (c === 'n' && prevRaw !== undefined && /[)\]]/.test(prevRaw) && (next === undefined || !/[a-z]/.test(next))) {
      push('n', 'sub'); prevRaw = c; prevKind = 'sub'; continue;
    }
    if ((c === '+' || c === '-') && isWordBreak(next) && prevRaw !== undefined && !/\s/.test(prevRaw)) {
      const pp = s[i - 2];
      const formulaLike = /[0-9)\]A-Z]/.test(prevRaw) || (/[a-z]/.test(prevRaw) && pp !== undefined && /[A-Z]/.test(pp));
      if (formulaLike) { push(c === '-' ? '−' : '+', 'sup'); prevRaw = c; prevKind = 'sup'; continue; }
    }
    push(c, 'n'); prevRaw = c; prevKind = 'n';
  }
  return parts;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

/** Formulani xavfsiz HTML satriga aylantiradi: "SO4^2-" → "SO<sub>4</sub><sup>2−</sup>" */
export function formulaHTML(str) {
  return formulaParts(str).map((p) => (p.k === 'n' ? escapeHTML(p.t) : `<${p.k}>${escapeHTML(p.t)}</${p.k}>`)).join('');
}

/** Formulani DOM elementiga qo'shadi (sub/sup elementlari bilan) */
export function appendFormula(el, str) {
  for (const p of formulaParts(str)) {
    if (p.k === 'n') el.appendChild(document.createTextNode(p.t));
    else { const x = document.createElement(p.k); x.textContent = p.t; el.appendChild(x); }
  }
  return el;
}

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return el;
}

function s(tag, attrs, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, typeof v === 'number' ? String(Math.round(v * 100) / 100) : v);
  }
  for (const kid of kids.flat()) if (kid) el.appendChild(kid);
  return el;
}

/** SVG <text> ichiga formulani tspan'lar bilan yozadi (dy siljishi bilan; baseline-shift'ga tayanmaydi). */
function svgFormula(textEl, str, fs, plain = false) {
  const parts = plain ? [{ t: String(str), k: 'n' }] : formulaParts(str);
  let off = 0;
  for (const p of parts) {
    const want = p.k === 'sub' ? 0.3 * fs : p.k === 'sup' ? -0.42 * fs : 0;
    const ts = s('tspan', { dy: want - off });
    if (p.k !== 'n') ts.setAttribute('font-size', String(Math.round(fs * 0.68)));
    ts.textContent = p.t;
    textEl.appendChild(ts);
    off = want;
  }
  if (off) { const z = s('tspan', { dy: -off }); z.textContent = '​'; textEl.appendChild(z); }
  return textEl;
}

/** Matn kengligini taxminiy baholash (o'lchab bo'lmaganda zaxira) */
function estimateWidth(str, fs, plain = false) {
  const parts = plain ? [{ t: String(str), k: 'n' }] : formulaParts(str);
  let w = 0;
  for (const p of parts) for (const c of p.t) {
    const base = p.k === 'n' ? fs : fs * 0.68;
    w += base * (/[ilIfjt.,:;'|]/.test(c) ? 0.38 : /[()[\]–\-·]/.test(c) ? 0.47 : /[MWmw]/.test(c) ? 1.0 : /[A-Z]/.test(c) ? 0.8 : /[0-9]/.test(c) ? 0.7 : /\s/.test(c) ? 0.32 : 0.68);
  }
  return w;
}

// Haqiqiy shrift bo'yicha o'lchash: yashirin SVG'da getBBox (natija keshlanadi)
const widthCache = new Map();
let measureSvg = null;
function textWidth(str, fs, plain = false, cls = 'm-lbl') {
  const key = `${cls}|${fs}|${plain ? 1 : 0}|${str}`;
  if (widthCache.has(key)) return widthCache.get(key);
  let w = 0;
  try {
    if (typeof document !== 'undefined' && document.body) {
      if (!measureSvg || !measureSvg.isConnected) {
        const host = document.createElement('div');
        host.className = 'mech';
        host.setAttribute('aria-hidden', 'true');
        host.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden;pointer-events:none;border:0;padding:0';
        measureSvg = s('svg', { class: 'mech-svg', width: 800, height: 100 });
        host.appendChild(measureSvg);
        document.body.appendChild(host);
      }
      const t = s('text', { class: cls, 'font-size': fs });
      svgFormula(t, str, fs, plain);
      measureSvg.appendChild(t);
      w = t.getBBox().width;
      t.remove();
    }
  } catch { w = 0; }
  if (!(w > 0)) w = estimateWidth(str, fs, plain);
  widthCache.set(key, w);
  return w;
}

// ---------------------------------------------------------------------------
// Andoza belgilari (tokenlar)

/** Parametrdagi oxirgi izohni olib tashlaydi: "OH⁻ (KOH, spirtda)" → "OH⁻" */
export function cleanParam(v) {
  let x = String(v ?? '').trim();
  for (let guard = 0; guard < 3; guard++) {
    if (!x.endsWith(')')) break;
    let depth = 0, k = x.length - 1;
    for (; k >= 0; k--) { if (x[k] === ')') depth++; else if (x[k] === '(') { depth--; if (depth === 0) break; } }
    if (k > 0 && /\s/.test(x[k - 1])) x = x.slice(0, k).trim(); else break;
  }
  return x;
}

/** Oxirgi zaryadni ajratadi: {body, charge (ko'rinadigan matn), q (son yoki null)} */
export function splitTrailingCharge(v) {
  let x = String(v ?? '');
  let m = x.match(/([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])$/);
  if (m && x.length > m[0].length) {
    const n = m[1] ? parseInt([...m[1]].map((c) => SUP_CH[c]).join(''), 10) : 1;
    const sign = m[2] === '⁺' ? 1 : -1;
    return { body: x.slice(0, -m[0].length), charge: (n > 1 ? n : '') + (sign > 0 ? '+' : '−'), q: sign * n };
  }
  m = x.match(/\^(δ)?(\d*)([+\-−])$/);
  if (m) {
    const sign = m[3] === '+' ? 1 : -1;
    if (m[1]) return { body: x.slice(0, -m[0].length), charge: 'δ' + (sign > 0 ? '+' : '−'), q: sign * 0.5 };
    const n = m[2] ? parseInt(m[2], 10) : 1;
    return { body: x.slice(0, -m[0].length), charge: (n > 1 ? n : '') + (sign > 0 ? '+' : '−'), q: sign * n };
  }
  return { body: x, charge: '', q: 0 };
}

const FORMULA_LIKE = /^[A-Za-z0-9()[\]{}–\-=≡·•+⁺⁻⁰-⁹₀-₉^δ'′~/]+$/u;

function resolveToken(def, params) {
  const keys = Array.isArray(def.param) ? def.param : def.param ? [def.param] : [];
  const max = def.max ?? 12;
  for (const key of keys) {
    const raw = params?.[key];
    if (typeof raw !== 'string' || !raw.trim()) continue;
    let v = cleanParam(raw);
    if (def.map) {
      const hit = def.map[v] ?? def.map[v.replace(/\s/g, '')];
      if (hit != null) return { value: hit, raw, ok: true };
      if (def.mapOnly) continue;
    }
    if (def.regex) {
      const res = Array.isArray(def.regex) ? def.regex : [def.regex];
      let got = null;
      for (const r of res) {
        let mm; try { mm = v.match(new RegExp(r, 'u')); } catch { mm = null; }
        if (mm) { got = mm.slice(1).find((g) => g != null && g !== '') ?? null; if (got) break; }
      }
      if (!got) continue;
      v = got;
    }
    if (def.formula === false) {
      if (v.length <= max) return { value: v, raw, ok: true };
      continue;
    }
    if (v.length <= max && FORMULA_LIKE.test(v) && /[A-Z]/.test(v)) return { value: v, raw, ok: true };
  }
  return { value: def.def ?? '', raw: null, ok: false };
}

/** Andoza tokenlarini yozuv parametrlari asosida hisoblaydi */
export function buildTokens(tokenDefs, params) {
  const out = {};
  for (const [name, def] of Object.entries(tokenDefs || {})) out[name] = resolveToken(def, params || {});
  return out;
}

function tokenValue(tok, mode) {
  const v = tok.value ?? '';
  if (!mode) return v;
  const sc = splitTrailingCharge(v.replace(/•/g, ''));
  const body = sc.body;
  switch (mode) {
    case 'b': return body;
    case 'c': return sc.charge;
    case 'd': return sc.q < 0 ? 'δ−' : sc.q > 0 ? 'δ+' : '';
    case 'p': {
      const q = Math.round(sc.q) + 1;
      return q === 0 ? '' : q === 1 ? '+' : q > 1 ? q + '+' : (q === -1 ? '−' : -q + '−');
    }
    case '1': case '2': {
      const parts = cleanParam(v).split(/[–—-]/).map((x) => x.trim()).filter(Boolean);
      return parts.length === 2 ? parts[Number(mode) - 1] : '';
    }
    default: return v;
  }
}

/**
 * "{Nu:b}–C {X}" kabi satrni bo'laklarga ajratadi: [{t, tok: bool}].
 * "{A|B}" — birinchi bo'sh bo'lmagan qiymat (B literal bo'lishi ham mumkin).
 */
export function substitute(str, tokens) {
  const segs = [];
  const re = /\{([^{}]+)\}/g;
  let last = 0, m;
  const src = String(str ?? '');
  while ((m = re.exec(src))) {
    if (m.index > last) segs.push({ t: src.slice(last, m.index), tok: false });
    let val = '';
    for (const alt of m[1].split('|')) {
      const tm = alt.match(/^([A-Za-z][A-Za-z0-9]*)(?::([a-z0-9]))?$/);
      if (tm && tokens[tm[1]]) val = tokenValue(tokens[tm[1]], tm[2]);
      else if (!tm) val = alt; // literal zaxira qiymat, masalan "{S:c|δ−}"
      if (val) break;
    }
    segs.push({ t: val, tok: true });
    last = m.index + m[0].length;
  }
  if (last < src.length) segs.push({ t: src.slice(last), tok: false });
  return segs;
}
const subText = (str, tokens) => substitute(str, tokens).map((x) => x.t).join('');

/** Yozuv uchun andoza va variantni tanlaydi */
export function resolveTemplate(mechanisms, record) {
  const org = record?.mechanism?.organic;
  if (!org || !mechanisms?.templates) return null;
  const tpl = mechanisms.templates[org.template];
  if (!tpl) return null;
  const params = org.params || {};
  let steps = tpl.steps;
  let tokenDefs = tpl.tokens || {};
  let variant = null;
  let shown = tpl;
  for (const [vid, v] of Object.entries(tpl.variants || {})) {
    const keys = Array.isArray(v.when?.param) ? v.when.param : [v.when?.param];
    let re; try { re = new RegExp(v.when?.regex || '$^', 'u'); } catch { continue; }
    if (keys.some((k) => typeof params[k] === 'string' && re.test(params[k]))) {
      steps = v.steps; tokenDefs = { ...tokenDefs, ...(v.tokens || {}) }; variant = vid;
      // variant o'z nomi va tavsifiga ega bo'lishi mumkin (masalan, E1 → E1cB)
      shown = { ...tpl, name_uz: v.name_uz || tpl.name_uz, summary_uz: v.summary_uz || tpl.summary_uz };
      break;
    }
  }
  return { id: org.template, tpl: shown, steps, variant, params, tokens: buildTokens(tokenDefs, params), viewBox: tpl.viewBox || mechanisms.viewBox || [0, 0, 720, 300] };
}

// ---------------------------------------------------------------------------
// Oksidlanish darajalari (elektron balansni taxminiy chiqarish)

const FIXED = { F: -1, Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Al: 3, Zn: 2, Ag: 1 };
const GROUPS = [['SO4', 'S', 6], ['NO3', 'N', 5], ['CO3', 'C', 4], ['PO4', 'P', 5], ['SO3', 'S', 4], ['SiO3', 'Si', 4], ['ClO4', 'Cl', 7], ['ClO3', 'Cl', 5], ['MnO4', 'Mn', 7], ['CrO4', 'Cr', 6], ['Cr2O7', 'Cr', 6]];
const METALS = new Set(['Li', 'Na', 'K', 'Rb', 'Cs', 'Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Zn', 'Fe', 'Cu', 'Ag', 'Pb', 'Sn', 'Ni', 'Co', 'Mn', 'Cr', 'Hg', 'Au', 'Pt', 'Cd', 'Ti', 'V', 'Bi', 'Sb']);

/** Oddiy noorganik zarracha atomlarining oksidlanish darajalari; aniqlab bo'lmasa null */
export function oxidationStates(formula) {
  let f;
  try { f = parseFormula(formula); } catch { return null; }
  const els = Object.keys(f.atoms);
  if (!els.length) return null;
  if (els.length === 1) return { [els[0]]: f.charge / f.atoms[els[0]] };
  if (els.includes('C') && els.includes('H') && !/^(HCO3|H2CO3)/.test(formula)) {
    // organik — o'rtacha daraja ham ko'pincha butun emas; ishlatmaymiz
    if ((f.atoms.C || 0) > 1 || (f.atoms.H || 0) > 1) return null;
  }
  const st = {};
  let rest = f.charge;
  const unknown = [];
  const hasMetal = els.some((e) => METALS.has(e));
  for (const e of els) {
    let v = null;
    if (FIXED[e] != null) v = FIXED[e];
    else if (e === 'O') v = els.includes('F') ? null : -2;
    else if (e === 'H') v = (els.length === 2 && hasMetal) ? -1 : 1;
    else if (['Cl', 'Br', 'I'].includes(e) && !els.includes('O') && !els.includes('F')) {
      const others = els.filter((x) => x !== e);
      if (others.every((x) => METALS.has(x) || x === 'H' || x === 'N' || x === 'C' || x === 'S' || x === 'P')) v = -1;
    }
    if (v == null) unknown.push(e); else { st[e] = v; rest -= v * f.atoms[e]; }
  }
  if (unknown.length === 2) {
    // ma'lum ko'p atomli anion guruhini sinab ko'ramiz
    const norm = String(formula).replace(/[₀-₉]/g, (c) => SUB_CH[c]);
    for (const [g, el, val] of GROUPS) {
      if (norm.includes(g) && unknown.includes(el)) { st[el] = val; rest -= val * f.atoms[el]; unknown.splice(unknown.indexOf(el), 1); break; }
    }
  }
  if (unknown.length === 1) {
    const e = unknown[0];
    const v = rest / f.atoms[e];
    if (!Number.isInteger(v) || v < -4 || v > 8) return null;
    st[e] = v;
    return st;
  }
  return unknown.length === 0 ? st : null;
}

const SUPD = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const oxStr = (n) => (n === 0 ? '⁰' : (n > 0 ? '⁺' : '⁻') + [...String(Math.abs(n))].map((d) => SUPD[d]).join(''));

/**
 * Tenglamadan elektron balansni chiqarishga urinadi. Faqat barcha tegishli zarrachalarning
 * oksidlanish darajasi aniq bo'lsa natija beradi, aks holda null.
 * @returns {null | Array<{text:string, kind:'ox'|'red', n:number, species:string}>}
 */
export function deriveElectronBalance(eq) {
  if (!eq) return null;
  let parsed;
  try { parsed = parseEquation(eq); } catch { return null; }
  const side = (terms) => {
    const map = {}; // el -> {states:Set, species:[], simple:{formula,count}|null}
    for (const t of terms) {
      if (t.coef <= 0) continue;
      const st = oxidationStates(t.formula);
      let f; try { f = parseFormula(t.formula); } catch { return null; }
      for (const el of Object.keys(f.atoms)) {
        map[el] ??= { states: new Set(), species: [], bad: false, simple: null };
        if (!st) { map[el].bad = true; continue; }
        map[el].states.add(st[el]);
        map[el].species.push(t.formula);
        if (Object.keys(f.atoms).length === 1 && f.charge === 0) map[el].simple = { formula: t.formula, count: f.atoms[el] };
      }
    }
    return map;
  };
  const Lm = side(parsed.left), Rm = side(parsed.right);
  if (!Lm || !Rm) return null;
  const lines = [];
  for (const el of Object.keys(Lm)) {
    const a = Lm[el], b = Rm[el];
    if (!b || a.bad || b.bad) continue;
    if (a.states.size !== 1 || b.states.size !== 1) continue;
    const x = [...a.states][0], y = [...b.states][0];
    if (x === y) continue;
    const m = Math.max(a.simple?.count || 1, b.simple?.count || 1);
    const n = Math.abs(y - x) * m;
    const leftTxt = a.simple && a.simple.count > 1 ? `${el}${a.simple.count}${oxStr(x)}` : `${m > 1 ? m : ''}${el}${oxStr(x)}`;
    const rightTxt = b.simple && b.simple.count > 1 ? `${el}${b.simple.count}${oxStr(y)}` : `${m > 1 ? m : ''}${el}${oxStr(y)}`;
    const kind = y > x ? 'ox' : 'red';
    lines.push({ text: `${leftTxt} ${kind === 'ox' ? '−' : '+'} ${n}e⁻ = ${rightTxt}`, kind, n, species: a.species[0] });
  }
  if (!lines.some((l) => l.kind === 'ox') || !lines.some((l) => l.kind === 'red')) return null;
  return lines.sort((p, q) => (p.kind === 'ox' ? -1 : 1) - (q.kind === 'ox' ? -1 : 1));
}

/** Elektron balans qatorini tahlil qiladi: "Zn − 2e⁻ = Zn²⁺" */
export function parseBalanceLine(line) {
  const str = String(line);
  const m = str.match(/([+−-])\s*(\d*)\s*(?:e⁻|ē|e\^?-)/);
  if (!m) return { text: str, kind: null, n: null, species: null };
  const kind = m[1] === '+' ? 'red' : 'ox';
  const n = m[2] ? parseInt(m[2], 10) : 1;
  const lhs = str.split(/\s=\s|→/)[0].replace(m[0], '').trim();
  const rhs = (str.split(/\s=\s|→/)[1] || '').trim();
  return { text: str, kind, n, species: lhs, product: rhs };
}

function gcd(a, b) { return b ? gcd(b, a % b) : a; }

// ---------------------------------------------------------------------------
// Animatsiya muhiti

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

let uidCounter = 0;

// ---------------------------------------------------------------------------
// Organik sahna: bitta bosqichni chizish

const FS = 20; // atom yozuvi shrift o'lchami

function atomBox(atom) {
  if (!atom.label) return { hw: 0, hh: 0 };
  const w = Math.max(textWidth(atom.label, FS), FS * 0.62) + (atom.box ? 26 : 6);
  const hh = atom.box ? FS * 0.95 : FS * 0.58;
  return { hw: w / 2, hh };
}

function clipDist(atom, ux, uy) {
  const { hw, hh } = atom._box || atomBox(atom);
  if (!hw) return 0;
  const tx = Math.abs(ux) > 1e-6 ? hw / Math.abs(ux) : Infinity;
  const ty = Math.abs(uy) > 1e-6 ? hh / Math.abs(uy) : Infinity;
  return Math.min(tx, ty) + 2;
}

const LP_DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [0.7, -0.7], nw: [-0.7, -0.7], se: [0.7, 0.7], sw: [-0.7, 0.7] };

class OrganicStage {
  constructor(svg, resolved, reduced) {
    this.svg = svg;
    this.r = resolved;
    this.reduced = reduced;
    this.layers = {};
    for (const name of ['shapes', 'bonds', 'atoms', 'deco', 'arrows']) {
      this.layers[name] = s('g', { class: `m-layer m-${name}` });
      svg.appendChild(this.layers[name]);
    }
    this.cur = null; // {atoms: Map(id -> {data, g}), bonds: Map(key -> {data, g}), other: []}
    this.raf = 0;
    this.timers = [];
  }

  prepare(step) {
    const tk = this.r.tokens;
    const atoms = new Map();
    for (const a of step.atoms || []) {
      if (a.if && !(tk[a.if]?.ok)) continue;
      const label = subText(a.t ?? '', tk);
      const d = { ...a, label, charge: a.charge ? subText(a.charge, tk) : '' };
      d._box = atomBox(d);
      atoms.set(a.id, d);
    }
    const bonds = [];
    for (const b of step.bonds || []) if (atoms.has(b.a) && atoms.has(b.b)) bonds.push(b);
    return { atoms, bonds };
  }

  clearTimers() {
    cancelAnimationFrame(this.raf);
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }

  /** Bosqichni ko'rsatish; animate=false bo'lsa darhol */
  show(step, animate) {
    this.clearTimers();
    const prep = this.prepare(step);
    const prev = this.cur;
    const doAnim = animate && !this.reduced && prev;
    // eski bezaklarni o'chirish
    for (const name of ['shapes', 'deco', 'arrows']) {
      const old = [...this.layers[name].childNodes];
      if (doAnim) { old.forEach((n) => n.classList?.add('m-out')); this.timers.push(setTimeout(() => old.forEach((n) => n.remove()), 320)); }
      else old.forEach((n) => n.remove());
    }
    // atomlar
    const newAtoms = new Map();
    const from = new Map();
    for (const [id, a] of prep.atoms) {
      const g = this.drawAtom(a);
      this.layers.atoms.appendChild(g);
      newAtoms.set(id, { data: a, g });
      if (doAnim && prev.atoms.has(id)) {
        const p = prev.atoms.get(id).data;
        from.set(id, [p.x, p.y]);
        g.setAttribute('transform', `translate(${p.x} ${p.y})`);
      } else if (doAnim) {
        g.classList.add('m-in');
      }
    }
    // bog'lar
    const newBonds = new Map();
    for (const b of prep.bonds) {
      const key = b.a < b.b ? `${b.a}|${b.b}` : `${b.b}|${b.a}`;
      const g = s('g', { class: 'm-bond' + (b.s ? ` m-${b.s}` : '') });
      this.layers.bonds.appendChild(g);
      if (doAnim && !prev.bonds.has(key)) g.classList.add('m-in');
      newBonds.set(key, { data: b, g });
    }
    // eski atom/bog'lar
    if (prev) {
      for (const [id, o] of prev.atoms) {
        if (doAnim && !newAtoms.has(id)) { o.g.classList.add('m-out'); this.timers.push(setTimeout(() => o.g.remove(), 360)); }
        else o.g.remove();
      }
      for (const [, o] of prev.bonds) {
        if (doAnim) { o.g.classList.add('m-out'); this.timers.push(setTimeout(() => o.g.remove(), 300)); }
        else o.g.remove();
      }
      if (doAnim) for (const [key, o] of newBonds) if (prev.bonds.has(key)) o.g.classList.add('m-in-fast');
    }
    this.cur = { atoms: newAtoms, bonds: newBonds };
    const pos = (id) => {
      const a = newAtoms.get(id)?.data;
      return a ? [a._x ?? a.x, a._y ?? a.y] : null;
    };
    const layoutBonds = () => {
      for (const [, o] of newBonds) this.drawBond(o.g, o.data, newAtoms, pos);
    };
    const finish = () => {
      for (const [, o] of newAtoms) { o.data._x = o.data.x; o.data._y = o.data.y; o.g.setAttribute('transform', `translate(${o.data.x} ${o.data.y})`); }
      layoutBonds();
      this.drawDeco(step, prep, !!animate && !this.reduced);
    };
    // bog'lar boshlang'ich vaziyati
    for (const [id, o] of newAtoms) {
      const f = from.get(id);
      o.data._x = f ? f[0] : o.data.x; o.data._y = f ? f[1] : o.data.y;
      o.g.setAttribute('transform', `translate(${o.data._x} ${o.data._y})`);
    }
    layoutBonds();
    if (!doAnim || !from.size) {
      if (doAnim) requestAnimationFrame(() => { for (const [, o] of newAtoms) o.g.classList.remove('m-in'); for (const [, o] of newBonds) o.g.classList.remove('m-in'); });
      finish();
      return 0;
    }
    const DUR = 700;
    const t0 = performance.now();
    requestAnimationFrame(() => { for (const [, o] of newAtoms) o.g.classList.remove('m-in'); for (const [, o] of newBonds) o.g.classList.remove('m-in'); });
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / DUR);
      const e = ease(k);
      for (const [id, o] of newAtoms) {
        const f = from.get(id);
        if (!f) continue;
        o.data._x = f[0] + (o.data.x - f[0]) * e;
        o.data._y = f[1] + (o.data.y - f[1]) * e;
        o.g.setAttribute('transform', `translate(${o.data._x} ${o.data._y})`);
      }
      layoutBonds();
      if (k < 1) this.raf = requestAnimationFrame(tick); else finish();
    };
    this.raf = requestAnimationFrame(tick);
    return DUR;
  }

  drawAtom(a) {
    const g = s('g', { class: `m-atom${a.role ? ' m-r-' + a.role : ''}${a.ghost ? ' m-ghost' : ''}`, 'data-id': a.id });
    if (!a.label) return g;
    const { hw, hh } = a._box;
    if (a.box) g.appendChild(s('rect', { class: 'm-box', x: -hw, y: -hh, width: hw * 2, height: hh * 2, rx: 8 }));
    else g.appendChild(s('rect', { class: 'm-mask', x: -hw + 1, y: -hh + 1, width: hw * 2 - 2, height: hh * 2 - 2, rx: 4 }));
    const t = s('text', { class: 'm-lbl', 'text-anchor': 'middle', y: FS * 0.35, 'font-size': FS });
    svgFormula(t, a.label, FS);
    g.appendChild(t);
    if (a.charge) {
      const isPlain = /^[0-9]*[+−-]$/.test(a.charge);
      const cx = hw + (isPlain ? 4 : 6), cy = -hh - 1;
      if (isPlain) {
        g.appendChild(s('circle', { class: 'm-chg-c', cx, cy, r: a.charge.length > 1 ? 9 : 7.5 }));
        g.appendChild(s('text', { class: 'm-chg', x: cx, y: cy + 4.2, 'text-anchor': 'middle', text: a.charge.replace('-', '−') }));
      } else {
        g.appendChild(s('text', { class: 'm-chg m-delta', x: cx - 2, y: cy + 2, 'text-anchor': 'start', text: a.charge }));
      }
    }
    for (const d of a.lp || []) {
      const v = LP_DIRS[d]; if (!v) continue;
      const r = Math.abs(v[0]) > 0.1 && Math.abs(v[1]) > 0.1 ? Math.hypot(hw, hh) * 0.8 : Math.abs(v[0]) ? hw + 5 : hh + 4;
      const px = v[0] * r, py = v[1] * r;
      const tx = -v[1] * 4, ty = v[0] * 4;
      g.appendChild(s('circle', { class: 'm-lp', cx: px + tx, cy: py + ty, r: 2.3 }));
      g.appendChild(s('circle', { class: 'm-lp', cx: px - tx, cy: py - ty, r: 2.3 }));
    }
    if (a.rad) {
      const v = LP_DIRS[a.rad] || LP_DIRS.e;
      const r = Math.abs(v[0]) ? hw + 5 : hh + 4;
      g.appendChild(s('circle', { class: 'm-rad', cx: v[0] * r, cy: v[1] * r, r: 3.4 }));
    }
    return g;
  }

  drawBond(g, b, atoms, pos) {
    while (g.firstChild) g.firstChild.remove();
    const A = atoms.get(b.a).data, Bd = atoms.get(b.b).data;
    const [x1, y1] = pos(b.a), [x2, y2] = pos(b.b);
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const c1 = clipDist(A, ux, uy), c2 = clipDist(Bd, -ux, -uy);
    if (c1 + c2 > len - 4) return;
    const ax = x1 + ux * c1, ay = y1 + uy * c1, bx = x2 - ux * c2, by = y2 - uy * c2;
    const nx = -uy, ny = ux;
    const line = (o, cls) => g.appendChild(s('line', { x1: ax + nx * o, y1: ay + ny * o, x2: bx + nx * o, y2: by + ny * o, class: cls }));
    const o = b.o || 1;
    if (b.s === 'wedge') {
      g.appendChild(s('polygon', { class: 'm-wedge', points: `${ax},${ay} ${bx + nx * 5},${by + ny * 5} ${bx - nx * 5},${by - ny * 5}` }));
      return;
    }
    if (b.s === 'hash') {
      const n = 6;
      for (let i = 1; i <= n; i++) {
        const k = i / n, w = 5 * k;
        const px = ax + (bx - ax) * k, py = ay + (by - ay) * k;
        g.appendChild(s('line', { class: 'm-hash', x1: px + nx * w, y1: py + ny * w, x2: px - nx * w, y2: py - ny * w }));
      }
      return;
    }
    const base = b.s === 'partial' || b.s === 'forming' || b.s === 'breaking' ? 'm-b m-dash' : 'm-b';
    if (o === 2) { line(3.6, base); line(-3.6, base); }
    else if (o === 3) { line(0, base); line(5, base); line(-5, base); }
    else if (o === 1.5) { line(3.6, base); line(-3.6, 'm-b m-dash'); }
    else line(0, base);
  }

  pointOf(ref, other) {
    // ref: atom id yoki "a-b" (bog' o'rtasi); qaytaradi {x, y, clip}
    const atoms = this.cur.atoms;
    if (atoms.has(ref)) { const a = atoms.get(ref).data; return { x: a.x, y: a.y, atom: a }; }
    const [p, q] = String(ref).split('-');
    const A = atoms.get(p)?.data, Bd = atoms.get(q)?.data;
    if (!A || !Bd) return null;
    void other;
    return { x: (A.x + Bd.x) / 2, y: (A.y + Bd.y) / 2, atom: null };
  }

  drawDeco(step, prep, animate) {
    const tk = this.r.tokens;
    const L_ = this.layers;
    const fadeIn = (el, delay = 0) => {
      if (!animate) return el;
      el.classList.add('m-in');
      this.timers.push(setTimeout(() => el.classList.remove('m-in'), 30 + delay));
      return el;
    };
    for (const sh of step.shapes || []) {
      let el = null;
      if (sh.type === 'circle') el = s('circle', { class: 'm-ring', cx: sh.cx, cy: sh.cy, r: sh.r });
      else if (sh.type === 'arc') {
        const p = (deg) => [sh.cx + sh.r * Math.cos(deg * Math.PI / 180), sh.cy + sh.r * Math.sin(deg * Math.PI / 180)];
        const [x1, y1] = p(sh.a1), [x2, y2] = p(sh.a2);
        const large = ((sh.a2 - sh.a1 + 360) % 360) > 180 ? 1 : 0;
        el = s('path', { class: 'm-ring' + (sh.dashed ? ' m-dash' : ''), d: `M${x1},${y1} A${sh.r},${sh.r} 0 ${large} 1 ${x2},${y2}` });
      } else if (sh.type === 'lobes') {
        el = s('g', { class: 'm-lobes' },
          s('ellipse', { cx: sh.x - sh.dx * 0.62, cy: sh.y, rx: sh.dx * 0.6, ry: sh.ry || 20 }),
          s('ellipse', { cx: sh.x + sh.dx * 0.62, cy: sh.y, rx: sh.dx * 0.6, ry: sh.ry || 20 }));
      } else if (sh.type === 'oval') el = s('ellipse', { class: 'm-oval', cx: sh.cx, cy: sh.cy, rx: sh.rx, ry: sh.ry });
      else if (sh.type === 'surface') {
        el = s('g', { class: 'm-surface' });
        el.appendChild(s('rect', { x: sh.x1, y: sh.y, width: sh.x2 - sh.x1, height: 16, rx: 3 }));
        for (let x = sh.x1 + 14; x < sh.x2; x += 28) el.appendChild(s('circle', { cx: x, cy: sh.y + 8, r: 5 }));
        if (sh.label) { const t = s('text', { x: sh.x2 + 8, y: sh.y + 13, class: 'm-note', 'text-anchor': 'start' }); svgRich(t, sh.label, tk, 14); el.appendChild(t); }
      }
      if (el) L_.shapes.appendChild(fadeIn(el));
    }
    for (const bk of step.brackets || []) {
      const { x1, y1, x2, y2 } = bk;
      const k = 10;
      const g = s('g', { class: 'm-brk' },
        s('path', { d: `M${x1 + k},${y1} H${x1} V${y2} H${x1 + k}` }),
        s('path', { d: `M${x2 - k},${y1} H${x2} V${y2} H${x2 - k}` }));
      if (bk.ts) g.appendChild(s('text', { x: x2 + 4, y: y1 + 14, class: 'm-ts', text: '‡' }));
      if (bk.charge) g.appendChild(s('text', { x: x2 + 16, y: y1 + 14, class: 'm-ts', text: bk.charge }));
      if (bk.sub) g.appendChild(s('text', { x: x2 + 4, y: y2 + 2, class: 'm-ts m-sub', text: bk.sub }));
      L_.deco.appendChild(fadeIn(g));
    }
    for (const rx of step.rxn || []) {
      const g = s('g', { class: 'm-rxn' });
      g.appendChild(s('line', { x1: rx.x1, y1: rx.y1, x2: rx.x2 - 8, y2: rx.y2 }));
      g.appendChild(s('path', { class: 'm-rxn-head', d: headPath(rx.x2, rx.y2, 0, 11, false) }));
      if (rx.t) { const t = s('text', { x: (rx.x1 + rx.x2) / 2, y: rx.y1 - 9, 'text-anchor': 'middle', class: 'm-note' }); svgRich(t, rx.t, tk, 14); g.appendChild(t); }
      if (rx.t2) { const t = s('text', { x: (rx.x1 + rx.x2) / 2, y: rx.y1 + 20, 'text-anchor': 'middle', class: 'm-note' }); svgRich(t, rx.t2, tk, 14); g.appendChild(t); }
      L_.deco.appendChild(fadeIn(g));
    }
    for (const tx of step.text || []) {
      const cls = tx.cls || 'note';
      const fs = cls === 'plus' || cls === 'big' ? 24 : cls === 'coef' ? 20 : cls === 'formula' ? 17 : 14;
      const t = s('text', { x: tx.x, y: tx.y + fs * 0.35, 'text-anchor': tx.anchor || 'middle', class: `m-${cls}` });
      svgRich(t, tx.t, tk, fs, cls === 'formula');
      L_.deco.appendChild(fadeIn(t));
    }
    // egri strelkalar
    let delay = animate ? 120 : 0;
    for (const ar of step.arrows || []) {
      const geo = this.arrowGeometry(ar);
      if (!geo) continue;
      const cls = `m-arrow${ar.half ? ' m-half' : ''}${ar.kind === 'move' ? ' m-move' : ''}${ar.ghost ? ' m-ghost' : ''}`;
      const g = s('g', { class: cls });
      const path = s('path', { d: geo.d, class: 'm-arrow-path' });
      const head = s('path', { d: headPath(geo.ex, geo.ey, geo.angle, 11, !!ar.half), class: 'm-arrow-head' });
      g.appendChild(path); g.appendChild(head);
      L_.arrows.appendChild(g);
      if (animate) {
        const len = geo.len;
        path.style.strokeDasharray = `${len} ${len}`;
        path.style.strokeDashoffset = String(len);
        head.style.opacity = '0';
        const d0 = delay;
        this.timers.push(setTimeout(() => {
          path.style.transition = 'stroke-dashoffset 650ms ease-in-out';
          path.style.strokeDashoffset = '0';
        }, d0));
        this.timers.push(setTimeout(() => { head.style.transition = 'opacity 160ms'; head.style.opacity = '1'; }, d0 + 560));
        this.timers.push(setTimeout(() => { if (ar.kind !== 'move') path.style.strokeDasharray = ''; }, d0 + 760));
        delay += 520;
      }
    }
    return delay;
  }

  arrowGeometry(ar) {
    const P = this.pointOf(ar.from), Q = this.pointOf(ar.to);
    if (!P || !Q) return null;
    let x0 = P.x + (ar.fromOffset?.[0] || 0), y0 = P.y + (ar.fromOffset?.[1] || 0);
    let x3 = Q.x + (ar.toOffset?.[0] || 0), y3 = Q.y + (ar.toOffset?.[1] || 0);
    const dx = x3 - x0, dy = y3 - y0, dist = Math.hypot(dx, dy) || 1;
    const bend = ar.bend ?? 0.4;
    // musbat bend — harakat yo'nalishining chap tomoniga (ekranda yuqoriga) bo'rtadi
    const nx = dy / dist, ny = -dx / dist;
    const hgt = bend * Math.min(dist, 260) * 0.75;
    const c1 = [x0 + dx * 0.25 + nx * hgt, y0 + dy * 0.25 + ny * hgt];
    const c2 = [x0 + dx * 0.75 + nx * hgt, y0 + dy * 0.75 + ny * hgt];
    const shorten = (pt, ctrl, info, extra, hasOffset) => {
      const vx = ctrl[0] - pt[0], vy = ctrl[1] - pt[1], vl = Math.hypot(vx, vy) || 1;
      const ux = vx / vl, uy = vy / vl;
      const r = hasOffset ? 3 : info.atom ? clipDist(info.atom, ux, uy) + extra : 5;
      return [pt[0] + ux * r, pt[1] + uy * r];
    };
    [x0, y0] = shorten([x0, y0], c1, P, P.atom?.lp?.length ? 10 : 4, !!ar.fromOffset);
    [x3, y3] = shorten([x3, y3], c2, Q, 6, !!ar.toOffset);
    const d = `M${x0.toFixed(1)},${y0.toFixed(1)} C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}`;
    const angle = Math.atan2(y3 - c2[1], x3 - c2[0]);
    // uzunlikni taxminan hisoblash (yashirin elementda getTotalLength ishonchsiz)
    let len = 0, px = x0, py = y0;
    for (let i = 1; i <= 24; i++) {
      const t = i / 24, mt = 1 - t;
      const bx = mt ** 3 * x0 + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * x3;
      const by = mt ** 3 * y0 + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * y3;
      len += Math.hypot(bx - px, by - py); px = bx; py = by;
    }
    return { d, ex: x3, ey: y3, angle, len: Math.ceil(len) + 2 };
  }

  destroy() { this.clearTimers(); }
}

function headPath(x, y, angle, size, half) {
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const pt = (bx, by) => `${(x + bx * ca - by * sa).toFixed(1)},${(y + bx * sa + by * ca).toFixed(1)}`;
  const w = size * 0.45;
  if (half) return `M${pt(0, 0)} L${pt(-size, -w)} L${pt(-size * 0.75, 0)} Z`;
  return `M${pt(0, 0)} L${pt(-size, -w)} L${pt(-size * 0.72, 0)} L${pt(-size, w)} Z`;
}

/** Literal matn + token qiymatlari (formulalar) aralash SVG yozuvi */
function svgRich(textEl, str, tokens, fs, allFormula = false) {
  for (const seg of substitute(str, tokens)) {
    if (!seg.t) continue;
    if (seg.tok || allFormula) {
      const parts = formulaParts(seg.t);
      let off = 0;
      for (const p of parts) {
        const want = p.k === 'sub' ? 0.3 * fs : p.k === 'sup' ? -0.42 * fs : 0;
        const ts = s('tspan', { dy: want - off });
        if (p.k !== 'n') ts.setAttribute('font-size', String(Math.round(fs * 0.7)));
        ts.textContent = p.t; textEl.appendChild(ts); off = want;
      }
      if (off) { const z = s('tspan', { dy: -off }); z.textContent = '​'; textEl.appendChild(z); }
    } else {
      const ts = s('tspan'); ts.textContent = seg.t; textEl.appendChild(ts);
    }
  }
}

/** HTML elementiga literal matn + token formulalarini qo'shadi */
function appendRich(el, str, tokens) {
  for (const seg of substitute(str, tokens)) {
    if (!seg.t) continue;
    if (seg.tok) appendFormula(el, seg.t); else el.appendChild(document.createTextNode(seg.t));
  }
  return el;
}

// ---------------------------------------------------------------------------
// Anorganik sxemalar

function termsOf(eq) {
  if (!eq) return null;
  try { return parseEquation(eq); } catch { return null; }
}
const chargeOfTerm = (f) => { try { return parseFormula(f).charge; } catch { return 0; } };
const dropCoef = (t) => t.formula;

function particle(x, y, label, kind, r = 26) {
  const g = s('g', { class: `mx-p mx-${kind}` });
  const fs = label.length > 6 ? 13 : 16;
  const rr = Math.max(r, textWidth(label, fs) / 2 + 9);
  g.appendChild(s('circle', { cx: x, cy: y, r: rr }));
  const t = s('text', { x, y: y + fs * 0.36, 'text-anchor': 'middle', 'font-size': fs, class: 'mx-lbl' });
  svgFormula(t, label, fs);
  g.appendChild(t);
  return g;
}
function caption(x, y, text, cls = 'mx-cap', anchor = 'middle', formula = false) {
  const t = s('text', { x, y, 'text-anchor': anchor, class: cls });
  if (formula) svgFormula(t, text, 14); else t.textContent = text;
  return t;
}
const animated = (el, name, vars = {}) => {
  el.classList.add('mx-a', `mx-${name}`);
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(`--${k}`, typeof v === 'number' ? `${v}px` : v);
  return el;
};
const kindOf = (f) => { const q = chargeOfTerm(f); return q > 0 ? 'cat' : q < 0 ? 'an' : 'neu'; };

function balanceInfo(record) {
  const eb = record?.equation?.electron_balance;
  if (Array.isArray(eb) && eb.length) return { lines: eb.map(parseBalanceLine), derived: false };
  if (typeof eb === 'string' && eb.trim()) return { lines: eb.split(/\n|;/).map((x) => parseBalanceLine(x.trim())).filter((x) => x.text), derived: false };
  const type = record?.mechanism?.type;
  if (!['oksidlanish-qaytarilish', "o'rin-olish", 'termik-parchalanish', 'birikish', 'elektroliz', 'galvanik', 'sifat-reaksiya'].includes(type)) return null;
  const d = deriveElectronBalance(record?.equation?.ionic_net) || deriveElectronBalance(record?.equation?.molecular);
  return d ? { lines: d.map((x) => ({ ...parseBalanceLine(x.text), species: x.species })), derived: true } : null;
}

/** Anorganik tur uchun SVG sxema; mos sxema bo'lmasa null */
function inorganicScheme(record) {
  const type = record?.mechanism?.type;
  const eqn = record?.equation || {};
  const W = 720, Hh = 260;
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'mech-svg mx-svg', role: 'img' });
  const net = termsOf(eqn.ionic_net) || termsOf(eqn.molecular);
  const label = (t) => t?.formula ?? '';

  if (type === 'neytrallanish') {
    const left = net?.left || [];
    const isSp = (f, atoms, q) => { try { const p = parseFormula(f); return p.charge === q && Object.keys(atoms).length === Object.keys(p.atoms).length && Object.entries(atoms).every(([k, v]) => p.atoms[k] === v); } catch { return false; } };
    const hplus = left.find((t) => isSp(t.formula, { H: 1 }, 1) || isSp(t.formula, { H: 3, O: 1 }, 1));
    const oh = left.find((t) => isSp(t.formula, { O: 1, H: 1 }, -1));
    // H⁺ yoki OH⁻ ning o'rnida erimaydigan asos/kislota bo'lishi mumkin (Zn(OH)2 + 2H⁺)
    const a = hplus ? label(hplus) : (left.find((t) => t !== oh)?.formula || 'H⁺');
    const b = oh ? label(oh) : (left.find((t) => t !== hplus)?.formula || 'OH⁻');
    svg.setAttribute('aria-label', 'H⁺ va OH⁻ ionlari birikib suv hosil qiladi');
    svg.appendChild(animated(particle(150, 120, a, 'cat'), 'meet', { dx: 170 }));
    svg.appendChild(animated(particle(570, 120, b, 'an', 30), 'meet', { dx: -190 }));
    svg.appendChild(animated(particle(345, 120, 'H₂O', 'neu', 32), 'appear'));
    svg.appendChild(animated(s('path', { d: 'M190,70 C260,30 330,30 380,70', class: 'mx-arrow' }), 'fade'));
    svg.appendChild(animated(caption(285, 32, "proton ko'chishi: H⁺ → OH⁻"), 'fade'));
    svg.appendChild(caption(360, 230, "H⁺ + OH⁻ → H₂O   (kam dissotsilanadi)", 'mx-cap mx-strong'));
    return svg;
  }

  if (type === 'ion-almashinish' || (type === 'sifat-reaksiya' && net?.right?.some((t) => t.mark))) {
    const left = (net?.left || []).filter((t) => t.formula !== 'H2O');
    const right = net?.right || [];
    const ions = left.slice(0, 3);
    const prod = right.find((t) => t.mark === '↓') || right.find((t) => t.mark === '↑') || right[0];
    if (!ions.length || !prod) return null;
    const mark = prod.mark;
    svg.setAttribute('aria-label', 'Ion almashinish sxemasi');
    const xs = ions.length === 1 ? [200] : ions.length === 2 ? [150, 570] : [120, 360, 600];
    ions.forEach((t, i) => {
      const x = xs[i];
      svg.appendChild(animated(particle(x, ions.length > 2 ? 70 : 100, label(t), kindOf(t.formula)), 'meet', { dx: 360 - x }));
    });
    // kuzatuvchi ionlar
    const full = termsOf(eqn.ionic_full);
    if (full) {
      const netSet = new Set((net?.left || []).map((t) => t.formula));
      const spect = full.left.filter((t) => chargeOfTerm(t.formula) !== 0 && !netSet.has(t.formula)).slice(0, 2);
      spect.forEach((t, i) => svg.appendChild(animated(particle(80 + i * 560, 200, label(t), kindOf(t.formula) + ' mx-spect', 20), 'bob')));
      if (spect.length) svg.appendChild(caption(80, 248, L.spectators, 'mx-cap mx-dim', 'start'));
    }
    const pk = mark === '↓' ? 'ppt' : mark === '↑' ? 'gas' : 'neu';
    // asosiy (yakuniy) holat: cho'kma pastda, gaz yuqorida — harakatsiz rejimda ham to'g'ri ko'rinadi
    const pg = particle(360, mark === '↓' ? 195 : mark === '↑' ? 30 : 100, label(prod), pk, 30);
    svg.appendChild(animated(pg, mark === '↓' ? 'fall' : mark === '↑' ? 'rise' : 'appear', { fall: 95, rise: -70 }));
    if (mark === '↓') {
      svg.appendChild(s('path', { d: 'M300,225 Q360,205 420,225 Z', class: 'mx-pile' }));
      svg.appendChild(caption(450, 240, "cho'kma ↓", 'mx-cap mx-strong', 'start'));
    } else if (mark === '↑') {
      for (let i = 0; i < 4; i++) svg.appendChild(animated(s('circle', { cx: 330 + i * 20, cy: 200, r: 5 + (i % 2) * 2, class: 'mx-bubble' }), 'bubble', { delay: `${i * 0.45}s` }));
      svg.appendChild(caption(420, 34, 'gaz ↑', 'mx-cap mx-strong', 'start'));
    }
    return svg;
  }

  if (type === 'oksidlanish-qaytarilish' || type === "o'rin-olish") {
    const bal = balanceInfo(record);
    const ox = bal?.lines.find((l) => l.kind === 'ox');
    const red = bal?.lines.find((l) => l.kind === 'red');
    if (!ox || !red) {
      if (type === "o'rin-olish" && net && net.left.length >= 2) return reorganize(svg, net, 'swap');
      return null;
    }
    const n = (() => { const g = gcd(ox.n, red.n); return (ox.n * red.n) / g; })();
    svg.setAttribute('aria-label', `Elektronlar qaytaruvchidan oksidlovchiga o'tadi: ${n} e⁻`);
    const sp = (x) => String(x || '').replace(/^\d+/, '');
    svg.appendChild(particle(140, 120, sp(ox.species) || '?', 'red', 34));
    svg.appendChild(particle(580, 120, sp(red.species) || '?', 'ox', 34));
    svg.appendChild(s('path', { d: 'M185,95 C300,20 420,20 535,95', class: 'mx-arrow mx-e-path' }));
    for (let i = 0; i < 3; i++) {
      const e = s('g', { class: 'mx-e' }, s('circle', { cx: 0, cy: 0, r: 9 }), (() => { const t = s('text', { x: 0, y: 4, 'text-anchor': 'middle', 'font-size': 11 }); t.textContent = 'e⁻'; return t; })());
      animated(e, 'electron', { delay: `${i * 0.7}s` });
      svg.appendChild(e);
    }
    svg.appendChild(caption(360, 26, `${n} e⁻`, 'mx-cap mx-strong'));
    svg.appendChild(caption(140, 182, `${L.reductant} — ${L.oxidation}`, 'mx-cap mx-red'));
    svg.appendChild(caption(580, 182, `${L.oxidant} — ${L.reduction}`, 'mx-cap mx-ox'));
    svg.appendChild(caption(140, 212, ox.text, 'mx-cap', 'middle', true));
    svg.appendChild(caption(580, 212, red.text, 'mx-cap', 'middle', true));
    return svg;
  }

  if (type === 'kompleks') {
    const all = [...(net?.right || []), ...(net?.left || [])];
    const cx = all.map((t) => t.formula).find((f) => /\[/.test(f));
    let central = 'M', lig = 'L', n = 4;
    if (cx) {
      const m = cx.match(/\[([A-Z][a-z]?)(?:\(([^()]+)\)|([A-Z][a-z]?[A-Za-z0-9]*?))(\d)?\]/);
      if (m) { central = m[1]; lig = m[2] || m[3] || 'L'; n = m[4] ? parseInt(m[4], 10) : (m[2] ? 1 : 1); }
      if (!m?.[4]) { const mm = cx.match(/\(([^()]+)\)(\d)\]/); if (mm) { lig = mm[1]; n = parseInt(mm[2], 10); } }
    }
    n = Math.min(Math.max(n, 2), 6);
    svg.setAttribute('aria-label', `Kompleks: markaziy ion ${central}, ligand ${lig}, koordinatsion son ${n}`);
    const cxp = 360, cyp = 120, R = 82;
    for (let i = 0; i < n; i++) {
      const ang = (-90 + (360 / n) * i) * Math.PI / 180;
      const tx = cxp + R * Math.cos(ang), ty = cyp + R * Math.sin(ang);
      const fx = cxp + 2.1 * R * Math.cos(ang), fy = cyp + 1.4 * R * Math.sin(ang);
      svg.appendChild(animated(s('line', { x1: cxp, y1: cyp, x2: tx, y2: ty, class: 'mx-coord' }), 'appear'));
      const p = particle(tx, ty, lig, 'lig', 20);
      svg.appendChild(animated(p, 'arrive', { fx: fx - tx, fy: fy - ty }));
    }
    svg.appendChild(particle(cxp, cyp, central, 'cat', 28));
    if (cx) svg.appendChild(caption(600, 236, cx, 'mx-cap mx-strong', 'middle', true));
    svg.appendChild(caption(140, 236, `koordinatsion son: ${n}`, 'mx-cap'));
    return svg;
  }

  if (type === 'gidroliz') {
    const left = (net?.left || []).filter((t) => t.formula !== 'H2O' && t.formula !== 'H₂O');
    const ion = left[0]?.formula || 'Aⁿ⁻';
    const right = (net?.right || []).map((t) => t.formula);
    const acid = right.some((f) => /^H(\^?\+|⁺)$|H3O/.test(f));
    const base = right.some((f) => /^OH(\^?-|⁻)$/.test(f));
    const q = chargeOfTerm(ion);
    const grab = q > 0 ? 'OH⁻' : 'H⁺';
    const free = q > 0 ? 'H⁺' : 'OH⁻';
    svg.setAttribute('aria-label', 'Gidroliz: ion suv molekulasi bilan ta\'sirlashadi');
    svg.appendChild(particle(130, 110, ion, q > 0 ? 'cat' : q < 0 ? 'an' : 'neu', 30));
    const water = s('g');
    water.appendChild(animated(particle(400, 110, grab, grab === 'H⁺' ? 'cat' : 'an', 22), 'meet', { dx: -200 }));
    water.appendChild(animated(particle(452, 110, free, free === 'H⁺' ? 'cat' : 'an', 22), 'drift', { dx: 150 }));
    svg.appendChild(water);
    svg.appendChild(animated(caption(426, 60, 'H–OH', 'mx-cap mx-strong'), 'fadeout'));
    const medium = acid ? 'kislotali muhit (pH < 7)' : base ? 'ishqoriy muhit (pH > 7)' : (q > 0 ? 'kislotali muhit (pH < 7)' : q < 0 ? 'ishqoriy muhit (pH > 7)' : '');
    if (medium) svg.appendChild(caption(600, 200, medium, 'mx-cap mx-strong'));
    if (eqn.ionic_net) svg.appendChild(caption(300, 240, eqn.ionic_net, 'mx-cap', 'middle', true));
    return svg;
  }

  if (type === 'elektroliz') {
    const bal = balanceInfo(record);
    const cat = bal?.lines.find((l) => l.kind === 'red');
    const an = bal?.lines.find((l) => l.kind === 'ox');
    const sp = (x) => String(x || '').replace(/^\d+/, '').split(/\s\+\s/)[0];
    const cation = cat && chargeOfTerm(sp(cat.species)) > 0 ? sp(cat.species) : (cat ? sp(cat.species) : 'Kⁿ⁺');
    const anion = an ? sp(an.species) : 'Aⁿ⁻';
    svg.setAttribute('aria-label', 'Elektroliz: kationlar katodga, anionlar anodga');
    svg.appendChild(s('rect', { x: 150, y: 40, width: 420, height: 170, rx: 10, class: 'mx-bath' }));
    svg.appendChild(s('rect', { x: 180, y: 20, width: 18, height: 170, class: 'mx-electrode mx-cathode' }));
    svg.appendChild(s('rect', { x: 522, y: 20, width: 18, height: 170, class: 'mx-electrode mx-anode' }));
    svg.appendChild(caption(189, 14, '−', 'mx-cap mx-strong'));
    svg.appendChild(caption(531, 14, '+', 'mx-cap mx-strong'));
    for (let i = 0; i < 2; i++) {
      svg.appendChild(animated(particle(380 + i * 40, 80 + i * 70, cation, 'cat', 20), 'toward', { dx: -160 - i * 40, delay: `${i * 1.2}s` }));
      svg.appendChild(animated(particle(340 - i * 40, 115 + i * 60, anion, 'an', 20), 'toward', { dx: 160 + i * 40, delay: `${i * 1.2 + 0.6}s` }));
    }
    svg.appendChild(caption(110, 228, L.cathode, 'mx-cap mx-strong', 'start'));
    svg.appendChild(caption(610, 228, L.anode, 'mx-cap mx-strong', 'end'));
    if (cat) svg.appendChild(caption(110, 250, cat.text, 'mx-cap', 'start', true));
    if (an) svg.appendChild(caption(610, 250, an.text, 'mx-cap', 'end', true));
    return svg;
  }

  if (type === 'galvanik') {
    const gal = record.galvanic || {};
    const bal = balanceInfo(record);
    const ox = bal?.lines.find((l) => l.kind === 'ox');
    const red = bal?.lines.find((l) => l.kind === 'red');
    svg.setAttribute('aria-label', 'Galvanik element: elektronlar anoddan katodga');
    svg.appendChild(s('rect', { x: 90, y: 110, width: 200, height: 110, rx: 10, class: 'mx-bath' }));
    svg.appendChild(s('rect', { x: 430, y: 110, width: 200, height: 110, rx: 10, class: 'mx-bath' }));
    svg.appendChild(s('rect', { x: 180, y: 70, width: 18, height: 130, class: 'mx-electrode mx-anode-g' }));
    svg.appendChild(s('rect', { x: 522, y: 70, width: 18, height: 130, class: 'mx-electrode mx-cathode-g' }));
    svg.appendChild(s('path', { d: 'M260,150 V120 H460 V150', class: 'mx-bridge' }));
    svg.appendChild(caption(360, 102, L.saltBridge, 'mx-cap mx-dim'));
    svg.appendChild(s('path', { d: 'M189,70 V36 H531 V70', class: 'mx-wire' }));
    for (let i = 0; i < 3; i++) {
      const e = s('g', { class: 'mx-e' }, s('circle', { cx: 0, cy: 0, r: 8 }), (() => { const t = s('text', { x: 0, y: 4, 'text-anchor': 'middle', 'font-size': 10 }); t.textContent = 'e⁻'; return t; })());
      svg.appendChild(animated(e, 'wiremove', { delay: `${i * 0.9}s` }));
    }
    svg.appendChild(caption(189, 240, `Anod (−): ${gal.anode || ''}`, 'mx-cap mx-strong'));
    svg.appendChild(caption(531, 240, `Katod (+): ${gal.cathode || ''}`, 'mx-cap mx-strong'));
    if (ox) svg.appendChild(caption(189, 258, ox.text, 'mx-cap', 'middle', true));
    if (red) svg.appendChild(caption(531, 258, red.text, 'mx-cap', 'middle', true));
    return svg;
  }

  // bu turlar uchun molekulyar tenglama ko'rgazmaliroq
  const mol = termsOf(eqn.molecular) || net;
  if (type === 'termik-parchalanish' && mol) return reorganize(svg, mol, 'split');
  if (type === 'birikish' && mol) return reorganize(svg, mol, 'join');
  if (type === "o'rin-olish" && mol) return reorganize(svg, mol, 'swap');
  return null;
}

/** Umumiy "moddalar qayta guruhlanadi" sxemasi */
function reorganize(svg, net, mode) {
  const L_ = net.left.filter((t) => t.coef > 0).slice(0, 3);
  const R_ = net.right.filter((t) => t.coef > 0).slice(0, 3);
  if (!L_.length || !R_.length) return null;
  const xsL = L_.length === 1 ? [200] : L_.length === 2 ? [130, 270] : [90, 200, 310];
  const xsR = R_.length === 1 ? [540] : R_.length === 2 ? [470, 620] : [430, 540, 650];
  L_.forEach((t, i) => svg.appendChild(animated(particle(xsL[i], 120, t.formula, kindOf(t.formula), 28), 'leave', { dx: 360 - xsL[i] })));
  R_.forEach((t, i) => {
    const p = particle(xsR[i], 120, t.formula, t.mark === '↓' ? 'ppt' : t.mark === '↑' ? 'gas' : kindOf(t.formula), 28);
    svg.appendChild(animated(p, t.mark === '↑' ? 'emerge-up' : 'emerge', { dx: 360 - xsR[i], rise: -40 }));
  });
  svg.appendChild(s('path', { d: 'M335,120 H385', class: 'mx-arrow mx-rx' }));
  svg.appendChild(s('path', { d: headPath(392, 120, 0, 11, false), class: 'mx-rx-head' }));
  if (mode === 'split') {
    const fl = s('g', { class: 'mx-flame' }, s('path', { d: 'M200,232 C186,214 194,200 200,186 C206,200 214,214 200,232 Z' }), s('path', { class: 'mx-flame-in', d: 'M200,232 C194,222 197,212 200,204 C203,212 206,222 200,232 Z' }));
    svg.appendChild(animated(fl, 'flicker'));
    svg.appendChild(caption(200, 252, 'qizdirish (t°)', 'mx-cap'));
  }
  const capTxt = mode === 'split' ? 'parchalanish' : mode === 'join' ? 'birikish' : "o'rin almashinish";
  svg.appendChild(caption(360, 90, capTxt, 'mx-cap mx-dim'));
  return svg;
}

// ---------------------------------------------------------------------------
// Panel

/**
 * Mexanizm panelini quradi.
 * @param {HTMLElement} container
 * @param {object} record — tajriba yozuvi (data/reactions/*.json)
 * @param {object} mechanisms — data/mechanisms.json
 * @param {{tab?: 'eq'|'balance'|'anim'|'steps', step?: number, autoplay?: boolean, reducedMotion?: boolean, title?: boolean}} [opts]
 * @returns {{el: HTMLElement, destroy: () => void, showStep?: (i:number)=>void}}
 */
export function renderMechanism(container, record, mechanisms, opts = {}) {
  const id = `mech${++uidCounter}`;
  const reduced = opts.reducedMotion ?? prefersReducedMotion();
  const cleanups = [];
  const type = record?.mechanism?.type || '';
  const resolved = resolveTemplate(mechanisms, record);
  const noReaction = !!record?.no_reaction;
  const info = noReaction
    ? { name: `${INORGANIC[type]?.name || type} · ${L.noReaction}`, text: L.noReactionText }
    : INORGANIC[type];

  const root = h('section', { class: 'mech', 'aria-label': L.title });
  if (opts.title !== false) {
    const head = h('header', { class: 'mech-head' },
      h('h3', { class: 'mech-title', text: L.title }),
      h('span', { class: 'mech-badge', text: resolved ? resolved.tpl.name_uz.replace(/_([A-Za-z]+)/g, '$1') : (info?.name || type) }));
    root.appendChild(head);
  }

  // --- tablar
  const tabs = [];
  const eq = record?.equation || {};
  const hasEq = !!(eq.molecular || eq.ionic_full || eq.ionic_net);
  const bal = balanceInfo(record);
  let scheme = null;
  if (!resolved && type !== 'organik' && !noReaction) { try { scheme = inorganicScheme(record); } catch (e) { scheme = null; console.warn('[mexanizm] sxema:', e); } }
  if (resolved || scheme || info?.text) tabs.push({ key: 'anim', label: resolved ? L.anim : L.scheme });
  tabs.push({ key: 'eq', label: L.equations });
  if (bal) tabs.push({ key: 'balance', label: L.electron });
  if (record?.mechanism?.steps_uz?.length) tabs.push({ key: 'steps', label: L.steps });

  let stage = null;
  const tablist = h('div', { class: 'mech-tabs', role: 'tablist' });
  const panels = {};
  const btns = {};
  let active = null;
  const select = (key, focus) => {
    if (!panels[key]) return;
    active = key;
    for (const t of tabs) {
      const on = t.key === key;
      btns[t.key].setAttribute('aria-selected', on ? 'true' : 'false');
      btns[t.key].tabIndex = on ? 0 : -1;
      panels[t.key].hidden = !on;
    }
    if (focus) btns[key].focus();
    if (key !== 'anim') stage?.pause?.();
  };
  tabs.forEach((t, i) => {
    const b = h('button', { class: 'mech-tab', role: 'tab', type: 'button', id: `${id}-t-${t.key}`, 'aria-controls': `${id}-p-${t.key}`, text: t.label });
    b.addEventListener('click', () => select(t.key));
    b.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const j = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        select(tabs[j].key, true);
      }
    });
    btns[t.key] = b;
    tablist.appendChild(b);
  });
  if (tabs.length > 1) root.appendChild(tablist);

  const mkPanel = (key) => {
    const p = h('div', { class: `mech-panel mech-panel-${key}`, role: 'tabpanel', id: `${id}-p-${key}`, 'aria-labelledby': `${id}-t-${key}` });
    panels[key] = p; root.appendChild(p); return p;
  };

  // --- tenglamalar
  {
    const p = mkPanel('eq');
    if (!hasEq) p.appendChild(h('p', { class: 'mech-empty', text: L.noEquation }));
    const row = (lbl, str) => {
      if (!str) return;
      p.appendChild(h('div', { class: 'mech-eq-row' },
        h('div', { class: 'mech-eq-label', text: lbl }),
        appendFormula(h('div', { class: 'mech-eq' }), str)));
    };
    row(L.molecular, eq.molecular);
    row(L.ionicFull, eq.ionic_full);
    if (eq.ionic_net && eq.ionic_net !== eq.ionic_full) row(L.ionicNet, eq.ionic_net);
    else if (eq.ionic_net && !eq.ionic_full) row(L.ionicNet, eq.ionic_net);
  }

  // --- elektron balans
  if (bal) {
    const p = mkPanel('balance');
    const ox = bal.lines.filter((l) => l.kind === 'ox');
    const red = bal.lines.filter((l) => l.kind === 'red');
    const sumOx = ox.reduce((a, l) => a + (l.n || 0), 0), sumRed = red.reduce((a, l) => a + (l.n || 0), 0);
    const lcm = sumOx && sumRed ? (sumOx * sumRed) / gcd(sumOx, sumRed) : 0;
    const tbl = h('table', { class: 'mech-balance' });
    const tb = h('tbody');
    const showMul = lcm && ox.length && red.length;
    if (showMul) tbl.appendChild(h('thead', null, h('tr', null, h('th', { text: '' }), h('th', { text: '' }), h('th', { class: 'num', text: 'e⁻' }), h('th', { class: 'num', text: '×' }))));
    for (const l of bal.lines) {
      const role = l.kind === 'ox' ? `${L.reductant} · ${L.oxidation}` : l.kind === 'red' ? `${L.oxidant} · ${L.reduction}` : '';
      const mul = showMul && l.kind ? lcm / (l.kind === 'ox' ? sumOx : sumRed) : '';
      tb.appendChild(h('tr', { class: l.kind ? `mech-${l.kind}` : '' },
        h('td', null, appendFormula(h('span', { class: 'mech-eq' }), l.text)),
        h('td', null, role ? h('span', { class: `mech-role mech-role-${l.kind}`, text: role }) : ''),
        h('td', { class: 'num', text: l.n != null ? String(l.n) : '' }),
        h('td', { class: 'num', text: mul ? String(mul) : '' })));
    }
    tbl.appendChild(tb);
    p.appendChild(tbl);
    if (bal.derived) p.appendChild(h('p', { class: 'mech-note', text: L.derived }));
  }

  // --- bosqichlar (yozuvdagi matn)
  if (record?.mechanism?.steps_uz?.length) {
    const p = mkPanel('steps');
    const ol = h('ol', { class: 'mech-steps' });
    for (const st of record.mechanism.steps_uz) ol.appendChild(appendFormulaInline(h('li'), st));
    p.appendChild(ol);
  }

  // --- animatsiya / sxema
  if (tabs.some((t) => t.key === 'anim')) {
    const p = mkPanel('anim');
    root.insertBefore(p, panels.eq);
    if (resolved) stage = buildOrganic(p, resolved, mechanisms, { reduced, id, startStep: opts.step || 0, autoplay: opts.autoplay, cleanups });
    else {
      if (info?.text) p.appendChild(h('p', { class: 'mech-desc', text: info.text }));
      if (scheme) {
        const wrap = h('div', { class: 'mech-stage mx-stage' });
        wrap.appendChild(scheme);
        p.appendChild(wrap);
        if (!reduced) {
          const btn = h('button', { class: 'mech-btn', type: 'button', 'aria-pressed': 'false', text: L.pause });
          btn.addEventListener('click', () => {
            const paused = scheme.classList.toggle('mx-paused');
            btn.textContent = paused ? L.play : L.pause;
            btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
          });
          p.appendChild(h('div', { class: 'mech-controls' }, btn));
          stage = { pause: () => { scheme.classList.add('mx-paused'); btn.textContent = L.play; } };
        }
      }
    }
  }
  if (type === 'organik' && !resolved) {
    const p = panels.eq;
    p.appendChild(h('p', { class: 'mech-note', text: L.noTemplate }));
  }

  container.appendChild(root);
  const first = opts.tab && panels[opts.tab] ? opts.tab : tabs[0]?.key;
  select(first);

  return {
    el: root,
    showStep: (i) => stage?.go?.(i, false),
    destroy() {
      stage?.destroy?.();
      for (const fn of cleanups) try { fn(); } catch { /* */ }
      root.remove();
    },
  };
}

/** steps_uz kabi matnlarda formulalar allaqachon Unicode'da — faqat ^ va raqamli zaryadlarni ko'rib chiqamiz */
function appendFormulaInline(el, str) {
  // matnni so'zlarga bo'lib, faqat formula ko'rinishidagi so'zlarni formatlaymiz
  const re = /([A-Z][A-Za-z0-9()[\]^⁺⁻⁰-⁹₀-₉+\-·]*[0-9^⁺⁻][A-Za-z0-9()[\]^⁺⁻⁰-⁹₀-₉+\-·]*)/g;
  let last = 0, m;
  const s0 = String(str);
  while ((m = re.exec(s0))) {
    if (m.index > last) el.appendChild(document.createTextNode(s0.slice(last, m.index)));
    let tok = m[1]; let tail = '';
    if (/[-+]$/.test(tok) && !/\^|\d[-+]$/.test(tok)) { tail = tok.slice(-1); tok = tok.slice(0, -1); }
    appendFormula(el, tok);
    if (tail) el.appendChild(document.createTextNode(tail));
    last = m.index + m[0].length;
  }
  if (last < s0.length) el.appendChild(document.createTextNode(s0.slice(last)));
  return el;
}

function buildOrganic(panel, resolved, mechanisms, ctx) {
  const { tpl, steps, tokens } = resolved;
  const vb = resolved.viewBox;
  if (tpl.summary_uz) panel.appendChild(h('p', { class: 'mech-desc', text: tpl.summary_uz }));
  const stageWrap = h('div', { class: 'mech-stage', tabindex: '0', 'aria-roledescription': 'animatsiya', 'aria-label': tpl.name_uz });
  const svg = s('svg', { viewBox: vb.join(' '), class: 'mech-svg', role: 'img', 'aria-label': tpl.name_uz });
  stageWrap.appendChild(svg);
  panel.appendChild(stageWrap);
  const stage = new OrganicStage(svg, resolved, ctx.reduced);

  const cap = h('div', { class: 'mech-caption', 'aria-live': 'polite' });
  const capTitle = h('h4', { class: 'mech-step-title' });
  const capText = h('p', { class: 'mech-step-text' });
  cap.appendChild(capTitle); cap.appendChild(capText);

  const prevB = h('button', { class: 'mech-btn', type: 'button', 'aria-label': L.prev, title: L.prev, text: '‹' });
  const playB = h('button', { class: 'mech-btn mech-play', type: 'button', text: L.play });
  const nextB = h('button', { class: 'mech-btn', type: 'button', 'aria-label': L.next, title: L.next, text: '›' });
  const dots = h('div', { class: 'mech-dots', role: 'group', 'aria-label': L.steps });
  const dotBtns = steps.map((st, i) => {
    const b = h('button', { class: 'mech-dot', type: 'button', 'aria-label': `${L.stepN.replace('{i}', i + 1)}: ${st.title_uz}`, title: st.title_uz });
    b.addEventListener('click', () => { pause(); go(i, true); });
    dots.appendChild(b);
    return b;
  });
  const counter = h('span', { class: 'mech-counter' });
  panel.appendChild(h('div', { class: 'mech-controls' }, prevB, playB, nextB, dots, counter));
  panel.appendChild(cap);

  // reaksiya moddalari
  const legendKeys = (tpl.legend || Object.keys(resolved.params)).filter((k) => resolved.params[k]);
  if (legendKeys.length) {
    const dl = h('dl', { class: 'mech-legend' });
    for (const k of legendKeys) {
      dl.appendChild(h('dt', { text: mechanisms.param_labels_uz?.[k] || k }));
      dl.appendChild(appendFormula(h('dd'), String(resolved.params[k])));
    }
    panel.appendChild(h('div', { class: 'mech-legend-wrap' }, h('div', { class: 'mech-legend-title', text: L.legend }), dl));
  }

  let idx = -1;
  let playing = false;
  let timer = 0;
  const go = (i, animate = true) => {
    i = Math.max(0, Math.min(steps.length - 1, i));
    const st = steps[i];
    const moveDur = stage.show(st, animate && idx !== -1 && Math.abs(i - idx) === 1);
    idx = i;
    capTitle.textContent = `${i + 1}. ${subText(st.title_uz || '', tokens)}`;
    capText.textContent = '';
    appendRich(capText, st.text_uz || '', tokens);
    counter.textContent = `${i + 1} / ${steps.length}`;
    dotBtns.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'step' : 'false'));
    prevB.disabled = i === 0;
    nextB.disabled = i === steps.length - 1;
    return (moveDur || 0) + (st.arrows?.length || 0) * 520 + 400;
  };
  const schedule = (ms) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!playing) return;
      if (idx >= steps.length - 1) { pause(); return; }
      const d = go(idx + 1, true);
      schedule(d + 2600);
    }, ms);
  };
  const play = () => {
    playing = true;
    playB.textContent = L.pause;
    playB.setAttribute('aria-pressed', 'true');
    if (idx >= steps.length - 1) { const d = go(0, false); schedule(d + 2200); }
    else schedule(400);
  };
  function pause() {
    playing = false;
    clearTimeout(timer);
    playB.textContent = idx >= steps.length - 1 ? L.replay : L.play;
    playB.setAttribute('aria-pressed', 'false');
  }
  playB.addEventListener('click', () => (playing ? pause() : play()));
  prevB.addEventListener('click', () => { pause(); go(idx - 1, true); });
  nextB.addEventListener('click', () => { pause(); go(idx + 1, true); });
  stageWrap.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); pause(); go(idx + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); pause(); go(idx - 1, true); }
    else if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); }
  });

  go(ctx.startStep || 0, false);
  pause();
  if (ctx.autoplay) play();

  return {
    go: (i, a) => { pause(); go(i, a); },
    pause,
    destroy() { clearTimeout(timer); stage.destroy(); },
  };
}
