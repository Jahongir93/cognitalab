// Kimyoviy dvigatel: idish holati va uni vaqt bo'yicha yangilash.
// Sof JavaScript, DOM va Three.js'siz. Node'da ham, brauzerda ham ishlaydi.
//
// Idish tarkibi: Map "<id>@<faza>" -> mol.  Fazalar: aq (asosiy suyuq faza / eritma), org (aralashmaydigan
// organik qatlam), s (qattiq / cho'kma), g (idishdagi gaz).
import { computePH, alphas } from './ph.js';
import { solutionColor, orgColor } from './color.js';

export const KINETICS_TAU = { 'bir-zumda': 0.25, tez: 2, "o'rtacha": 8, sekin: 30, 'juda-sekin': 120 };
export const HEAT_CLASS_KJ = { 'kuchli-ekzotermik': -300, ekzotermik: -100, sezilarsiz: 0, endotermik: 40, 'kuchli-endotermik': 120 };
const SURFACE = { kukun: 4, qirindi: 2, granula: 1, lenta: 1.5, "bo'lak": 0.6, plastinka: 0.6, mix: 0.5, sim: 0.7, kristall: 1, tola: 1.5, plyonka: 1 };
const WATER = 'H2O';
const R = 8.314;
const EPS = 1e-12;
const ION_DENSITY = 1.8;

let VESSEL_SEQ = 1;

/**
 * @typedef {Object} Vessel
 * @property {string} id
 * @property {string} kind
 * @property {number} capacity_mL
 * @property {number} glass_g
 * @property {number} T  harorat, °C
 * @property {Map<string, number>} contents
 * @property {Object<string,string>} forms  qattiq modda shakli (kukun, bo'lak ...)
 * @property {boolean} closed
 * @property {boolean} illuminated
 * @property {boolean} stirring
 * @property {number} pressure_atm
 * @property {string[]} history
 */

export class Chemistry {
  /** @param {import('./db.js').ChemDB} db */
  constructor(db, opts = {}) {
    this.db = db;
    this.ambientC = opts.ambientC ?? 20;
    this.timeScale = opts.timeScale ?? 1;
  }

  // ------------------------------------------------------------------ idish
  /** @returns {Vessel} */
  createVessel(opts = {}) {
    return {
      id: opts.id || `v${VESSEL_SEQ++}`,
      kind: opts.kind || 'probirka',
      capacity_mL: opts.capacity_mL ?? 20,
      glass_g: opts.glass_g ?? 10,
      heatable: opts.heatable ?? true,
      T: opts.T ?? this.ambientC,
      contents: new Map(),
      forms: {},
      closed: false,
      illuminated: false,
      stirring: false,
      pressure_atm: 1,
      history: [],
      firedRecords: {},
      lastPH: 7,
    };
  }

  key(id, phase) { return `${id}@${phase}`; }
  get(v, id, phase) { return v.contents.get(`${id}@${phase}`) || 0; }
  add(v, id, phase, mol) {
    const k = `${id}@${phase}`;
    const n = (v.contents.get(k) || 0) + mol;
    if (n <= EPS) v.contents.delete(k);
    else v.contents.set(k, n);
  }
  /** Fazadagi barcha zarrachalar */
  inPhase(v, phase) {
    const out = [];
    for (const [k, n] of v.contents) {
      const at = k.lastIndexOf('@');
      if (k.slice(at + 1) === phase) out.push([k.slice(0, at), n]);
    }
    return out;
  }
  has(v, id, phase) { return this.get(v, id, phase) > EPS; }

  clone(v) {
    return { ...v, contents: new Map(v.contents), forms: { ...v.forms }, history: [...v.history], firedRecords: { ...v.firedRecords } };
  }

  // ------------------------------------------------------------------ hajm va massa
  densityOf(id) {
    if (id === WATER) return 0.998;
    if (this.db.isIon(id)) return ION_DENSITY;
    const s = this.db.sub(id);
    if (!s) return 1;
    if (s.density) return s.density;
    if (s.state === 'l') return 1.0;
    return ION_DENSITY;
  }

  massOf(v, phase) {
    let m = 0;
    for (const [id, n] of this.inPhase(v, phase)) m += n * (this.db.molarMass(id) || 0);
    return m;
  }

  /** Faza hajmi, mL */
  volumeOf(v, phase = 'aq') {
    let vol = 0;
    for (const [id, n] of this.inPhase(v, phase)) {
      const M = this.db.molarMass(id) || 0;
      vol += (n * M) / this.densityOf(id);
    }
    return vol;
  }
  liquidVolume(v) { return this.volumeOf(v, 'aq') + this.volumeOf(v, 'org'); }
  solidVolume(v) { return this.volumeOf(v, 's'); }
  /** Eritma hajmi, L (konsentratsiya hisoblash uchun) */
  aqL(v) { return Math.max(this.volumeOf(v, 'aq') / 1000, 1e-6); }
  waterMol(v) { return this.get(v, WATER, 'aq'); }

  /** Moddaning eritmadagi konsentratsiyasi (M). Elektrolit bo'lsa ionlari bo'yicha. */
  concOf(v, id) {
    const s = this.db.sub(id);
    const L = this.aqL(v);
    if (!s) return this.get(v, id, 'aq') / L;
    const sysEntry = this.db.formToSystem.get(id);
    if (s.dissociation) {
      // kuchli kislota: anion bo'yicha; tuz: ionlarning eng kami bo'yicha
      let min = Infinity;
      for (const [ion, k] of Object.entries(s.dissociation)) {
        if (ion === 'H^+' || ion === WATER) continue;
        let n = this.get(v, ion, 'aq');
        const se = this.db.formToSystem.get(ion);
        if (se) n = se.sys.forms.reduce((a, f) => a + this.get(v, f, 'aq'), 0);
        min = Math.min(min, n / k);
      }
      if (id === 'H2SO4') {
        const sys = this.db.systems.get('sulfat');
        min = sys.forms.reduce((a, f) => a + this.get(v, f, 'aq'), 0);
      }
      return min === Infinity ? 0 : min / L;
    }
    if (sysEntry) return sysEntry.sys.forms.reduce((a, f) => a + this.get(v, f, 'aq'), 0) / L;
    if (s.dissolve_molecular) {
      const [first] = Object.keys(s.dissolve_molecular);
      return this.get(v, first, 'aq') / L;
    }
    return (this.get(v, id, 'aq') + this.get(v, id, 'org')) / L;
  }

  // ------------------------------------------------------------------ qo'shish
  /**
   * Idishga modda qo'shadi.
   * @param {Vessel} v
   * @param {string} id modda id
   * @param {{conc_M?:number, volume_mL?:number, mass_g?:number, mol?:number, form?:string, as?:'solution'|'solid'|'liquid'|'gas', T?:number}} o
   * @returns {object[]} hodisalar
   */
  addSubstance(v, id, o = {}) {
    const db = this.db;
    const s = db.sub(id);
    if (!s) throw new Error(`Modda topilmadi: ${id}`);
    const ev = [];
    const T0 = o.T ?? this.ambientC;
    const heatBefore = this.heatCapacity(v);
    const as = o.as || (o.conc_M ? 'solution' : (s.state === 'g' ? 'gas' : (s.state === 'l' || s.state === 'aq') ? 'liquid' : 'solid'));
    const hadWater = this.waterMol(v) > 1e-6;
    const concAcidBefore = this.isConcentratedAcid(v);

    if (as === 'solution' || (as === 'liquid' && (s.state === 'aq' || s.mixture || s.mixture_opaque))) {
      const V = o.volume_mL ?? 1;
      const c = o.conc_M ?? (s.solutions?.[0]?.conc_M ?? 0.1);
      if (s.mixture || s.mixture_opaque) {
        // aralashma: komponentlar mol/L
        const comps = s.mixture || {};
        let soluteVol = 0;
        for (const [cid, cc] of Object.entries(comps)) {
          const n = cc * V / 1000;
          const ph = s.mixture_phase?.[cid] || 'aq';
          this.add(v, cid, ph, n);
          soluteVol += (n * (db.molarMass(cid) || 0)) / this.densityOf(cid);
        }
        if (s.mixture_opaque || !s.formula) this.add(v, id, 'aq', 1e-5 * V / 1000 * 1000); // indikator / kolloid belgisi
        const waterV = Math.max(V - soluteVol, 0);
        this.add(v, WATER, 'aq', (waterV * 0.998) / 18.015);
      } else {
        const n = (c * V) / 1000;
        const soluteVol = (n * s.M) / (s.state === 'l' && s.density ? s.density : ION_DENSITY);
        const waterV = Math.max(V - soluteVol, 0);
        this.add(v, WATER, 'aq', (waterV * 0.998) / 18.015);
        this.#dissolveInto(v, id, n);
        if (s.heat_of_dilution && c >= (s.conc_threshold_M || 10) && hadWater) {
          // konsentrlangan kislota suvga quyilmoqda — issiqlik ajraladi (to'g'ri tartib)
          this.addHeat(v, (HEAT_CLASS_KJ[s.heat_of_dilution] || -100) * 1000 * n * 0.15);
        }
      }
      this.#mixTemperature(v, heatBefore, T0, V * 4.0);
      if (concAcidBefore && !(c >= (s.conc_threshold_M || 999))) {
        ev.push({ type: 'splash', severity: 'xavfli', code: 'suv-kislotaga' });
        ev.push({ type: 'warning', code: 'suv-kislotaga' });
        this.addHeat(v, -60000 * Math.min(concAcidBefore, V / 1000 * 55));
      }
    } else if (as === 'liquid') {
      // toza suyuqlik (organik, brom, suv ...)
      const V = o.volume_mL ?? 1;
      const d = s.density || 1;
      const n = (V * d) / s.M;
      if (id === WATER) this.add(v, WATER, 'aq', n);
      else if (s.miscible_water === false) this.add(v, id, 'org', n);
      else this.#dissolveInto(v, id, n, true);
      this.#mixTemperature(v, heatBefore, T0, V * d * 2.2);
      if (id === WATER && concAcidBefore) {
        ev.push({ type: 'splash', severity: 'xavfli', code: 'suv-kislotaga' });
        ev.push({ type: 'warning', code: 'suv-kislotaga' });
        this.addHeat(v, -60000 * Math.min(concAcidBefore, n));
      }
    } else if (as === 'gas') {
      const n = o.mol ?? ((o.volume_mL ?? 10) / 24000);
      this.add(v, id, 'g', n);
    } else {
      // qattiq modda
      let n = o.mol;
      if (n === undefined) n = (o.mass_g ?? 0.5) / s.M;
      if (s.formula_null) n = (o.mass_g ?? 0.5) / 100;
      this.add(v, id, 's', n);
      if (o.form) v.forms[id] = o.form;
      else if (!v.forms[id]) v.forms[id] = s.forms?.[0] || s.appearance?.form || 'kukun';
      this.#mixTemperature(v, heatBefore, T0, (o.mass_g ?? 0.5) * 0.8);
      if (s.heat_of_dilution && hadWater) ev.push({ type: 'info', code: 'erish-issiqligi' });
    }
    v.history.push(id);
    return ev;
  }

  /** Erigan moddani ionlarga yoki molekulalarga ajratib qo'shadi */
  #dissolveInto(v, id, n, liquid = false) {
    const s = this.db.sub(id);
    if (s.dissociation) {
      for (const [ion, k] of Object.entries(s.dissociation)) this.add(v, ion, 'aq', n * k);
    } else if (s.dissolve_molecular) {
      for (const [sp, k] of Object.entries(s.dissolve_molecular)) this.add(v, sp, 'aq', n * k);
    } else if (s.state === 'g' && s.gas) {
      this.#gasToAq(v, id, n);
    } else if (!liquid && (s.solubility === 'N') && s.state === 's') {
      this.add(v, id, 's', n);
    } else {
      this.add(v, id, 'aq', n);
    }
  }

  /** Suvda eriydigan gazni eritmadagi shaklga o'tkazadi */
  #gasToAq(v, id, n) {
    if (id === 'CO2') { this.add(v, 'H2CO3', 'aq', n); this.add(v, WATER, 'aq', -n); return; }
    if (id === 'SO2') { this.add(v, 'H2SO3', 'aq', n); this.add(v, WATER, 'aq', -n); return; }
    if (id === 'HCl') { this.add(v, 'H^+', 'aq', n); this.add(v, 'Cl^-', 'aq', n); return; }
    if (id === 'HBr') { this.add(v, 'H^+', 'aq', n); this.add(v, 'Br^-', 'aq', n); return; }
    if (id === 'NO2' && this.waterMol(v) > 1e-6 && this.get(v, 'OH^-', 'aq') > EPS) {
      // ishqorda: 2NO2 + 2OH- = NO2- + NO3- + H2O
      const k = Math.min(n, this.get(v, 'OH^-', 'aq'));
      this.add(v, 'OH^-', 'aq', -k); this.add(v, 'NO2^-', 'aq', k / 2); this.add(v, 'NO3^-', 'aq', k / 2); this.add(v, WATER, 'aq', k / 2);
      if (n - k > EPS) this.#gasToAq(v, id, n - k);
      return;
    }
    if (id === 'NO2' && this.waterMol(v) > 1e-6) {
      // suv orqali o'tkazilgan NO2: 3NO2 + H2O = 2HNO3 + NO
      this.add(v, 'H^+', 'aq', (2 * n) / 3); this.add(v, 'NO3^-', 'aq', (2 * n) / 3);
      this.add(v, WATER, 'aq', -n / 3); this.add(v, 'NO', 'g', n / 3);
      return;
    }
    this.add(v, id, 'aq', n);
  }

  /** Gazni idishdagi suyuqlik orqali o'tkazish (pufakcha bilan). Yutilmagani qaytadi. */
  bubbleGas(v, id, mol) {
    if (this.waterMol(v) < 1e-6 && this.volumeOf(v, 'org') < 1e-6) { this.add(v, id, 'g', mol); return; }
    this.#gasToAq(v, id, mol);
  }

  isConcentratedAcid(v) {
    // kons. H2SO4: suvga nisbatan sulfat ko'p (mol nisbati)
    const sys = this.db.systems.get('sulfat');
    const nS = sys.forms.reduce((a, f) => a + this.get(v, f, 'aq'), 0);
    const w = this.waterMol(v);
    if (nS > 1e-6 && nS / Math.max(w, 1e-9) > 0.35) return nS;
    return 0;
  }

  // ------------------------------------------------------------------ issiqlik
  heatCapacity(v) {
    let C = v.glass_g * 0.84;
    C += this.waterMol(v) * 75.3;
    for (const ph of ['aq', 'org', 's']) {
      for (const [id, n] of this.inPhase(v, ph)) {
        if (id === WATER && ph === 'aq') continue;
        const M = this.db.molarMass(id) || 50;
        C += n * M * (ph === 'org' ? 2.0 : (ph === 's' ? 0.8 : 1.5));
      }
    }
    return Math.max(C, 1);
  }
  /** Q joul (manfiy — issiqlik ajraladi, idish isiydi) */
  addHeat(v, dH_J) {
    v.T += -dH_J / this.heatCapacity(v);
  }
  #mixTemperature(v, Cbefore, Tin, Cin) {
    const Cafter = this.heatCapacity(v);
    if (Cafter <= 0) return;
    v.T = (Cbefore * v.T + Math.max(Cafter - Cbefore, Cin * 0) * Tin) / Math.max(Cbefore + Math.max(Cafter - Cbefore, 0), 1e-9);
  }

  // ------------------------------------------------------------------ qadam
  /**
   * Idish holatini dt soniyaga yangilaydi.
   * @param {Vessel} v
   * @param {number} dt soniya
   * @param {{heater?:{power_W:number,maxT:number}, inFumeHood?:boolean}} env
   */
  step(v, dt, env = {}) {
    const ev = [];
    dt *= this.timeScale;
    v._dt = dt;
    this.#dissolveSolids(v, dt, ev);
    this.#oxideWater(v, dt, ev);
    this.equilibrate(v, ev);
    this.#records(v, dt, ev, env);
    this.#metals(v, dt, ev);
    this.equilibrate(v, ev);
    this.#acidDissolution(v, dt, ev);
    this.#volatilize(v, dt, ev);
    this.#partition(v);
    this.#thermal(v, dt, env, ev);
    if (env.electrolysis) this.electrolysisStep(v, dt, env.electrolysis, ev);
    v.lastPH = this.pH(v);
    return ev;
  }

  /** Bir zumda ketadigan jarayonlar: protonlar, cho'kma, maxsus juftlar, komplekslar */
  equilibrate(v, ev = []) {
    for (let iter = 0; iter < 30; iter++) {
      let changed = false;
      changed = this.#resolveProtons(v, ev) || changed;
      changed = this.#specialPairs(v, ev) || changed;
      changed = this.#precipitate(v, ev) || changed;
      changed = this.#weakBaseHydroxides(v, ev) || changed;
      changed = this.#complexes(v, ev) || changed;
      changed = this.#insolubleMolecular(v, ev) || changed;
      if (!changed) break;
    }
    return ev;
  }

  // ---------------------------------------------------- kislota-asos (protonlar ko'chishi)
  #acidBaseCandidates(v) {
    const acids = [], bases = [];
    const h = this.get(v, 'H^+', 'aq');
    if (h > EPS) acids.push({ id: 'H^+', pKa: -2, n: h });
    const oh = this.get(v, 'OH^-', 'aq');
    if (oh > EPS) bases.push({ id: 'OH^-', pKa: 15.7, n: oh });
    for (const [id, n] of this.inPhase(v, 'aq')) {
      const e = this.db.formToSystem.get(id);
      if (!e || n <= EPS) continue;
      const { sys, index } = e;
      if (index < sys.forms.length - 1) acids.push({ id, pKa: sys.pKa[index], n, sys, index });
      if (index > 0) bases.push({ id, pKa: sys.pKa[index - 1], n, sys, index });
    }
    return { acids, bases };
  }

  #resolveProtons(v, ev) {
    let changed = false;
    for (let guard = 0; guard < 200; guard++) {
      const { acids, bases } = this.#acidBaseCandidates(v);
      if (!acids.length || !bases.length) break;
      acids.sort((a, b) => a.pKa - b.pKa);
      bases.sort((a, b) => b.pKa - a.pKa);
      let done = false;
      for (const A of acids) {
        for (const B of bases) {
          if (A.id === B.id) continue;
          if (A.sys && B.sys && A.sys === B.sys && A.index + 1 === B.index) continue; // bir tizimdagi qo'shni shakllar
          if (!(A.pKa < B.pKa)) continue;
          const n = Math.min(A.n, B.n);
          if (n <= EPS) continue;
          // kislota protonni beradi
          if (A.id === 'H^+') this.add(v, 'H^+', 'aq', -n);
          else { this.add(v, A.id, 'aq', -n); this.add(v, A.sys.forms[A.index + 1], 'aq', n); }
          // asos protonni oladi
          if (B.id === 'OH^-') { this.add(v, 'OH^-', 'aq', -n); this.add(v, WATER, 'aq', n); }
          else { this.add(v, B.id, 'aq', -n); this.add(v, B.sys.forms[B.index - 1], 'aq', n); }
          const strong = A.id === 'H^+' && B.id === 'OH^-';
          this.addHeat(v, (strong ? -57300 : -35000) * n);
          ev.push({ type: 'acid-base', acid: A.id, base: B.id, mol: n, water: B.id === 'OH^-' });
          changed = true; done = true;
          break;
        }
        if (done) break;
      }
      if (!done) break;
    }
    return changed;
  }

  // ---------------------------------------------------- maxsus juftlar (birgalikdagi gidroliz va h.k.)
  #applyEq(v, parsed, xi, phases = {}) {
    const lefts = [...parsed.left].sort((a, b) => (a.id === 'H^+') - (b.id === 'H^+'));
    for (const t of lefts) {
      if (!t.id) continue;
      if (t.coef < 0) continue;
      const need = t.coef * xi;
      if (t.id === 'H^+' && !phases[t.id]) { this.#consumeProtons(v, need); continue; }
      const ph = phases[t.id] || this.#phaseOfTerm(v, t, 'left');
      const have = this.get(v, t.id, ph);
      if (have >= need - 1e-15 || !this.db.formToSystem.has(t.id)) { this.#consume(v, t.id, ph, need); continue; }
      // kislota-asos tizimi: boshqa shakllardan olib, protonlarni tenglashtiramiz
      this.#consumeSystem(v, t.id, need);
    }
    for (const t of parsed.right) {
      if (!t.id) continue;
      const ph = phases[t.id] || this.#phaseOfTerm(v, t, 'right');
      const sb = this.db.sub(t.id);
      // eriydigan elektrolit eritmada ionlarga ajraladi
      if (ph === 'aq' && sb && (sb.dissociation || sb.dissolve_molecular) && !t.mark && this.waterMol(v) > 1e-6) this.#dissolveInto(v, t.id, t.coef * xi);
      else this.add(v, t.id, ph, t.coef * xi);
    }
  }

  /** Eritmadagi protonlar manbai: H+ va pKa < 7,5 bo'lgan kislota shakllari */
  protonSupply(v) {
    let n = this.get(v, 'H^+', 'aq');
    for (const [id, m] of this.inPhase(v, 'aq')) {
      const e = this.db.formToSystem.get(id);
      if (!e || m <= EPS) continue;
      let k = 0;
      for (let j = e.index; j < e.sys.pKa.length; j++) if (e.sys.pKa[j] < 7.5) k++;
      n += k * m;
    }
    return n;
  }
  #consumeProtons(v, need) {
    const h = this.get(v, 'H^+', 'aq');
    const take = Math.min(h, need);
    this.add(v, 'H^+', 'aq', -take);
    let rest = need - take;
    for (let guard = 0; guard < 20 && rest > 1e-15; guard++) {
      let best = null;
      for (const [id, m] of this.inPhase(v, 'aq')) {
        const e = this.db.formToSystem.get(id);
        if (!e || m <= EPS || e.index >= e.sys.pKa.length) continue;
        const pKa = e.sys.pKa[e.index];
        if (pKa >= 7.5) continue;
        if (!best || pKa < best.pKa) best = { id, m, e, pKa };
      }
      if (!best) break;
      const t = Math.min(best.m, rest);
      this.add(v, best.id, 'aq', -t);
      this.add(v, best.e.sys.forms[best.e.index + 1], 'aq', t);
      rest -= t;
    }
  }

  /** Moddani fazadan (yetmasa boshqa fazalardan) sarflash */
  #consume(v, id, phase, need) {
    const have = this.get(v, id, phase);
    const take = Math.min(have, need);
    this.add(v, id, phase, -take);
    let rest = need - take;
    for (const ph of ['aq', 's', 'org', 'g']) {
      if (rest <= 1e-15 || ph === phase) continue;
      const h = this.get(v, id, ph);
      const t2 = Math.min(h, rest);
      this.add(v, id, ph, -t2);
      rest -= t2;
    }
  }

  /** Tizimning istalgan shaklidan sarflash (H+/OH- bilan tenglashtirib) */
  #consumeSystem(v, id, need) {
    const { sys, index } = this.db.formToSystem.get(id);
    const order = sys.forms.map((f, j) => ({ f, j })).sort((a, b) => Math.abs(a.j - index) - Math.abs(b.j - index));
    let rest = need;
    for (const { f, j } of order) {
      if (rest <= 1e-15) break;
      const have = this.get(v, f, 'aq');
      const take = Math.min(have, rest);
      if (take <= 0) continue;
      this.add(v, f, 'aq', -take);
      const dH = index - j; // musbat: protonlangan shakldan olindi — H+ ajraladi
      if (dH > 0) this.add(v, 'H^+', 'aq', dH * take);
      else if (dH < 0) { this.add(v, 'OH^-', 'aq', -dH * take); this.add(v, WATER, 'aq', dH * take); }
      rest -= take;
    }
  }

  /** Tenglama hadining fazasi */
  #phaseOfTerm(v, t, side) {
    if (t.mark === '↓') return 's';
    if (t.mark === '↑') return 'g';
    if (this.db.isIon(t.id)) return 'aq';
    if (t.id === WATER) return side === 'right' && v.T >= 100 ? 'g' : 'aq';
    const s = this.db.sub(t.id);
    if (!s) return 'aq';
    if (side === 'left') {
      // chap tomonda — idishda qaysi fazada bo'lsa
      for (const ph of ['aq', 's', 'org', 'g']) if (this.has(v, t.id, ph)) return ph;
      return 'aq';
    }
    if (s.state === 'g') return 'g';
    if (s.state === 's') return s.solubility === 'R' && this.waterMol(v) > 1e-6 ? 'aq' : 's';
    if (s.miscible_water === false) return 'org';
    return 'aq';
  }

  /** Tenglama chap tomonidagi moddalar mavjudligi bo'yicha maksimal reaksiya darajasi */
  #maxExtent(v, parsed, phaseOverride = null) {
    let xi = Infinity;
    for (const t of parsed.left) {
      if (!t.id) return 0;
      if (t.coef <= 0) continue;
      let n;
      if (phaseOverride?.[t.id]) n = this.get(v, t.id, phaseOverride[t.id]);
      else if (t.id === 'H^+') n = this.protonSupply(v);
      else n = this.#availableAny(v, t.id);
      xi = Math.min(xi, n / t.coef);
    }
    return xi === Infinity ? 0 : xi;
  }
  /** Katalizator idishda bormi (elektrolitlar ionlari orqali ham) */
  catalystPresent(v, id) {
    if (this.#availableAny(v, id) > EPS) return true;
    const s = this.db.sub(id);
    if (s?.dissociation) {
      return Object.keys(s.dissociation).filter((ion) => ion !== WATER && ion !== 'H^+' && ion !== 'OH^-').every((ion) => {
        const e = this.db.formToSystem.get(ion);
        if (e) return e.sys.forms.some((f) => this.get(v, f, 'aq') > EPS);
        return this.#availableAny(v, ion) > EPS;
      });
    }
    return false;
  }
  #availableAny(v, id) {
    const se = this.db.formToSystem.get(id);
    if (se) return se.sys.forms.reduce((a, f) => a + this.get(v, f, 'aq'), 0) + this.get(v, id, 's') + this.get(v, id, 'g') + this.get(v, id, 'org');
    let n = 0;
    for (const ph of ['aq', 's', 'org', 'g']) n += this.get(v, id, ph);
    return n;
  }

  #specialPairs(v, ev) {
    let changed = false;
    for (const p of this.db.specialPairs) {
      if (!this.has(v, p.cation, 'aq') || !this.has(v, p.anion, 'aq')) continue;
      const xi = this.#maxExtent(v, p.parsed);
      if (xi <= EPS) continue;
      this.#applyEq(v, p.parsed, xi);
      ev.push({ type: 'rule', rule: 'maxsus-juft', eq: p.eq, note_uz: p.note_uz, xi });
      this.#emitProductsEvents(v, p.parsed, xi, ev);
      changed = true;
    }
    return changed;
  }

  #emitProductsEvents(v, parsed, xi, ev, extra = {}) {
    for (const t of parsed.right) {
      if (!t.id) continue;
      if (t.mark === '↓') ev.push({ type: 'precipitate', species: t.id, mol: t.coef * xi, ...this.#pptLook(t.id), ...extra });
      if (t.mark === '↑') ev.push({ type: 'gas', species: t.id, mol: t.coef * xi, ...extra });
      if (!t.mark && this.db.sub(t.id)?.metal) ev.push({ type: 'deposit', species: t.id, mol: t.coef * xi, ...extra });
    }
  }

  #pptLook(id) {
    const s = this.db.sub(id);
    return { color: s?.precipitate?.color || s?.appearance?.color || '#f4f4f0', texture: s?.precipitate?.texture || 'mayda-kristall' };
  }

  // ---------------------------------------------------- cho'kma hosil bo'lishi
  #precipitate(v, ev) {
    const db = this.db;
    const aq = this.inPhase(v, 'aq');
    const cations = aq.filter(([id, n]) => n > EPS && db.isIon(id) && db.ions[id].charge > 0 && id !== 'H^+');
    if (!cations.length) return false;
    const L = this.aqL(v);
    const cands = [];
    for (const [cat] of cations) {
      const row = db.rules.solubility_table[cat];
      if (!row) continue;
      for (const [an, code] of Object.entries(row)) {
        if (code !== 'N' && code !== 'M') continue;
        const salt = db.saltOf(cat, an);
        if (!salt) continue;
        const forms = this.#anionForms(an, db.sub(salt));
        const avail = forms.reduce((a, f) => a + this.get(v, f.id, 'aq'), 0);
        if (avail <= EPS) continue;
        if (db.specialPairs.some((p) => p.cation === cat && p.anion === an)) continue;
        const hint = db.rules.ppt_order_hint?.[salt] ?? (code === 'N' ? 1e-4 : 1e-2);
        cands.push({ cat, an, code, salt, forms, hint });
      }
    }
    if (!cands.length) return false;
    cands.sort((a, b) => a.hint - b.hint);
    let changed = false;
    for (const c of cands) {
      const st = db.saltStoich(c.salt);
      const nc = st[c.cat], na = st[c.an];
      const catN = this.get(v, c.cat, 'aq');
      const anN = c.forms.reduce((a, f) => a + this.get(v, f.id, 'aq'), 0);
      let n = Math.min(catN / nc, anN / na);
      if (c.code === 'M') {
        const s = db.sub(c.salt);
        const maxDissolved = ((s.s_gL ?? 1) / s.M) * L;
        n -= maxDissolved;
      }
      if (n <= 1e-9) continue;
      // kationni sarflash
      this.add(v, c.cat, 'aq', -nc * n);
      // anionni (va uning protonlangan shakllarini) sarflash
      let need = na * n;
      for (const f of c.forms) {
        const have = this.get(v, f.id, 'aq');
        const take = Math.min(have, need);
        if (take <= 0) continue;
        this.add(v, f.id, 'aq', -take);
        if (f.protons) this.add(v, 'H^+', 'aq', f.protons * take);
        need -= take;
        if (need <= EPS) break;
      }
      this.add(v, c.salt, 's', n);
      ev.push({ type: 'precipitate', species: c.salt, mol: n, rule: 'cho\'kma', ...this.#pptLook(c.salt) });
      changed = true;
    }
    return changed;
  }

  /** Cho'kma uchun anionning qaysi shakllari ishlatilishi mumkin (kislotada erimaydigan tuzlar protonlangan shakldan ham) */
  #anionForms(an, saltSub) {
    const e = this.db.formToSystem.get(an);
    const forms = [{ id: an, protons: 0 }];
    if (!e) return forms;
    const acidSol = saltSub?.acid_soluble ?? null;
    let depth = 0;
    if (acidSol === null) depth = e.index; // istalgan protonlangan shakl
    else if (acidSol === 'kuchli') depth = 1;
    for (let k = 1; k <= depth; k++) {
      const fid = e.sys.forms[e.index - k];
      if (!fid) break;
      // neytral to'liq protonlangan kuchli kislota (H2SO4) dan ham olinadi
      forms.push({ id: fid, protons: k });
    }
    return forms;
  }

  /** Kuchsiz asoslar (NH3, aminlar) metall gidroksidlarini cho'ktiradi */
  #weakBaseHydroxides(v, ev) {
    const db = this.db;
    const bases = [];
    for (const [id, n] of this.inPhase(v, 'aq')) {
      const e = db.formToSystem.get(id);
      if (!e || n <= EPS || e.index === 0) continue;
      const conj = e.sys.pKa[e.index - 1];
      if (conj >= 9 && db.isIon(id) === false && ['ammiak', 'metilamin', 'etilamin'].includes(e.sys.id)) bases.push({ id, n, e });
    }
    if (!bases.length) return false;
    let changed = false;
    const pHnow = this.pH(v);
    for (const [cat, nCat] of this.inPhase(v, 'aq')) {
      if (!db.isIon(cat) || db.ions[cat].charge <= 0 || cat === 'H^+' || nCat <= EPS) continue;
      // kuchsiz asos gidroksidni faqat yetarli pH da cho'ktiradi (masalan, NH4Cl ishtirokida Mg(OH)2 cho'kmaydi)
      if (db.ions[cat].hydroxide_pH !== undefined && pHnow !== null && pHnow < db.ions[cat].hydroxide_pH) continue;
      const code = db.solubility(cat, 'OH^-');
      const special = db.specialPairs.find((p) => p.cation === cat && p.anion === 'OH^-');
      if (code !== 'N' && !special) continue;
      const z = db.ions[cat].charge;
      for (const b of bases) {
        const have = this.get(v, b.id, 'aq');
        if (have <= EPS) continue;
        const nOH = Math.min(have, z * this.get(v, cat, 'aq'));
        if (nOH <= EPS) continue;
        // B + H2O -> BH+ + OH-  (keyingi qadamda OH- cho'ktiradi)
        this.add(v, b.id, 'aq', -nOH);
        this.add(v, b.e.sys.forms[b.e.index - 1], 'aq', nOH);
        this.add(v, WATER, 'aq', -nOH);
        this.add(v, 'OH^-', 'aq', nOH);
        changed = true;
      }
    }
    if (changed) {
      this.#specialPairs(v, ev);
      this.#precipitate(v, ev);
    }
    return changed;
  }

  // ---------------------------------------------------- komplekslar
  #complexes(v, ev) {
    let changed = false;
    for (const c of this.db.complexes) {
      const fromId = this.db.keyOf(c.from);
      const ligand = c.ligand;
      // to'g'ri yo'nalish: cho'kma + ortiqcha ligand
      if (this.has(v, fromId, 's') && this.has(v, ligand, 'aq')) {
        const xi = this.#maxExtent(v, c.parsed, { [fromId]: 's' });
        if (xi > EPS) {
          this.#applyEq(v, c.parsed, xi, {});
          // cho'kmani qattiq fazadan olish
          ev.push({ type: 'complex', eq: c.eq, note_uz: c.note_uz, xi, dissolves: fromId });
          changed = true;
        }
      }
      // teskari yo'nalish: kislota qo'shilganda kompleks parchalanadi
      const prod = c.parsed.right.find((t) => t.id && this.db.isIon(t.id) && t.id !== 'OH^-' && t.id !== 'Cl^-');
      if (!prod || !this.has(v, prod.id, 'aq')) continue;
      if (ligand === 'OH^-') {
        // gidrokso-kompleks: pKa < 12 bo'lgan istalgan kislota bilan
        let capacity = this.get(v, 'H^+', 'aq');
        for (const [id, n] of this.inPhase(v, 'aq')) {
          const e = this.db.formToSystem.get(id);
          if (e && e.index < e.sys.forms.length - 1 && e.sys.pKa[e.index] < 12) capacity += n;
        }
        if (capacity <= EPS) continue;
        const ohCoef = c.parsed.left.find((t) => t.id === 'OH^-')?.coef || 1;
        const xi = Math.min(this.get(v, prod.id, 'aq') / prod.coef, capacity / ohCoef);
        if (xi <= EPS) continue;
        this.add(v, prod.id, 'aq', -prod.coef * xi);
        this.add(v, fromId, 's', xi);
        this.add(v, 'OH^-', 'aq', ohCoef * xi);
        ev.push({ type: 'precipitate', species: fromId, mol: xi, rule: 'kompleks-parchalanishi', ...this.#pptLook(fromId) });
        changed = true;
      } else if (ligand === 'NH3') {
        let h = this.get(v, 'H^+', 'aq');
        for (const [id, n] of this.inPhase(v, 'aq')) {
          const e = this.db.formToSystem.get(id);
          if (e && n > EPS && e.index < e.sys.forms.length - 1 && e.sys.pKa[e.index] < 3) h += n;
        }
        if (h <= EPS) continue;
        const nNH3 = c.parsed.left.find((t) => t.id === 'NH3')?.coef || 2;
        const xi = Math.min(this.get(v, prod.id, 'aq') / prod.coef, h / nNH3);
        if (xi <= EPS) continue;
        // [M(NH3)n]z+ -> Mz+ + n NH3 (keyin NH3 + H+ -> NH4+)
        const metalIon = this.#metalIonOfAmmine(prod.id);
        if (!metalIon) continue;
        this.add(v, prod.id, 'aq', -prod.coef * xi);
        this.add(v, metalIon.ion, 'aq', metalIon.k * prod.coef * xi);
        // ammiak protonlanadi (H+ yoki HSO4- kabi kislotalar hisobiga)
        this.add(v, 'NH4^+', 'aq', nNH3 * xi);
        this.#consumeProtons(v, nNH3 * xi);
        ev.push({ type: 'rule', rule: 'ammiakat-parchalanishi', xi });
        changed = true;
      }
    }
    return changed;
  }

  #metalIonOfAmmine(id) {
    const map = { '[Cu(NH3)4]^2+': 'Cu^2+', '[Ag(NH3)2]^+': 'Ag^+', '[Zn(NH3)4]^2+': 'Zn^2+', '[Ni(NH3)6]^2+': 'Ni^2+', '[Co(NH3)6]^2+': 'Co^2+' };
    return map[id] ? { ion: map[id], k: 1 } : null;
  }

  /** Eritmada erimaydigan molekulyar moddalar cho'kmaga yoki organik qatlamga o'tadi */
  #insolubleMolecular(v, ev) {
    let changed = false;
    const L = this.aqL(v);
    const water = this.waterMol(v);
    if (water < 1e-6) return false;
    for (const [id, n] of this.inPhase(v, 'aq')) {
      if (id === WATER || this.db.isIon(id) || n <= EPS) continue;
      const s = this.db.sub(id);
      if (!s) continue;
      if (this.db.formToSystem.has(id) && !(s.solubility === 'N')) continue;
      if (s.mixture_phase || (v._mixturePhases && v._mixturePhases[id])) continue;
      if (id === 'Cu(OH)2' && this.has(v, 'Feling', 'aq')) continue;
      if (s.solubility === 'N' && (s.state === 's')) {
        this.add(v, id, 'aq', -n); this.add(v, id, 's', n);
        ev.push({ type: 'precipitate', species: id, mol: n, ...this.#pptLook(id) });
        changed = true;
      } else if (s.solubility === 'N' && s.state === 'l') {
        this.add(v, id, 'aq', -n); this.add(v, id, 'org', n);
        ev.push({ type: 'layer', species: id, mol: n });
        changed = true;
      } else if (s.state === 's' && s.s_gL && s.solubility !== 'R') {
        const max = (s.s_gL / s.M) * L;
        if (n > max * 1.05) {
          this.add(v, id, 'aq', -(n - max)); this.add(v, id, 's', n - max);
          ev.push({ type: 'precipitate', species: id, mol: n - max, ...this.#pptLook(id) });
          changed = true;
        }
      }
    }
    return changed;
  }

  // ---------------------------------------------------- qattiq moddalarning erishi
  #dissolveSolids(v, dt, ev) {
    const water = this.waterMol(v);
    if (water < 1e-6) return;
    const L = this.aqL(v);
    for (const [id, n] of this.inPhase(v, 's')) {
      const s = this.db.sub(id);
      if (!s || n <= EPS) continue;
      if (s.solubility !== 'R' && s.solubility !== 'M') continue;
      if (s.metal) continue;
      if (s.oxide) continue;
      // to'yinish chegarasi
      const sgl = s.s_gL ?? (s.solubility === 'M' ? 1 : 300);
      const maxMol = (sgl / s.M) * L;
      const dissolved = this.#dissolvedAmountOf(v, id);
      const room = maxMol - dissolved;
      if (room <= EPS) continue;
      const surf = SURFACE[v.forms[id]] ?? 1;
      const tau = 4 / (surf * (v.stirring ? 3 : 1) * Math.pow(2, (v.T - 20) / 15));
      const d = Math.min(n, room, n * (1 - Math.exp(-dt / tau)) + 1e-7);
      if (d <= EPS) continue;
      this.add(v, id, 's', -d);
      this.#dissolveInto(v, id, d, true);
      if (s.heat_of_dilution) this.addHeat(v, (HEAT_CLASS_KJ[s.heat_of_dilution] || -40) * 1000 * d * 0.4);
      if (id === 'NH4NO3' || id === 'NH4Cl' || id === 'KNO3') this.addHeat(v, 25000 * d);
      ev.push({ type: 'dissolve', species: id, mol: d });
    }
  }
  #dissolvedAmountOf(v, id) {
    const s = this.db.sub(id);
    if (s.dissociation) {
      let min = Infinity;
      for (const [ion, k] of Object.entries(s.dissociation)) {
        if (ion === WATER) continue;
        min = Math.min(min, this.get(v, ion, 'aq') / k);
      }
      return min === Infinity ? 0 : min;
    }
    return this.get(v, id, 'aq');
  }

  // ---------------------------------------------------- oksidlar + suv (gidratlanish)
  #oxideWater(v, dt, ev) {
    if (this.waterMol(v) < 1e-6) return;
    this._hydCache = this._hydCache || new Map();
    for (const [id, n] of this.inPhase(v, 's')) {
      const s = this.db.sub(id);
      const eq = s?.oxide?.hydration_eq;
      if (!eq || n <= EPS) continue;
      if (!this._hydCache.has(id)) this._hydCache.set(id, this.db.parseEq(eq));
      const p = this._hydCache.get(id);
      const ox = p.left.find((t) => t.id === id);
      const w = p.left.find((t) => t.id === WATER);
      const hyd = p.right[0];
      const surf = SURFACE[v.forms[id]] ?? 1;
      const tau = (s.oxide.slow ? (v.T >= 70 ? 40 : 400) : 2.5) / (surf * (v.stirring ? 2 : 1));
      const xiMax = Math.min(n / ox.coef, this.waterMol(v) / w.coef);
      const xi = xiMax * (1 - Math.exp(-dt / tau));
      if (xi <= EPS) continue;
      this.add(v, id, 's', -ox.coef * xi);
      this.add(v, WATER, 'aq', -w.coef * xi);
      this.#dissolveInto(v, hyd.id, hyd.coef * xi);
      this.addHeat(v, (s.oxide.type === 'kislotali' ? -120000 : -65000) * xi);
      ev.push({ type: 'rule', rule: 'oksid+suv', eq, xi });
    }
  }

  /** Alanga sinovi: eritma/tuzdagi kationlar bo'yicha alanga rangi (natriy boshqalarni bosib ketadi) */
  flameTest(v) {
    const out = [];
    for (const ph of ['aq', 's']) {
      for (const [id, n] of this.inPhase(v, ph)) {
        if (n <= EPS) continue;
        const ions = this.db.isIon(id) ? { [id]: 1 } : (this.db.sub(id)?.ions || this.db.sub(id)?.dissociation || {});
        for (const [ion, k] of Object.entries(ions)) {
          const f = this.db.ions[ion]?.flame;
          if (f) out.push({ ion, color: f.color, desc_uz: f.desc_uz, mol: n * k });
        }
      }
    }
    const merged = new Map();
    for (const x of out) merged.set(x.ion, { ...x, mol: (merged.get(x.ion)?.mol || 0) + x.mol });
    const list = [...merged.values()].map((x) => ({ ...x, weight: x.mol * (x.ion === 'Na^+' ? 20 : 1) }));
    list.sort((a, b) => b.weight - a.weight);
    return list;
  }

  // ---------------------------------------------------- kislotada erish (karbonat, gidroksid, oksid ...)
  #acidDissolution(v, dt, ev) {
    const db = this.db;
    if (this.waterMol(v) < 1e-6) return;
    const solids = this.inPhase(v, 's').filter(([id, n]) => {
      const s = db.sub(id);
      return n > EPS && s && (s.acid_soluble === 'kuchli' || s.acid_soluble === 'kuchsiz') && !s.metal;
    });
    if (!solids.length) return;
    // kuchli kislota: erkin H+ yoki pKa < 3 bo'lgan kislota shakllari (HSO4-, H3PO4 ...)
    let hasStrong = this.has(v, 'H^+', 'aq');
    if (!hasStrong) {
      for (const [id, n] of this.inPhase(v, 'aq')) {
        const e = db.formToSystem.get(id);
        if (e && n > EPS && e.index < e.sys.forms.length - 1 && e.sys.pKa[e.index] < 3) { hasStrong = true; break; }
      }
    }
    let hasWeak = hasStrong;
    if (!hasWeak) {
      for (const [id, n] of this.inPhase(v, 'aq')) {
        const e = db.formToSystem.get(id);
        if (e && n > EPS && e.index < e.sys.forms.length - 1 && e.sys.pKa[e.index] < 7.5) { hasWeak = true; break; }
      }
    }
    if (!hasWeak) return;
    for (const [id, n] of solids) {
      const s = db.sub(id);
      if (s.acid_soluble === 'kuchli' && !hasStrong) continue;
      const ions = this.#solidIons(id);
      if (!ions) continue;
      const surf = SURFACE[v.forms[id]] ?? 1.5;
      const tau = 3 / (surf * (v.stirring ? 2 : 1) * Math.pow(2, (v.T - 20) / 10));
      const d = Math.min(n, n * (1 - Math.exp(-dt / tau)) + 2e-6);
      // sinab ko'rish: eritib, muvozanatga keltirib, qattiq faza haqiqatan kamaydimi?
      const trial = this.clone(v);
      this.add(trial, id, 's', -d);
      for (const [ion, k] of Object.entries(ions)) this.add(trial, ion, 'aq', k * d);
      const tev = [];
      this.equilibrate(trial, tev);
      const after = this.get(trial, id, 's');
      if (after < n - d * 0.5) {
        v.contents = trial.contents;
        v.T = trial.T;
        ev.push({ type: 'acid-dissolve', species: id, mol: n - after });
        for (const e of tev) if (e.type !== 'acid-base') ev.push(e);
      }
    }
  }

  /** Qattiq moddani ionlarga ajratish (kislotada eritish uchun) */
  #solidIons(id) {
    const s = this.db.sub(id);
    if (s.ions) return s.ions;
    if (id === 'Fe3O4') return { 'Fe^2+': 1, 'Fe^3+': 2, 'OH^-': 8, H2O: -4 };
    if (s.oxide && s.formula) {
      // MxOy -> x M^(2y/x)+ + y O^2-  ;  O^2- o'rniga 2OH- - H2O (ya'ni y H2O sarflanadi, 2y OH- hosil bo'ladi)
      const m = s.formula.match(/^([A-Z][a-z]?)(\d*)O(\d*)$/);
      if (!m) return id === 'Fe3O4' ? { 'Fe^2+': 1, 'Fe^3+': 2, 'OH^-': 8, H2O: -4 } : null;
      const x = m[2] ? +m[2] : 1, y = m[3] ? +m[3] : 1;
      const z = (2 * y) / x;
      const ion = `${m[1]}^${z === 1 ? '' : z}+`;
      if (!this.db.ions[ion]) return null;
      return { [ion]: x, 'OH^-': 2 * y, H2O: -y };
    }
    if (id === '(CuOH)2CO3') return { 'Cu^2+': 2, 'OH^-': 2, 'CO3^2-': 1 };
    return null;
  }

  // ---------------------------------------------------- metallar
  #metals(v, dt, ev) {
    const db = this.db;
    const metals = this.inPhase(v, 's').filter(([id, n]) => n > EPS && db.sub(id)?.metal);
    if (!metals.length) return;
    const water = this.waterMol(v);
    const L = this.aqL(v);
    for (const [mid] of metals) {
      const m = db.sub(mid).metal;
      const rule = db.metals.get(mid);
      if (!rule) continue;
      const surf = SURFACE[v.forms[mid]] ?? 1;
      const fT = Math.pow(2, (v.T - 20) / 10);
      // aniq yozuv (masalan, HNO3 bilan) bu metallni band qilgan bo'lsa — umumiy qoida ishlamaydi
      if (v._recordMetals?.has(mid)) continue;
      // 1) suv bilan (faol metallar)
      if (water > 1e-6 && (m.water === 'sovuq' || (m.water === 'issiq' && v.T >= 70))) {
        const tau = (m.water === 'sovuq' ? (['K', 'Na', 'Li'].includes(mid) ? 1.5 : 6) : 25) / (surf * fT);
        const nM = this.get(v, mid, 's');
        const d = Math.min(nM, nM * (1 - Math.exp(-dt / tau)) + 1e-6);
        // M + n H2O -> M^n+ + n OH- + n/2 H2
        this.add(v, mid, 's', -d);
        this.add(v, m.ion, 'aq', d);
        this.add(v, 'OH^-', 'aq', m.n * d);
        this.add(v, WATER, 'aq', -m.n * d);
        this.add(v, 'H2', 'g', (m.n / 2) * d);
        this.addHeat(v, -180000 * d);
        ev.push({ type: 'metal-water', metal: mid, mol: d });
        ev.push({ type: 'gas', species: 'H2', mol: (m.n / 2) * d, rule: 'metall+suv' });
        if (['K', 'Na', 'Li'].includes(mid) && v.T > 60) ev.push({ type: 'flame', color: db.ions[m.ion]?.flame?.color || '#ffb000', small: true });
        continue;
      }
      // 2) ishqor bilan (amfoter metallar)
      const alk = db.metalAlkali.find((a) => a.metal === mid);
      if (alk && this.get(v, 'OH^-', 'aq') > EPS && (!alk.heat || v.T >= 60)) {
        const xiMax = this.#maxExtent(v, alk.parsed, { [mid]: 's' });
        if (xiMax > EPS) {
          const conc = this.get(v, 'OH^-', 'aq') / L;
          const tau = 10 / (surf * fT * Math.min(Math.max(conc, 0.05), 5));
          const xi = xiMax * (1 - Math.exp(-dt / tau));
          this.#applyEq(v, alk.parsed, xi, { [mid]: 's' });
          ev.push({ type: 'rule', rule: 'metall+ishqor', eq: alk.eq, xi });
          ev.push({ type: 'gas', species: 'H2', mol: xi, rule: 'metall+ishqor' });
          this.addHeat(v, -150000 * xi);
        }
      }
      // 3) kislota bilan (H+ ni qaytarish)
      const H = this.get(v, 'H^+', 'aq');
      const oxidizingAcid = this.#oxidizingAcidPresent(v);
      if (m.E0 < 0 && !oxidizingAcid) {
        let protons = H, weak = false;
        if (protons <= EPS) {
          // kuchsiz kislota (sirka) bilan sekin
          for (const [id, n] of this.inPhase(v, 'aq')) {
            const e = db.formToSystem.get(id);
            if (e && e.index < e.sys.forms.length - 1 && e.sys.pKa[e.index] < 5.5 && n > EPS) { protons = n; weak = id; break; }
          }
        }
        if (protons > EPS && !this.#passivated(v, mid)) {
          const nM = this.get(v, mid, 's');
          const c = protons / L;
          const base = { Li: 0.5, K: 0.3, Na: 0.4, Ca: 1, Ba: 1, Mg: 2, Al: 15, Mn: 6, Zn: 8, Cr: 30, Fe: 25, Ni: 60, Sn: 50, Pb: 300 }[mid] ?? 20;
          const film = m.film && !this.has(v, 'Cl^-', 'aq') ? 4 : 1;
          const tau = (base * film * (weak ? 8 : 1)) / (surf * fT * Math.min(Math.max(c, 0.02), 6));
          const maxByH = protons / m.n;
          const d = Math.min(nM, maxByH, Math.min(nM, maxByH) * (1 - Math.exp(-dt / tau)));
          if (d > EPS) {
            this.add(v, mid, 's', -d);
            this.add(v, m.ion, 'aq', d);
            if (weak) {
              const e = db.formToSystem.get(weak);
              this.add(v, weak, 'aq', -m.n * d);
              this.add(v, e.sys.forms[e.index + 1], 'aq', m.n * d);
            } else this.add(v, 'H^+', 'aq', -m.n * d);
            this.add(v, 'H2', 'g', (m.n / 2) * d);
            this.addHeat(v, -120000 * d);
            ev.push({ type: 'metal-acid', metal: mid, mol: d, acid: weak || 'H^+' });
            ev.push({ type: 'gas', species: 'H2', mol: (m.n / 2) * d, rule: 'metall+kislota' });
            // Pb: erimaydigan tuz parda hosil qiladi
            if (mid === 'Pb' && (this.has(v, 'Cl^-', 'aq') || this.has(v, 'SO4^2-', 'aq') || this.has(v, 'HSO4^-', 'aq'))) v._pbFilm = (v._pbFilm || 0) + d;
          }
        }
      }
      // 4) tuz eritmasi bilan (faollik qatori)
      if (m.water === 'sovuq') continue;
      for (const r of db.reducible) {
        const nIon = this.get(v, r.ion, 'aq');
        if (nIon <= EPS) continue;
        if (r.to === mid) continue;
        if (!(r.E > m.E0 + 0.1)) continue;
        if (r.ion === 'Fe^3+' && false) continue;
        const nM = this.get(v, mid, 's');
        if (nM <= EPS) break;
        // M + (n/e) X -> M^n+ + (n/e) Y   (elektronlar: metall n, ion e)
        const ratio = m.n / r.e;
        const film = m.film && !this.has(v, 'Cl^-', 'aq') ? 30 : 1;
        const c = nIon / L;
        const tau = (12 * film) / (surf * fT * Math.min(Math.max(c, 0.01), 2));
        const xiMax = Math.min(nM, nIon / ratio);
        const xi = xiMax * (1 - Math.exp(-dt / tau));
        if (xi <= EPS) continue;
        this.add(v, mid, 's', -xi);
        this.add(v, m.ion, 'aq', xi);
        this.add(v, r.ion, 'aq', -ratio * xi);
        const toIsMetal = !!db.sub(r.to)?.metal;
        this.add(v, r.to, toIsMetal ? 's' : 'aq', ratio * xi);
        this.addHeat(v, -40000 * xi);
        if (toIsMetal) {
          v.deposits = v.deposits || {};
          v.deposits[mid] = r.to;
          ev.push({ type: 'deposit', species: r.to, on: mid, mol: ratio * xi, rule: 'faollik-qatori' });
        }
        ev.push({ type: 'displacement', metal: mid, ion: r.ion, to: r.to, xi });
      }
    }
  }

  #oxidizingAcidPresent(v) {
    if (this.has(v, 'NO3^-', 'aq') && this.has(v, 'H^+', 'aq')) return 'HNO3';
    const sys = this.db.systems.get('sulfat');
    const nS = sys.forms.reduce((a, f) => a + this.get(v, f, 'aq'), 0);
    if (nS / this.aqL(v) >= 12) return 'H2SO4-kons';
    return null;
  }
  #passivated(v, mid) {
    if (mid === 'Pb' && (v._pbFilm || 0) > 1e-5) return true;
    return false;
  }

  // ---------------------------------------------------- katalogdagi aniq yozuvlar
  /** Yozuv chap tomoni idishda bormi va shartlar bajarilganmi */
  matchRecord(v, r, env = {}) {
    if (!r._net) return { ok: false, present: false };
    const missing = [];
    for (const t of r._net.left) {
      if (!t.id) return { ok: false, present: false };
      if (t.coef <= 0) continue;
      if (t.id === WATER) { if (this.waterMol(v) <= 1e-6 && !this.has(v, WATER, 'g')) missing.push(t.id); continue; }
      if (t.id === 'H^+') { if (this.protonSupply(v) <= EPS) missing.push(t.id); continue; }
      if (this.#availableAny(v, t.id) <= EPS) missing.push(t.id);
    }
    if (missing.length) return { ok: false, present: false, missing };
    if (r.no_reaction) {
      // "reaksiya ketmaydi" yozuvi faqat uning barcha reaktivlari idishda bo'lganda tegishli
      for (const re of r.reactants || []) {
        const id = this.db.keyOf(re.species);
        const s = this.db.sub(id);
        if (!s || s.indicator) continue;
        const here = re.state === 'aq' ? this.concOf(v, id) > 1e-7 : this.#availableAny(v, id) > EPS;
        if (!here) return { ok: false, present: false, missing: [id] };
      }
    }
    const unmet = this.#unmetConditions(v, r, env);
    return { ok: unmet.length === 0, present: true, unmet };
  }

  #unmetConditions(v, r, env) {
    const c = r.conditions || {};
    const unmet = [];
    const tmin = c.temp_min_C ?? (c.heating ? 60 : null);
    if (tmin !== null && tmin !== undefined && v.T < tmin) unmet.push({ code: 'qizdirish', need: tmin });
    if (c.temp_max_C !== undefined && c.temp_max_C !== null && v.T > c.temp_max_C) unmet.push({ code: 'sovuq', need: c.temp_max_C });
    if (c.catalyst) {
      const cats = Array.isArray(c.catalyst) ? c.catalyst : [c.catalyst];
      for (const cat of cats) {
        const id = this.db.keyOf(cat);
        if (!this.catalystPresent(v, id)) unmet.push({ code: 'katalizator', need: id });
      }
    }
    if (c.light && !v.illuminated) unmet.push({ code: 'yorug\'lik' });
    if (c.ignition && v.T < (c.ignition_C ?? 300) && !v.ignited) unmet.push({ code: 'yondirish', need: c.ignition_C ?? 300 });
    if (c.medium) {
      const pH = this.pH(v);
      if (c.medium === 'kislotali' && !(pH < 4.5)) unmet.push({ code: 'muhit', need: 'kislotali' });
      if (c.medium === 'neytral' && !(pH >= 4.5 && pH <= 10)) unmet.push({ code: 'muhit', need: 'neytral' });
      if (c.medium === 'ishqoriy' && !(pH > 10)) unmet.push({ code: 'muhit', need: 'ishqoriy' });
    }
    if (c.electricity && !env.electrolysis) unmet.push({ code: 'tok' });
    for (const re of r.reactants || []) {
      if (re.conc_min_M === undefined && re.conc_max_M === undefined) continue;
      const id = this.db.keyOf(re.species);
      const conc = this.concOf(v, id);
      if (re.conc_min_M !== undefined && conc < re.conc_min_M * 0.8) unmet.push({ code: 'konsentratsiya-past', species: id, need: re.conc_min_M, have: conc });
      if (re.conc_max_M !== undefined && conc > re.conc_max_M) unmet.push({ code: 'konsentratsiya-yuqori', species: id, need: re.conc_max_M, have: conc });
    }
    return unmet;
  }

  /** Idishdagi moddalarga mos keladigan yozuvlar */
  candidateRecords(v) {
    const seen = new Set();
    const out = [];
    for (const [k] of v.contents) {
      const id = k.slice(0, k.lastIndexOf('@'));
      for (const r of this.db.recordsBySpecies?.get(id) || []) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push(r);
      }
    }
    return out;
  }

  #records(v, dt, ev, env) {
    const cands = this.candidateRecords(v);
    v._recordMetals = new Set();
    if (!cands.length) return;
    const groups = new Map();
    for (const r of cands) {
      const m = this.matchRecord(v, r, env);
      if (!m.present) continue;
      const sig = r._net.left.map((t) => t.id).sort().join('+');
      if (!groups.has(sig)) groups.set(sig, []);
      groups.get(sig).push({ r, m });
      // metall aniq yozuv bilan band — umumiy qoida uni ishlatmasin
      for (const t of r._net.left) if (this.db.sub(t.id)?.metal && m.ok) {
        if (r.blocks_rules !== false) v._recordMetals.add(t.id);
      }
    }
    for (const [, list] of groups) {
      const ok = list.filter((x) => x.m.ok);
      if (!ok.length) {
        v._pending = list.map((x) => ({ id: x.r.id, unmet: x.m.unmet }));
        continue;
      }
      ok.sort((a, b) => this.#specificity(b.r) - this.#specificity(a.r) || a.r.id.localeCompare(b.r.id));
      const { r } = ok[0];
      if (r.no_reaction) {
        v._explained = v._explained || {};
        if (!v._explained[r.id]) ev.push({ type: 'no-reaction', record: r.id, reason_uz: r.explanation_uz || r.no_reaction_uz });
        v._explained[r.id] = true;
        continue;
      }
      const xiMax = this.#maxExtent(v, r._net);
      if (xiMax <= 1e-10) continue;
      const tau = this.#recordTau(v, r);
      let xi = xiMax * (1 - Math.exp(-dt / tau));
      if (xiMax - xi < xiMax * 1e-4) xi = xiMax;
      this.#applyEq(v, r._net, xi);
      const heat = HEAT_CLASS_KJ[r.observations?.heat] ?? 0;
      this.addHeat(v, heat * 1000 * xi);
      v.firedRecords[r.id] = (v.firedRecords[r.id] || 0) + xi;
      ev.push({ type: 'record', record: r.id, xi, xiMax });
      this.#emitProductsEvents(v, r._net, xi, ev, { record: r.id });
    }
  }

  #specificity(r) {
    const c = r.conditions || {};
    let s = 0;
    if (c.temp_min_C || c.heating) s += 2 + (c.temp_min_C || 0) / 1000;
    if (c.catalyst) s += 2;
    if (c.medium) s += 1;
    if (c.light) s += 1;
    for (const re of r.reactants || []) if (re.conc_min_M !== undefined || re.conc_max_M !== undefined) s += 1;
    return s;
  }

  #recordTau(v, r) {
    let tau = KINETICS_TAU[r.kinetics] ?? 5;
    const fT = Math.min(Math.pow(2, (v.T - 20) / 10), 4096);
    const c = r.conditions || {};
    const tmin = c.temp_min_C ?? (c.heating ? 60 : null);
    // qizdirishni talab qiladigan reaksiyalar uchun tezlik chegaradan boshlab hisoblanadi
    const fTeff = tmin ? Math.min(Math.pow(2, (v.T - tmin) / 10), 64) : fT;
    tau /= fTeff;
    // qattiq moddalarning maydaligi
    for (const t of r._net.left) {
      if (this.has(v, t.id, 's')) tau /= SURFACE[v.forms[t.id]] ?? 1;
    }
    if (v.stirring) tau /= 1.5;
    return Math.max(tau, 0.05);
  }

  // ---------------------------------------------------- gazlar
  #volatilize(v, dt, ev) {
    const db = this.db;
    const L = this.aqL(v);
    const water = this.waterMol(v);
    // kuchsiz kislota/asos tizimlarining uchuvchan shakllari
    const pHnow = water > 1e-6 ? this.pH(v) : null;
    for (const sys of db.systems.values()) {
      if (!sys.volatile) continue;
      const form = db.keyOf(sys.volatile.form);
      const total = sys.forms.reduce((a, f) => a + this.get(v, f, 'aq'), 0);
      if (total <= EPS) continue;
      // neytral (uchuvchan) shaklning muvozanatdagi miqdori pH bo'yicha
      const idx = sys.forms.indexOf(form);
      const n = pHnow === null ? this.get(v, form, 'aq') : Math.max(this.get(v, form, 'aq'), total * alphas(sys.pKa, pHnow)[idx]);
      if (n <= EPS) continue;
      let excess;
      if (sys.volatile.heat_only) {
        const T = v.T;
        const solFactor = T > 60 ? Math.max(0.02, 1 - (T - 60) / 40) : 1;
        excess = n - sys.volatile.sol_M * L * solFactor;
      } else excess = n - sys.volatile.sol_M * L * Math.max(0.05, 1 - (v.T - 20) / 80);
      if (water < 1e-6) excess = n;
      if (excess <= EPS) continue;
      const d = Math.min(excess * (1 - Math.exp(-dt / 0.6)), total);
      const gas = db.keyOf(sys.volatile.gas);
      if (this.get(v, form, 'aq') >= d) this.add(v, form, 'aq', -d);
      else this.#consumeSystem(v, form, d);
      this.add(v, gas, 'g', d);
      if (sys.volatile.water) this.add(v, WATER, 'aq', sys.volatile.water * d);
      ev.push({ type: 'gas', species: gas, mol: d, rule: 'uchuvchan' });
    }
    // eritmadagi kam eriydigan gazlar (H2, O2, Cl2, CO, NO ...)
    for (const [id, n] of this.inPhase(v, 'aq')) {
      if (n <= EPS || db.isIon(id) || db.formToSystem.has(id)) continue;
      const s = db.sub(id);
      if (!s || s.state !== 'g') continue;
      const ws = s.gas?.water_solubility;
      const sol = { kam: 0.001, "o'rtacha": 0.05, yaxshi: 1, 'juda-yaxshi': 10, reaksiya: 0 }[ws] ?? 0.001;
      const excess = water < 1e-6 ? n : n - sol * L;
      if (excess <= EPS) continue;
      this.add(v, id, 'aq', -excess);
      this.add(v, id, 'g', excess);
    }
  }

  /** Brom va yod organik qatlamga o'tadi (ekstraksiya) */
  #partition(v) {
    if (this.volumeOf(v, 'org') < 1e-4) return;
    for (const id of ['Br2', 'I2']) {
      const n = this.get(v, id, 'aq');
      if (n > EPS) { this.add(v, id, 'aq', -n * 0.95); this.add(v, id, 'org', n * 0.95); }
    }
  }

  // ---------------------------------------------------- issiqlik, qaynash, bug'lanish
  #thermal(v, dt, env, ev) {
    const C = this.heatCapacity(v);
    const amb = env.ambientC ?? this.ambientC;
    const liquidV = this.liquidVolume(v);
    const area = 0.04 + 0.012 * Math.pow(Math.max(liquidV + v.capacity_mL * 0.3, 1), 0.66);
    let P = 0;
    if (env.heater && env.heater.power_W > 0) {
      const maxT = env.heater.maxT ?? 600;
      P = env.heater.power_W * Math.max(0, Math.min(1, (maxT - v.T) / 40));
    }
    const loss = area * (v.T - amb) * (v.T > 300 ? 1.5 : 1);
    let dE = (P - loss) * dt;
    const water = this.waterMol(v);
    // qaynash: suv (100 °C) va boshqa uchuvchan suyuqliklar
    const volatiles = [];
    if (water > 1e-7) {
      // qaynash haroratining ko'tarilishi (konsentrlangan eritmalar, masalan kons. H2SO4) — taxminiy
      let solutes = 0;
      for (const [id, n] of this.inPhase(v, 'aq')) if (id !== WATER) solutes += n;
      const xw = water / (water + solutes);
      const bp = Math.min(100 / Math.sqrt(Math.max(xw, 0.08)), 340);
      volatiles.push({ id: WATER, phase: 'aq', bp, Hv: 40700 });
    }
    for (const ph of ['aq', 'org']) {
      for (const [id, n] of this.inPhase(v, ph)) {
        if (id === WATER || n <= EPS) continue;
        const s = this.db.sub(id);
        if (s?.bp !== undefined && s.bp < 250 && (s.state === 'l' || s.state === 'g')) volatiles.push({ id, phase: ph, bp: s.bp, Hv: 35000 });
      }
    }
    volatiles.sort((a, b) => a.bp - b.bp);
    const Tnew = v.T + dE / C;
    const boiling = volatiles.find((x) => Tnew >= x.bp);
    if (boiling && dE > 0) {
      const toBp = Math.max(0, (boiling.bp - v.T) * C);
      const extra = dE - toBp;
      v.T = boiling.bp;
      if (extra > 0) {
        const n = Math.min(this.get(v, boiling.id, boiling.phase), extra / boiling.Hv);
        this.add(v, boiling.id, boiling.phase, -n);
        this.add(v, boiling.id, 'g', n);
        ev.push({ type: 'boil', species: boiling.id, mol: n, T: v.T });
        if (boiling.id === WATER && this.waterMol(v) < 1e-5) this.#crystallizeAll(v, ev);
      }
    } else {
      v.T = Tnew;
    }
    // to'yingan eritmadan kristallanish (bug'langanda)
    this.#supersaturation(v, ev);
    if (v.T > 1200) v.T = 1200;
    if (v.T < -30) v.T = -30;
  }

  #supersaturation(v, ev) {
    const water = this.waterMol(v);
    if (water < 1e-7) return;
    const L = this.aqL(v);
    // eng ko'p erigan tuzlar: ionlarni juftlab tekshiramiz
    const aq = this.inPhase(v, 'aq');
    const cats = aq.filter(([id, n]) => this.db.isIon(id) && this.db.ions[id].charge > 0 && n > EPS && id !== 'H^+');
    const ans = aq.filter(([id, n]) => this.db.isIon(id) && this.db.ions[id].charge < 0 && n > EPS && id !== 'OH^-');
    for (const [c] of cats) {
      for (const [a] of ans) {
        const salt = this.db.saltOf(c, a);
        if (!salt) continue;
        const s = this.db.sub(salt);
        if (s.solubility !== 'R') continue;
        const st = this.db.saltStoich(salt);
        const n = Math.min(this.get(v, c, 'aq') / st[c], this.get(v, a, 'aq') / st[a]);
        const max = ((s.s_gL ?? 300) / s.M) * L;
        if (n > max * 1.02) {
          const d = n - max;
          this.add(v, c, 'aq', -st[c] * d);
          this.add(v, a, 'aq', -st[a] * d);
          this.add(v, salt, 's', d);
          v.forms[salt] = 'kristall';
          ev.push({ type: 'crystal', species: salt, mol: d });
        }
      }
    }
  }

  #crystallizeAll(v, ev) {
    const aq = this.inPhase(v, 'aq');
    const cats = aq.filter(([id, n]) => this.db.isIon(id) && this.db.ions[id].charge > 0 && n > EPS && id !== 'H^+');
    const ans = aq.filter(([id, n]) => this.db.isIon(id) && this.db.ions[id].charge < 0 && n > EPS);
    for (const [c] of cats) {
      for (const [a] of ans) {
        const salt = this.db.saltOf(c, a);
        if (!salt) continue;
        const st = this.db.saltStoich(salt);
        const n = Math.min(this.get(v, c, 'aq') / st[c], this.get(v, a, 'aq') / st[a]);
        if (n <= EPS) continue;
        this.add(v, c, 'aq', -st[c] * n);
        this.add(v, a, 'aq', -st[a] * n);
        this.add(v, salt, 's', n);
        v.forms[salt] = 'kristall';
        ev.push({ type: 'crystal', species: salt, mol: n });
      }
    }
    // molekulyar erigan moddalar (shakar va h.k.)
    for (const [id, n] of this.inPhase(v, 'aq')) {
      if (this.db.isIon(id) || id === WATER) continue;
      const s = this.db.sub(id);
      if (s?.state === 's') { this.add(v, id, 'aq', -n); this.add(v, id, 's', n); }
    }
  }

  // ------------------------------------------------------------------ elektroliz
  electrolysisStep(v, dt, el, ev) {
    // el: { current_A, anode: 'C'|'Pt'|'Cu'..., cathode: ..., speed }
    const db = this.db;
    const F = 96485;
    const ne = (el.current_A * dt * (el.speed ?? 200)) / F;
    if (ne <= 0 || this.waterMol(v) < 1e-6) return;
    const rules = db.rules.electrolysis;
    // katod
    const cats = this.inPhase(v, 'aq').filter(([id, n]) => db.isIon(id) && db.ions[id].charge > 0 && n > EPS);
    let best = null;
    for (const [id] of cats) {
      const red = db.reducible.find((r) => r.ion === id);
      const E = red ? red.E : -3;
      if (!best || E > best.E) best = { id, E, red };
    }
    const mode = best ? (rules.cathode[best.id] || 'H2') : 'H2';
    let cathodeProduct;
    if ((mode === 'metal' || mode === 'metal+H2') && best?.red) {
      const share = mode === 'metal' ? 1 : 0.6;
      const nMetalE = ne * share;
      const nIon = Math.min(this.get(v, best.id, 'aq'), nMetalE / best.red.e);
      this.add(v, best.id, 'aq', -nIon);
      this.add(v, best.red.to, db.sub(best.red.to)?.metal ? 's' : 'aq', nIon);
      cathodeProduct = best.red.to;
      ev.push({ type: 'electrode', electrode: 'katod', species: best.red.to, mol: nIon, deposit: !!db.sub(best.red.to)?.metal });
      const rest = ne - nIon * best.red.e;
      if (rest > EPS) this.#cathodeH2(v, rest, ev);
    } else {
      this.#cathodeH2(v, ne, ev);
      cathodeProduct = 'H2';
    }
    // anod
    const activeAnode = el.anode && db.sub(el.anode)?.metal && !['Pt', 'C'].includes(el.anode);
    if (activeAnode) {
      const m = db.sub(el.anode).metal;
      const n = ne / m.n;
      this.add(v, m.ion, 'aq', n);
      ev.push({ type: 'electrode', electrode: 'anod', species: m.ion, mol: n, dissolves: el.anode });
    } else {
      const order = rules.anode_priority;
      let done = false;
      for (const an of order) {
        if (an === 'OH^-') break;
        const have = this.get(v, an, 'aq');
        if (have <= EPS) continue;
        const prod = { 'S^2-': 'S', 'I^-': 'I2', 'Br^-': 'Br2', 'Cl^-': 'Cl2' }[an];
        const z = an === 'S^2-' ? 2 : 1;
        const nIon = Math.min(have, ne / z);
        this.add(v, an, 'aq', -nIon);
        const nProd = an === 'S^2-' ? nIon : nIon / 2;
        const ph = prod === 'Cl2' ? 'g' : (prod === 'S' ? 's' : 'aq');
        this.add(v, prod, ph, nProd);
        ev.push({ type: 'electrode', electrode: 'anod', species: prod, mol: nProd });
        if (prod === 'Cl2') ev.push({ type: 'gas', species: 'Cl2', mol: nProd, at: 'anod' });
        done = true;
        break;
      }
      if (!done) {
        const oh = this.get(v, 'OH^-', 'aq');
        const nO2 = ne / 4;
        if (oh >= ne) this.add(v, 'OH^-', 'aq', -ne), this.add(v, WATER, 'aq', ne / 2);
        else { this.add(v, WATER, 'aq', -ne / 2); this.add(v, 'H^+', 'aq', ne); }
        this.add(v, 'O2', 'g', nO2);
        ev.push({ type: 'electrode', electrode: 'anod', species: 'O2', mol: nO2 });
        ev.push({ type: 'gas', species: 'O2', mol: nO2, at: 'anod' });
      }
    }
    void cathodeProduct;
    this.equilibrate(v, ev);
  }

  #cathodeH2(v, ne, ev) {
    const h = this.get(v, 'H^+', 'aq');
    const fromH = Math.min(h, ne);
    this.add(v, 'H^+', 'aq', -fromH);
    const rest = ne - fromH;
    if (rest > 0) { this.add(v, WATER, 'aq', -rest); this.add(v, 'OH^-', 'aq', rest); }
    this.add(v, 'H2', 'g', ne / 2);
    ev.push({ type: 'electrode', electrode: 'katod', species: 'H2', mol: ne / 2 });
    ev.push({ type: 'gas', species: 'H2', mol: ne / 2, at: 'katod' });
  }

  // ------------------------------------------------------------------ o'lchovlar
  pH(v) {
    if (this.waterMol(v) < 1e-6) return null;
    return computePH(this, v);
  }

  /** Elektr o'tkazuvchanlik (nisbiy): kuchli / kuchsiz elektrolit yoki noelektrolit */
  conductivity(v) {
    const water = this.waterMol(v);
    if (water < 1e-6) return { value: 0, level: "yo'q" };
    const L = this.aqL(v);
    const pH = this.pH(v);
    let g = 3.5 * Math.pow(10, -pH) + 2.0 * Math.pow(10, pH - 14);
    for (const [id, n] of this.inPhase(v, 'aq')) {
      if (id === 'H^+' || id === 'OH^-') continue;
      const e = this.db.formToSystem.get(id);
      if (e) {
        // kuchsiz tizim: ionlangan ulushlar pH bo'yicha
        const al = alphas(e.sys.pKa, pH);
        const total = n / L;
        e.sys.forms.forEach((f, i) => { const z = this.db.isIon(f) ? Math.abs(this.db.ions[f].charge) : 0; g += 0.7 * z * al[i] * total / e.sys.forms.length; });
        continue;
      }
      if (!this.db.isIon(id)) continue;
      g += 0.7 * Math.abs(this.db.ions[id].charge) * (n / L);
    }
    const level = g > 0.03 ? 'kuchli' : (g > 3e-4 ? 'kuchsiz' : "yo'q");
    return { value: g, level };
  }

  /**
   * Galvanik element EYuK (Nernst tenglamasi bilan, 25 °C).
   * @param {{anode:string, cathode:string, anodeConc?:number, cathodeConc?:number}} cell metall id'lari
   */
  galvanicEMF(cell) {
    const a = this.db.metals.get(cell.anode), c = this.db.metals.get(cell.cathode);
    if (!a || !c) return null;
    const Ea = a.E + (0.0592 / a.n) * Math.log10(cell.anodeConc ?? 1);
    const Ec = c.E + (0.0592 / c.n) * Math.log10(cell.cathodeConc ?? 1);
    return Math.round((Ec - Ea) * 100) / 100;
  }

  /** Eritma rangi (hex) va loyqalik */
  color(v) {
    return solutionColor(this, v);
  }
  organicColor(v) { return orgColor(this, v); }

  /** Gaz bosimi (yopiq idish uchun), atm */
  pressure(v) {
    const Vhead = Math.max(v.capacity_mL - this.liquidVolume(v) - this.solidVolume(v), 0.5) / 1000;
    let n = 0;
    for (const [, m] of this.inPhase(v, 'g')) n += m;
    const T = v.T + 273.15;
    return (n * 0.082057 * T) / Vhead;
  }

  /** Idish tarkibi — interfeys uchun */
  describe(v) {
    const db = this.db;
    const items = [];
    for (const [k, n] of v.contents) {
      if (n <= 1e-9) continue;
      const at = k.lastIndexOf('@');
      const id = k.slice(0, at), phase = k.slice(at + 1);
      const M = db.molarMass(id) || 0;
      items.push({ id, phase, mol: n, mass_g: n * M, display: db.displayOf(id), name: db.nameOf(id), isIon: db.isIon(id) });
    }
    items.sort((a, b) => b.mass_g - a.mass_g);
    const col = this.color(v);
    return {
      id: v.id,
      T: v.T,
      volume_mL: this.liquidVolume(v),
      aq_mL: this.volumeOf(v, 'aq'),
      org_mL: this.volumeOf(v, 'org'),
      solid_g: this.massOf(v, 's'),
      pH: this.pH(v),
      color: col,
      items,
      pressure_atm: this.pressure(v),
    };
  }

  /** Idishdagi aralashma ma'lum kimyoviy reaksiya bermasa — sababini tushuntirish uchun */
  pendingReasons(v) {
    return v._pending || [];
  }

  // ------------------------------------------------------------------ ko'chirish
  /**
   * Suyuqlikni bir idishdan ikkinchisiga ko'chiradi (quyish, pipetka).
   * Muallaq cho'kma ham ulush bilan ko'chadi (settled = cho'kib bo'lgan ulush).
   * @returns {number} ko'chirilgan hajm, mL
   */
  transfer(from, to, volume_mL, opts = {}) {
    const Vaq = this.volumeOf(from, 'aq');
    const Vorg = this.volumeOf(from, 'org');
    const Vtot = Vaq + Vorg;
    if (Vtot <= 1e-9 || volume_mL <= 0) return 0;
    const vol = Math.min(volume_mL, Vtot);
    // og'dirilganda yuqoridagi qatlam birinchi to'kiladi (organik qatlam yengil bo'lsa)
    const orgOnTop = this.#orgDensity(from) < 1.0;
    let takeOrg, takeAq;
    if (opts.layer === 'bottom') {
      // ajratgich voronka: pastki qatlam
      if (orgOnTop) { takeAq = Math.min(vol, Vaq); takeOrg = Math.min(vol - takeAq, Vorg); } else { takeOrg = Math.min(vol, Vorg); takeAq = Math.min(vol - takeOrg, Vaq); }
    } else if (orgOnTop) { takeOrg = Math.min(vol, Vorg); takeAq = Math.min(vol - takeOrg, Vaq); } else { takeAq = Math.min(vol, Vaq); takeOrg = Math.min(vol - takeAq, Vorg); }
    const heatBefore = this.heatCapacity(to);
    const Tin = from.T;
    const fAq = Vaq > 0 ? takeAq / Vaq : 0;
    const fOrg = Vorg > 0 ? takeOrg / Vorg : 0;
    const settled = opts.settled ?? 0.3;
    const fS = fAq * (1 - settled);
    const moved = [];
    for (const [k, n] of [...from.contents]) {
      const at = k.lastIndexOf('@');
      const id = k.slice(0, at), ph = k.slice(at + 1);
      let f = 0;
      if (ph === 'aq') f = fAq;
      else if (ph === 'org') f = fOrg;
      else if (ph === 's') {
        const s = this.db.sub(id);
        if (s?.metal || ['bo\'lak', 'granula', 'mix', 'sim', 'plastinka', 'lenta'].includes(from.forms[id])) f = 0;
        else f = fS;
      }
      if (f <= 0) continue;
      const d = n * f;
      this.add(from, id, ph, -d);
      this.add(to, id, ph, d);
      moved.push(id);
      if (ph === 's' && from.forms[id]) to.forms[id] = from.forms[id];
    }
    // haroratni aralashtirish
    const Cafter = this.heatCapacity(to);
    const Cin = Cafter - heatBefore;
    if (Cafter > 0) to.T = (heatBefore * to.T + Cin * Tin) / Cafter;
    // konsentrlangan kislotaga suv quyish xavfi
    const ev = [];
    if (this.isConcentratedAcid(to) && moved.includes(WATER) && !this.isConcentratedAcid(from) && this.get(to, WATER, 'aq') > 0) {
      const wasConc = this.isConcentratedAcid(to);
      if (wasConc) { ev.push({ type: 'splash', severity: 'xavfli', code: 'suv-kislotaga' }); }
    }
    to._lastTransferEvents = ev;
    return takeAq + takeOrg;
  }

  #orgDensity(v) {
    let m = 0, vol = 0;
    for (const [id, n] of this.inPhase(v, 'org')) {
      const M = this.db.molarMass(id) || 0;
      m += n * M; vol += (n * M) / this.densityOf(id);
    }
    return vol > 0 ? m / vol : 0.9;
  }
  orgDensity(v) { return this.#orgDensity(v); }

  /** Idishni bo'shatish (yuvish) */
  empty(v) {
    v.contents.clear();
    v.forms = {};
    v.T = this.ambientC;
    v.firedRecords = {};
    v.deposits = {};
    v._pbFilm = 0;
  }

  // ------------------------------------------------------------------ holatni saqlash
  serialize(v) {
    return {
      id: v.id, kind: v.kind, capacity_mL: v.capacity_mL, glass_g: v.glass_g, heatable: v.heatable, T: v.T,
      contents: Object.fromEntries(v.contents), forms: v.forms, closed: v.closed, illuminated: v.illuminated,
      deposits: v.deposits || {}, firedRecords: v.firedRecords,
    };
  }
  deserialize(o) {
    const v = this.createVessel(o);
    v.contents = new Map(Object.entries(o.contents || {}));
    v.forms = o.forms || {};
    v.closed = !!o.closed;
    v.illuminated = !!o.illuminated;
    v.deposits = o.deposits || {};
    v.firedRecords = o.firedRecords || {};
    return v;
  }
}
