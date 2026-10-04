// pH hisoblash: zaryad balansi tenglamasini bisektsiya bilan yechish.
// Kuchli ionlar (tizimga kirmaydigan) zaryadi + H+ - OH- + kuchsiz tizimlar shakllarining zaryadi = 0.
// Kuchsiz tizimlar (CH3COOH/CH3COO-, NH4+/NH3, H3PO4 ...) va akva-ionlar gidrolizi (pKa_h) hisobga olinadi.

const KW = 1e-14;

/**
 * @param {import('./chemistry.js').Chemistry} chem
 * @param {any} v idish
 */
export function computePH(chem, v) {
  const db = chem.db;
  const L = chem.aqL(v);
  let strong = 0;
  const sysTotals = new Map();
  const hydrolysis = [];
  for (const [id, n] of chem.inPhase(v, 'aq')) {
    if (n <= 0) continue;
    const c = n / L;
    const e = db.formToSystem.get(id);
    if (e) {
      sysTotals.set(e.sys, (sysTotals.get(e.sys) || 0) + c);
      continue;
    }
    if (!db.isIon(id) || id === 'H^+' || id === 'OH^-') continue;
    const ion = db.ions[id];
    if (ion.charge > 0 && ion.pKa_h !== null && ion.pKa_h !== undefined && ion.pKa_h < 12.5) {
      hydrolysis.push({ z: ion.charge, pKa: ion.pKa_h, c });
    } else strong += ion.charge * c;
  }
  const systems = [];
  for (const [sys, C] of sysTotals) {
    const charges = sys.forms.map((f) => (db.isIon(f) ? db.ions[f].charge : 0));
    systems.push({ Ka: sys.pKa.map((p) => Math.pow(10, -p)), charges, C });
  }

  const balance = (pH) => {
    const h = Math.pow(10, -pH);
    let q = strong + h - KW / h;
    for (const s of systems) {
      // alfa ulushlari: shakl i (i ta proton ajralgan)
      const N = s.Ka.length;
      const terms = new Array(N + 1);
      let prod = 1;
      for (let i = 0; i <= N; i++) {
        if (i > 0) prod *= s.Ka[i - 1];
        terms[i] = prod * Math.pow(h, N - i);
      }
      const sum = terms.reduce((a, b) => a + b, 0);
      for (let i = 0; i <= N; i++) q += s.charges[i] * (terms[i] / sum) * s.C;
    }
    for (const x of hydrolysis) {
      const Ka = Math.pow(10, -x.pKa);
      const a0 = h / (h + Ka);
      q += (x.z * a0 + (x.z - 1) * (1 - a0)) * x.c;
    }
    return q;
  };

  let lo = -1.5, hi = 15.5;
  let flo = balance(lo), fhi = balance(hi);
  if (flo < 0) return lo;
  if (fhi > 0) return hi;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const f = balance(mid);
    if (f > 0) lo = mid; else hi = mid;
    if (hi - lo < 1e-4) break;
  }
  return Math.round(((lo + hi) / 2) * 100) / 100;
}
