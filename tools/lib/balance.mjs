// Tenglama koeffitsiyentlarini topish (butun sonli nol fazo) va tenglama matnini yasash.
// Faqat asboblar (tools/) uchun; brauzerda ishlatilmaydi.
import { parseFormula, prettyFormula, normalizeFormula, splitCharge } from '../../frontend/lab/js/engine/formula.js';

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
function lcm(a, b) { return (a / gcd(a, b)) * b; }

// Ratsional sonlar [num, den]
const R = {
  n: (a, b = 1) => { const g = gcd(a, b) || 1; const s = b < 0 ? -1 : 1; return [s * a / g, s * b / g]; },
  sub: (x, y) => R.n(x[0] * y[1] - y[0] * x[1], x[1] * y[1]),
  mul: (x, y) => R.n(x[0] * y[0], x[1] * y[1]),
  div: (x, y) => R.n(x[0] * y[1], x[1] * y[0]),
  zero: (x) => x[0] === 0,
};

/**
 * Chap va o'ng tomon formulalari bo'yicha eng kichik butun koeffitsiyentlarni topadi.
 * @param {string[]} left
 * @param {string[]} right
 * @returns {number[]|null} koeffitsiyentlar (chap + o'ng tartibida) yoki yagona yechim bo'lmasa null
 */
export function balance(left, right) {
  const species = [...left, ...right];
  const parsed = species.map((f) => parseFormula(f, 1));
  const els = [...new Set(parsed.flatMap((p) => Object.keys(p.atoms)))];
  const rows = els.map((el) => species.map((_, j) => (j < left.length ? 1 : -1) * (parsed[j].atoms[el] || 0)));
  rows.push(species.map((_, j) => (j < left.length ? 1 : -1) * parsed[j].charge));
  const m = rows.map((r) => r.map((x) => R.n(x)));
  const nCols = species.length;
  // Gauss
  let r = 0;
  const pivots = [];
  for (let c = 0; c < nCols && r < m.length; c++) {
    let p = -1;
    for (let i = r; i < m.length; i++) if (!R.zero(m[i][c])) { p = i; break; }
    if (p < 0) continue;
    [m[r], m[p]] = [m[p], m[r]];
    const pv = m[r][c];
    m[r] = m[r].map((x) => R.div(x, pv));
    for (let i = 0; i < m.length; i++) {
      if (i === r || R.zero(m[i][c])) continue;
      const f = m[i][c];
      m[i] = m[i].map((x, k) => R.sub(x, R.mul(f, m[r][k])));
    }
    pivots.push(c);
    r++;
  }
  const free = [...Array(nCols).keys()].filter((c) => !pivots.includes(c));
  if (free.length !== 1) return null;
  const fc = free[0];
  const sol = new Array(nCols).fill(null);
  sol[fc] = R.n(1);
  pivots.forEach((c, i) => { sol[c] = R.n(-m[i][fc][0], m[i][fc][1]); });
  const L = sol.reduce((a, x) => lcm(a, x[1]), 1);
  let ints = sol.map((x) => (x[0] * L) / x[1]);
  if (ints.some((x) => x < 0)) ints = ints.map((x) => -x);
  if (ints.some((x) => x <= 0)) return null;
  const g = ints.reduce((a, x) => gcd(a, x));
  return ints.map((x) => x / g);
}

/** ASCII zaryadli formulani tenglama matni uchun: "SO4^2-" -> "SO4²⁻" (indekslar ASCII qoladi) */
export function eqText(f) {
  const norm = normalizeFormula(f);
  const { body, charge } = splitCharge(norm);
  if (!charge) return body;
  const sup = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const n = Math.abs(charge);
  return body + (n > 1 ? String(n).split('').map((d) => sup[d]).join('') : '') + (charge > 0 ? '⁺' : '⁻');
}

/**
 * Tenglama matnini yasaydi.
 * @param {{f:string, k:number, mark?:string, annot?:string}[]} left
 * @param {{f:string, k:number, mark?:string, annot?:string}[]} right
 */
export function formatEq(left, right, arrow = '=') {
  const side = (arr) => arr.map((t) => `${t.k === 1 ? '' : t.k}${eqText(t.f)}${t.annot ? `(${t.annot})` : ''}${t.mark || ''}`).join(' + ');
  return `${side(left)} ${arrow} ${side(right)}`;
}

export { prettyFormula };
