// Ma'lumotlar bazasi indeksi: moddalar, ionlar, qoidalar va reaksiyalar.
// DOM'siz: brauzerda fetch bilan, Node'da fs bilan yuklangan JSON obyektlari beriladi.
import { speciesKey, parseEquation, parseFormula, prettyFormula, splitCharge, normalizeFormula } from './formula.js';

/**
 * @typedef {{kind:'substance'|'ion', id:string, data:any}} Entity
 */

export class ChemDB {
  /**
   * @param {{substances:Object, ions:Object, rules:Object, reactions?:any[]}} data
   */
  constructor({ substances, ions, rules, reactions = [] }) {
    this.substances = substances;
    this.ions = ions;
    this.rules = rules;
    this.reactions = [];
    this.reactionById = new Map();
    /** @type {Map<string, string>} formula kaliti -> modda id */
    this.formulaIndex = new Map();
    this.formulaCollisions = [];
    for (const s of Object.values(substances)) {
      if (!s.formula || s.index === false) continue;
      const keys = [s.formula, ...(s.aliases || [])].map((f) => (s.tag ? `${speciesKey(f)}|${s.tag}` : speciesKey(f)));
      for (const k of keys) {
        if (this.formulaIndex.has(k) && this.formulaIndex.get(k) !== s.id) this.formulaCollisions.push([k, this.formulaIndex.get(k), s.id]);
        else this.formulaIndex.set(k, s.id);
      }
    }
    // kislota-asos tizimlari
    this.systems = new Map();
    this.formToSystem = new Map();
    for (const sys of rules.acid_base) {
      if (sys.skip_species) continue;
      const forms = sys.forms.map((f) => this.keyOf(f));
      const entry = { ...sys, forms };
      this.systems.set(sys.id, entry);
      forms.forEach((k, i) => this.formToSystem.set(k, { sys: entry, index: i }));
    }
    this.metals = new Map(rules.metals.map((m) => [m.id, m]));
    this.reducible = rules.reducible_ions || [];
    this.complexes = (rules.complexes || []).map((c) => ({ ...c, parsed: this.parseEq(c.eq) }));
    this.specialPairs = (rules.special_pairs || []).map((p) => ({ ...p, parsed: this.parseEq(p.eq) }));
    this.metalAlkali = (rules.metal_alkali || []).map((p) => ({ ...p, parsed: this.parseEq(p.eq) }));
    this.indicators = new Map((rules.indicators || []).map((i) => [i.id, i]));
    this.saltIndex = this.#buildSaltIndex();
    if (reactions.length) this.addReactions(reactions);
  }

  /** Formula yoki id'ni kontent kalitiga aylantiradi (ion: "SO4^2-", modda: id). */
  keyOf(text) {
    if (this.substances[text]) return text;
    const k = speciesKey(text);
    if (this.ions[k]) return k;
    if (this.formulaIndex.has(k)) return this.formulaIndex.get(k);
    return k;
  }

  /**
   * Tenglamadagi had matnini obyektga bog'laydi.
   * @param {string} formulaText
   * @param {string|null} annot "(fruktoza)" kabi izomer belgisi
   * @returns {Entity|null}
   */
  resolve(formulaText, annot = null) {
    const k = speciesKey(formulaText);
    if (annot) {
      const tagged = `${k}|${annot}`;
      if (this.formulaIndex.has(tagged)) return this.entity(this.formulaIndex.get(tagged));
    }
    if (this.ions[k]) return { kind: 'ion', id: k, data: this.ions[k] };
    if (this.formulaIndex.has(k)) return this.entity(this.formulaIndex.get(k));
    if (this.substances[formulaText]) return this.entity(formulaText);
    return null;
  }

  entity(id) {
    if (this.substances[id]) return { kind: 'substance', id, data: this.substances[id] };
    if (this.ions[id]) return { kind: 'ion', id, data: this.ions[id] };
    return null;
  }

  isIon(id) { return !!this.ions[id]; }
  sub(id) { return this.substances[id]; }

  /** Kontent kaliti uchun molyar massa */
  molarMass(id) {
    const e = this.entity(id);
    return e ? e.data.M : null;
  }

  displayOf(id) {
    const e = this.entity(id);
    if (!e) return id;
    if (e.kind === 'ion') return e.data.display;
    return e.data.display || e.data.name_uz;
  }

  nameOf(id) {
    const e = this.entity(id);
    if (!e) return id;
    return e.data.name_uz;
  }

  /**
   * Tenglamani tahlil qilib, har bir hadni bazadagi obyektga bog'laydi.
   * Polimerlar uchun n=1 olinadi (zveno miqdori).
   */
  parseEq(eq) {
    const p = parseEquation(eq, 1);
    const map = (side) => side.map((t) => {
      const ent = this.resolve(t.formula, t.annot && !/^(kons|konts|suyult|suyultirilgan|konsentrlangan|eritma|aq|q|s|g|l|kr|kristall|qattiq|gaz|suyuq|ortiqcha|yetishmaydi|tuyilgan|kukun|bo'lak|qizdirilgan|t°|t)\.?$/.test(t.annot) ? t.annot : null);
      return { ...t, id: ent ? ent.id : null, kind: ent ? ent.kind : null };
    });
    return { left: map(p.left), right: map(p.right), arrow: p.arrow };
  }

  /** Kation va anion uchun eruvchanlik kodi: R/M/N/- yoki null (jadvalda yo'q) */
  solubility(cat, an) {
    return this.rules.solubility_table[cat]?.[an] ?? null;
  }

  /** Kation va anion juftidan hosil bo'ladigan tuz moddasi */
  saltOf(cat, an) {
    return this.saltIndex.get(`${cat}|${an}`) || null;
  }

  #buildSaltIndex() {
    const idx = new Map();
    for (const s of Object.values(this.substances)) {
      const ions = s.ions || s.dissociation;
      if (!ions) continue;
      const keys = Object.keys(ions).filter((k) => this.ions[k]);
      const cats = keys.filter((k) => this.ions[k].charge > 0);
      const ans = keys.filter((k) => this.ions[k].charge < 0);
      if (cats.length === 1 && ans.length === 1 && keys.length === 2) {
        const key = `${cats[0]}|${ans[0]}`;
        // kristallogidratdan oddiy formulani afzal ko'ramiz
        if (!idx.has(key) || (idx.get(key).includes('·') && !s.id.includes('·'))) idx.set(key, s.id);
      }
    }
    return idx;
  }

  /** Ionlarning tarkibi (cho'kma uchun koeffitsiyentlar) */
  saltStoich(saltId) {
    const s = this.substances[saltId];
    const ions = s?.ions || s?.dissociation;
    if (!ions) return null;
    return ions;
  }

  addReactions(list) {
    for (const r of list) {
      if (this.reactionById.has(r.id)) continue;
      const rec = { ...r };
      try {
        const eqText = r.equation?.ionic_net || r.equation?.molecular;
        rec._net = eqText ? this.parseEq(eqText) : null;
        if (r.no_reaction && r.match) {
          rec._net = { left: r.match.map((x) => ({ coef: 1, formula: x, id: this.keyOf(x) })), right: [], arrow: '=' };
        }
        rec._mol = r.equation?.molecular ? this.parseEq(r.equation.molecular) : null;
      } catch (e) {
        rec._error = e.message;
      }
      this.reactions.push(rec);
      this.reactionById.set(r.id, rec);
    }
    this.recordsBySpecies = new Map();
    for (const r of this.reactions) {
      if (r.engine !== 'record' || !r._net || r._error) continue;
      for (const t of r._net.left) {
        if (!t.id) continue;
        // kislota-asos tizimi a'zosi bo'lsa — tizimning barcha shakllari bo'yicha indekslaymiz
        const se = this.formToSystem.get(t.id);
        const keys = se ? se.sys.forms : [t.id];
        for (const k of keys) {
          if (!this.recordsBySpecies.has(k)) this.recordsBySpecies.set(k, []);
          const arr = this.recordsBySpecies.get(k);
          if (!arr.includes(r)) arr.push(r);
        }
      }
    }
  }

  /** Ion zaryadi */
  chargeOf(id) {
    if (this.ions[id]) return this.ions[id].charge;
    return 0;
  }

  /** Formula atomlari (balans tekshiruvi uchun) */
  atomsOf(id) {
    const e = this.entity(id);
    if (!e || !e.data.formula) return null;
    return parseFormula(e.data.formula, 1).atoms;
  }
}

export { prettyFormula, splitCharge, normalizeFormula };
