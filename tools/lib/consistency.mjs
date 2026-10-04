// Muvofiqlik testi: har bir tajriba yozuvi dvigatel orqali bajariladi va natija yozuv bilan solishtiriladi.
// Brauzersiz (Node) ishlaydi. tests/data/consistency.test.mjs va tools/validate_data.mjs ishlatadi.

const BASE_MOL = 0.0005;

/**
 * Tajribani dvigatelda bajarish uchun idish tayyorlash.
 * @returns {{v:any, env:any}}
 */
export function setupExperiment(chem, r, opts = {}) {
  const db = chem.db;
  const base = opts.base ?? BASE_MOL;
  const v = chem.createVessel({ capacity_mL: 2000, glass_g: 20, kind: 'test' });
  let mol = null;
  try { mol = r.equation?.molecular ? db.parseEq(r.equation.molecular) : null; } catch { mol = null; }
  const coefOf = (id) => {
    const t = mol?.left.find((x) => x.id === id);
    return t ? Math.abs(t.coef) : null;
  };
  const env = {};
  const c = r.conditions || {};
  // katalizator
  for (const cat of [].concat(c.catalyst || [])) {
    const id = db.keyOf(cat);
    const s = db.sub(id);
    if (!s) continue;
    if (id === 'H2SO4') chem.addSubstance(v, id, { conc_M: 18, volume_mL: 0.2 });
    else if (s.state === 's' || s.metal) chem.addSubstance(v, id, { mol: base * 0.2, form: 'kukun' });
    else if (s.state === 'g') chem.addSubstance(v, id, { as: 'gas', mol: base * 0.2 });
    else chem.addSubstance(v, id, { conc_M: s.solutions?.[0]?.conc_M ?? 1, volume_mL: 0.2 });
  }
  const gases = [];
  for (const re of r.reactants || []) {
    const id = db.substances[re.species] ? re.species : db.keyOf(re.species);
    const s = db.sub(id);
    if (!s) continue;
    let k = coefOf(id);
    let n;
    if (k === null && s.mixture) {
      // aralashma: tenglamadagi komponent bo'yicha
      const comp = Object.entries(s.mixture).find(([cid]) => coefOf(cid) !== null);
      if (comp) {
        const [cid, cc] = comp;
        const need = coefOf(cid) * base;
        chem.addSubstance(v, id, { as: 'solution', volume_mL: Math.max((need / cc) * 1000, 0.5) });
        continue;
      }
    }
    if (k === null) k = re.excess ? 4 : 1;
    if (re.excess) k *= 1.5;
    n = k * base;
    if (re.state === 'aq') {
      if (s.mixture || s.mixture_opaque || s.formula_null) { chem.addSubstance(v, id, { as: 'solution', volume_mL: re.volume_mL ?? 2 }); continue; }
      const conc = re.conc_M ?? s.solutions?.[0]?.conc_M ?? 0.5;
      const vol = (n / conc) * 1000;
      chem.addSubstance(v, id, { conc_M: conc, volume_mL: vol, as: 'solution' });
    } else if (re.state === 's') {
      chem.addSubstance(v, id, { mol: n, form: re.form || (s.metal ? 'kukun' : undefined), as: 'solid' });
    } else if (re.state === 'l') {
      if (id === 'H2O') chem.addSubstance(v, id, { volume_mL: Math.max((n * 18) / 1, 3), as: 'liquid' });
      else chem.addSubstance(v, id, { volume_mL: (n * s.M) / (s.density || 1), as: 'liquid' });
    } else if (re.state === 'g') {
      gases.push([id, n]);
    }
  }
  for (const [id, n] of gases) chem.bubbleGas(v, id, n);
  if (c.light) v.illuminated = true;
  const tmin = c.temp_min_C ?? (c.heating ? 60 : null);
  if (tmin !== null && tmin !== undefined) env.heater = { power_W: 60, maxT: Math.max(tmin + (tmin > 150 ? 120 : 30), 110) };
  if (c.temp_max_C !== undefined && c.temp_max_C !== null && !env.heater) env.heater = null;
  if (c.ignition) { v.ignited = true; if (!env.heater) env.heater = { power_W: 60, maxT: (c.ignition_C ?? 400) + 100 }; }
  if (c.electricity) env.electrolysis = { current_A: 1, anode: c.anode || 'C', cathode: c.cathode || 'C', speed: 400 };
  return { v, env, mol };
}

/**
 * Tajribani bajarish va natijani tekshirish.
 * @returns {{ok:boolean, problems:string[], fired:string[], ppt:Object, gas:Object}}
 */
export function checkReaction(chem, r, opts = {}) {
  const db = chem.db;
  const base = opts.base ?? BASE_MOL;
  const problems = [];
  let setup;
  try { setup = setupExperiment(chem, r, opts); } catch (e) { return { ok: false, problems: [`tayyorlashda xato: ${e.message}`], fired: [], ppt: {}, gas: {} }; }
  const { v, env, mol } = setup;
  const ppt = {}, gas = {}, fired = new Set(), deposits = {};
  const noReactionEvents = [];
  let quiet = 0;
  const dt = 0.25;
  const maxT = opts.seconds ?? 900;
  for (let t = 0; t < maxT; t += dt) {
    const ev = chem.step(v, dt, env);
    let active = false;
    for (const e of ev) {
      if (e.type === 'precipitate') { ppt[e.species] = (ppt[e.species] || 0) + e.mol; active = true; }
      if (e.type === 'gas') { gas[e.species] = (gas[e.species] || 0) + e.mol; active = true; }
      if (e.type === 'record') { fired.add(e.record); active = true; }
      if (e.type === 'deposit') { deposits[e.species] = (deposits[e.species] || 0) + e.mol; active = true; }
      if (['metal-acid', 'metal-water', 'displacement', 'acid-dissolve', 'complex', 'rule', 'dissolve'].includes(e.type)) active = true;
      if (e.type === 'no-reaction') noReactionEvents.push(e);
    }
    quiet = active ? 0 : quiet + dt;
    if (quiet > 20 && t > 30) break;
  }
  const present = (id) => {
    let n = 0;
    for (const ph of ['aq', 's', 'org', 'g']) n += chem.get(v, id, ph);
    return n;
  };

  if (r.no_reaction) {
    if (Object.keys(ppt).length || Object.keys(gas).filter((g) => g !== 'H2O').length) problems.push(`reaksiya ketmasligi kerak edi, lekin cho'kma/gaz hosil bo'ldi: ${JSON.stringify({ ppt, gas })}`);
    if (r.engine === 'record' && !noReactionEvents.some((e) => e.record === r.id) && !opts.allowSilent) problems.push("dvigatel 'reaksiya ketmaydi' tushuntirishini bermadi");
    return { ok: problems.length === 0, problems, fired: [...fired], ppt, gas };
  }

  if (r.engine === 'record') {
    if (!fired.has(r.id)) {
      const pending = v._pending?.find((p) => p.id === r.id);
      problems.push(`yozuv ishga tushmadi${fired.size ? ` (o'rniga: ${[...fired].join(', ')})` : ''}${pending ? ` — bajarilmagan shartlar: ${JSON.stringify(pending.unmet)}` : ''}`);
    }
  }
  if (mol) {
    for (const t of mol.right) {
      if (!t.id || t.id === 'H2O') continue;
      const s = db.sub(t.id);
      const expected = t.coef * base;
      const isGas = t.mark === '↑' || (s?.state === 'g' && t.mark !== '↓');
      const isPpt = t.mark === '↓';
      if (isGas) {
        const got = (gas[t.id] || 0) + present(t.id);
        if (got < expected * 0.3) problems.push(`gaz ${t.id} kutilgan ${expected.toExponential(2)}, olingan ${got.toExponential(2)}`);
      } else if (isPpt) {
        const got = Math.max(chem.get(v, t.id, 's'), ppt[t.id] || 0, deposits[t.id] || 0);
        if (got < expected * 0.3) problems.push(`cho'kma ${t.id} kutilgan ${expected.toExponential(2)}, olingan ${got.toExponential(2)}`);
      } else if (s?.dissociation && !s.metal) {
        // eriydigan tuz: ionlari eritmada (yoki kristall holida) bo'lishi kerak
        let ok = present(t.id) > expected * 0.3;
        if (!ok) {
          ok = Object.entries(s.dissociation).every(([ion, k]) => {
            if (ion === 'H2O') return true;
            let n = chem.get(v, ion, 'aq');
            const se = db.formToSystem.get(ion);
            if (se) n = se.sys.forms.reduce((a, f) => a + chem.get(v, f, 'aq'), 0);
            return n >= expected * k * 0.3;
          });
        }
        if (!ok) problems.push(`mahsulot ${t.id} (ionlari) eritmada topilmadi`);
      } else {
        let got = present(t.id) + (deposits[t.id] || 0);
        const se = db.formToSystem.get(t.id);
        if (se) got = Math.max(got, se.sys.forms.reduce((a, f) => a + chem.get(v, f, 'aq'), 0));
        if (got < expected * 0.3) problems.push(`mahsulot ${t.id} kutilgan ${expected.toExponential(2)}, olingan ${got.toExponential(2)}`);
      }
    }
  }
  const obs = r.observations || {};
  if (obs.precipitate) {
    const pid = db.keyOf(obs.precipitate.species);
    if (!(ppt[pid] > 0) && !(chem.get(v, pid, 's') > 0)) problems.push(`kuzatuvdagi cho'kma ${pid} dvigatelda hosil bo'lmadi`);
  }
  if (obs.gas) {
    const gid = db.keyOf(obs.gas.species);
    if (!(gas[gid] > 0) && !(present(gid) > 0)) problems.push(`kuzatuvdagi gaz ${gid} dvigatelda ajralmadi`);
  }
  return { ok: problems.length === 0, problems, fired: [...fired], ppt, gas, vessel: v };
}
