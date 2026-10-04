// Eritma rangi: Ber–Lambert yaqinlashuvi. Har bir rangli zarracha (ion, molekula, indikator) uchun
// ma'lumotdagi rang `ref_M` konsentratsiyada beriladi; RGB kanallar bo'yicha yutilish qo'shiladi.

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}
export function rgbToHex(rgb) {
  return '#' + rgb.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0')).join('');
}

const IND_REF_M = 4e-5;

/** Indikatorning pH bo'yicha rangi (null — rangsiz) */
export function indicatorColor(ind, pH) {
  const st = ind.stops;
  if (pH <= st[0][0]) return st[0][1];
  for (let i = 1; i < st.length; i++) {
    if (pH <= st[i][0]) {
      const [p0, c0] = st[i - 1], [p1, c1] = st[i];
      const t = (pH - p0) / (p1 - p0);
      if (!c0 && !c1) return null;
      const a = c0 ? hexToRgb(c0) : [1, 1, 1], b = c1 ? hexToRgb(c1) : [1, 1, 1];
      return rgbToHex(a.map((x, k) => x + (b[k] - x) * t));
    }
  }
  return st[st.length - 1][1];
}

function absorb(A, hex, strength) {
  const rgb = hexToRgb(hex);
  for (let k = 0; k < 3; k++) A[k] += -Math.log(Math.max(rgb[k], 0.015)) * strength;
}

/**
 * @returns {{hex:string, rgb:number[], intensity:number, absorbers:string[]}}
 */
export function solutionColor(chem, v, pathScale = 1) {
  const db = chem.db;
  const L = chem.aqL(v);
  const A = [0, 0, 0];
  const absorbers = [];
  const pH = chem.waterMol(v) > 1e-6 ? chem.pH(v) : null;
  let starch = 0, iodine = 0;
  for (const [id, n] of chem.inPhase(v, 'aq')) {
    if (n <= 0) continue;
    const c = n / L;
    if (db.isIon(id)) {
      const col = db.ions[id].color;
      if (col) { absorb(A, col.hex, (c / col.ref_M) * pathScale); absorbers.push(id); }
      continue;
    }
    const s = db.sub(id);
    if (!s) continue;
    if (id === '(C6H10O5)n') starch += c;
    if (id === 'I2') iodine += c;
    if (s.indicator && pH !== null) {
      const ind = db.indicators.get(s.indicator);
      const col = ind && indicatorColor(ind, pH);
      if (col) { absorb(A, col, Math.min(c / IND_REF_M, 3) * pathScale); absorbers.push(id); }
      continue;
    }
    if (s.aq_color && !(id === 'I2' && starch > 0)) { absorb(A, s.aq_color.hex, (c / s.aq_color.ref_M) * pathScale); absorbers.push(id); }
  }
  if (starch > 1e-5 && iodine > 1e-7) {
    absorb(A, '#1a1a6a', Math.min(iodine / 0.0005, 4) * pathScale);
    absorbers.push('kraxmal-yod');
  }
  const T = A.map((a) => Math.exp(-a));
  const intensity = 1 - (T[0] + T[1] + T[2]) / 3;
  return { hex: rgbToHex(T), rgb: T, intensity, absorbers };
}

/** Organik qatlam rangi (yod — binafsha, brom — to'q sariq) */
export function orgColor(chem, v) {
  const vol = chem.volumeOf(v, 'org') / 1000;
  if (vol <= 1e-7) return null;
  const A = [0, 0, 0];
  for (const [id, n] of chem.inPhase(v, 'org')) {
    const c = n / vol;
    if (id === 'I2') absorb(A, '#9a3ab0', c / 0.003);
    else if (id === 'Br2') absorb(A, '#e06a1a', c / 0.02);
    else {
      const s = chem.db.sub(id);
      if (s?.appearance?.color && s.state === 'l') absorb(A, s.appearance.color, 0.6);
    }
  }
  const T = A.map((a) => Math.exp(-a));
  return { hex: rgbToHex(T), rgb: T, intensity: 1 - (T[0] + T[1] + T[2]) / 3 };
}
