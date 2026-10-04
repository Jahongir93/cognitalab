// Yo'riqnomali tajriba: tayyorlash (jihoz va reaktivlarni stolga qo'yish), bosqichlar ro'yxati va ularni
// avtomatik tekshirish (moddalar qo'shildimi, sharoit bajarildimi, natija kuzatildimi), yakuniy natija paneli.
import { h, clear, prettyFormula } from './dom.js';
import { t } from '../i18n/uz.js';
import { parseEquation } from '../engine/formula.js';

const MAIN_VESSELS = ['probirka', 'probirka-yon-naychali', 'kimyoviy-stakan', 'konussimon-kolba', 'yassi-tubli-kolba', 'dumaloq-tubli-kolba', 'vyurs-kolbasi', 'chinni-kosacha', 'tigel', 'yondirish-qoshiqchasi', 'kristallizator', 'petri-kosachasi', 'tomchi-plastinkasi', 'u-simon-naycha', 'elektrolizyor-u', 'gofman-apparati', 'soat-oynasi', 'gaz-silindri', 'chinni-qayiqcha', 'olchov-silindri'];
const SKIP_PLACE = new Set(['tomizgich', 'mor-pipetkasi', 'darajalangan-pipetka', 'shpatel', 'shisha-tayoqcha', 'pinset', 'gugurt', 'kozoynak', 'qolqop', 'xalat', 'tigel-qisqichi', 'probirka-qisqichi', 'filtr-qogoz', 'indikator-qogozi', 'nixrom-sim', 'sekundomer', 'tomizgichli-sklyanka', 'reaktiv-sklyankasi', 'qoramtir-sklyanka']);

export class Guided {
  constructor(root, ctx) {
    this.ctx = ctx; // {bench, chem, db, ix, sim, ui, api, catalog, loadReaction, equipment}
    this.el = h('aside', { class: 'guided card', 'aria-label': t('guided.title'), hidden: true });
    root.appendChild(this.el);
    this.rec = null;
    this.steps = [];
    this.mainId = null;
    this.done = false;
    this.warnings = 0;
    this.collapsed = false;
    setInterval(() => this.check(), 500);
  }

  get active() { return !!this.rec; }

  async start(id) {
    const { ui, api } = this.ctx;
    const rec = await this.ctx.loadReaction(id);
    if (!rec) { ui.toast('danger', `Tajriba topilmadi: ${id}`); return; }
    try {
      const r = await api.startExperiment(id);
      if (r && r.charged) ui.toast('info', `${r.charged} tanga yechildi`);
    } catch (e) { ui.toast('danger', e.message); return; }
    this.rec = rec;
    this.done = false;
    this.warnings = 0;
    this.stage = 'prepare';
    this.t0 = performance.now();
    this.ctx.journal.add({ kind: 'tajriba', text: `Tajriba boshlandi: ${rec.title_uz}`, experiment_id: rec.id });
    this.render();
    this.el.hidden = false;
    if (!ui.ppeOk()) ui.openPPE();
  }

  stop() {
    this.rec = null;
    this.el.hidden = true;
    clear(this.el);
  }

  /** Jihoz va reaktivlarni stolga qo'yish */
  prepare() {
    const { bench, chem, db } = this.ctx;
    const r = this.rec;
    bench.clear();
    this.ctx.effects.reset();
    const app = (r.apparatus || []).filter((a) => bench.def(a));
    const totalV = (r.reactants || []).reduce((a, x) => a + (x.volume_mL || (x.state === 'aq' || x.state === 'l' ? 2 : 0)), 0);
    let mainDef = app.find((a) => MAIN_VESSELS.includes(a)) || (totalV > 15 ? 'kimyoviy-stakan' : 'probirka');
    let size;
    if (mainDef === 'kimyoviy-stakan') size = totalV > 150 ? '600' : totalV > 60 ? '250' : '100';
    const main = bench.add(mainDef, { sizeId: size, x: 0.0, z: bench.scene ? -0.95 + 0.12 : 0 });
    this.mainId = main.id;
    let x = -0.42;
    const z = -0.95 - 0.1;
    for (const re of r.reactants || []) {
      const id = db.keyOf(re.species);
      const s = db.sub(id);
      if (!s) continue;
      const reagent = { id };
      let defId = 'reaktiv-sklyankasi';
      if (re.state === 'aq' && !s.mixture && !s.mixture_opaque && s.state !== 'l') {
        reagent.conc_M = re.conc_M ?? s.solutions?.[0]?.conc_M ?? 0.1;
        reagent.as = 'solution';
        reagent.volume_mL = 100;
        defId = s.storage === 'qoramtir-sklyanka' ? 'qoramtir-sklyanka' : 'tomizgichli-sklyanka';
      } else if (re.state === 'aq' || re.state === 'l') {
        reagent.as = 'liquid';
        reagent.volume_mL = 100;
        defId = s.storage === 'qoramtir-sklyanka' ? 'qoramtir-sklyanka' : 'tomizgichli-sklyanka';
      } else if (re.state === 'g') {
        reagent.as = 'gas';
        defId = 'gaz-silindri';
      } else {
        reagent.as = 'solid';
        reagent.mass_g = 20;
        reagent.form = re.form || s.forms?.[0] || s.appearance?.form;
      }
      if (!bench.def(defId)) defId = 'reaktiv-sklyankasi';
      bench.add(defId, { x, z, reagent });
      x += 0.085;
    }
    // qizdirish va katalizator
    const c = r.conditions || {};
    const cats = c.catalyst ? (Array.isArray(c.catalyst) ? c.catalyst : [c.catalyst]) : [];
    for (const cat of cats) {
      const id = db.keyOf(cat);
      const s = db.sub(id);
      if (!s || (r.reactants || []).some((re) => db.keyOf(re.species) === id)) continue;
      const solid = s.state === 's';
      bench.add(solid ? 'reaktiv-sklyankasi' : 'tomizgichli-sklyanka', { x, z, reagent: solid ? { id, as: 'solid', mass_g: 10 } : { id, conc_M: s.solutions?.[0]?.conc_M, as: s.solutions ? 'solution' : 'liquid', volume_mL: 50 } });
      x += 0.085;
    }
    // qo'shimcha jihozlar (ro'yxatdan)
    let placed = 0;
    for (const a of app) {
      if (a === mainDef || SKIP_PLACE.has(a) || placed >= 5) continue;
      if ([...bench.items.values()].some((i) => i.def.id === a)) continue;
      try { bench.add(a); placed++; } catch { /* e'tiborsiz */ }
    }
    if ((c.heating || c.temp_min_C) && ![...bench.items.values()].some((i) => i.model.heater)) {
      bench.add(main.def.builder === 'probirka' ? 'spirt-lampasi' : 'elektr-plitka', { x: 0.2, z: -0.95 + 0.1 });
    }
    void chem;
    this.stage = 'run';
    this.#buildSteps();
    this.ctx.journal.add({ kind: 'amal', text: "Jihozlar va reaktivlar stolga qo'yildi" });
    this.render();
    this.ctx.ix.select(main);
    this.ctx.scene.focusOn(main.group.position.clone().setY(0.98), 0.75);
  }

  #buildSteps() {
    const { db } = this.ctx;
    const r = this.rec;
    const steps = [];
    for (const re of r.reactants || []) {
      const id = db.keyOf(re.species);
      const s = db.sub(id);
      const name = s?.name_uz || re.species;
      const amt = re.volume_mL ? `${re.volume_mL} ml` : re.mass_g ? `${re.mass_g} g` : (re.state === 'aq' ? '1–2 ml' : 'ozgina');
      steps.push({ kind: 'add', species: id, text: `Reaksiya idishiga ${name}${re.conc_M ? ` (${re.conc_M} M)` : ''} qo'shing — ${amt}.` });
    }
    const c = r.conditions || {};
    const tmin = c.temp_min_C ?? (c.heating ? 60 : null);
    if (tmin) steps.push({ kind: 'heat', need: tmin, text: `Aralashmani qizdiring (taxminan ${tmin} °C gacha).` });
    if (c.catalyst) steps.push({ kind: 'catalyst', text: `Katalizator qo'shing: ${(Array.isArray(c.catalyst) ? c.catalyst : [c.catalyst]).map((x) => db.nameOf(db.keyOf(x))).join(', ')}.` });
    if (c.light) steps.push({ kind: 'light', text: "Idishni yoriting (\"Yoritish\" tugmasi)." });
    if (c.ignition) steps.push({ kind: 'ignite', text: 'Moddani yondiring ("Yondirish" tugmasi).' });
    if (c.electricity) steps.push({ kind: 'current', text: "Elektrodlarni tok manbaiga ulang va tokni yoqing." });
    steps.push({ kind: 'result', text: r.no_reaction ? "Kuzating: reaksiya boradimi?" : 'Reaksiyani kuzating va natijani qayd eting.' });
    this.steps = steps.map((s) => ({ ...s, done: false }));
    this.products = this.#productIds();
  }

  #productIds() {
    const r = this.rec;
    const eq = r.equation?.ionic_net || r.equation?.molecular;
    if (!eq) return [];
    try {
      const p = parseEquation(eq);
      return p.right.map((x) => this.ctx.db.keyOf(x.formula)).filter((id) => id && id !== 'H2O');
    } catch { return []; }
  }

  /** Reaksiya o'tkaziladigan idishlar (reaktiv sklyankalaridan tashqari) */
  #vessels() {
    return [...this.ctx.bench.items.values()].filter((i) => i.vessel && !i.vessel.isReagentBottle);
  }

  #present(v, id) {
    const { chem, db } = this.ctx;
    for (const k of v.contents.keys()) if (k.startsWith(`${id}@`)) return true;
    const s = db.sub(id);
    if (s?.dissociation) {
      // reaksiyada sarflanmaydigan ionlardan biri (masalan, NaOH uchun Na⁺) bo'lsa — modda qo'shilgan
      let ions = Object.keys(s.dissociation).filter((x) => !['H^+', 'OH^-', 'H2O'].includes(x));
      if (!ions.length) ions = Object.keys(s.dissociation).filter((x) => x !== 'H2O');
      const has = (ion) => chem.get(v, ion, 'aq') > 1e-9 || chem.get(v, ion, 's') > 1e-9 || (db.formToSystem.get(ion)?.sys.forms || []).some((f) => chem.get(v, f, 'aq') > 1e-9);
      if (ions.some(has)) return true;
    }
    if (s?.dissolve_molecular) return Object.keys(s.dissolve_molecular).some((x) => chem.get(v, x, 'aq') > 1e-9);
    try { return chem.concOf(v, id) > 1e-7; } catch { return false; }
  }

  check() {
    if (!this.rec || this.stage !== 'run' || this.done) return;
    const r = this.rec;
    const vs = this.#vessels();
    const fired = vs.some((i) => (i.vessel.firedRecords?.[r.id] || 0) > 0);
    let changed = false;
    const mark = (s, v) => { if (v && !s.done) { s.done = true; changed = true; } };
    for (const s of this.steps) {
      if (s.kind === 'add') mark(s, fired || vs.some((i) => this.#present(i.vessel, s.species)));
      if (s.kind === 'heat') mark(s, fired || vs.some((i) => i.vessel.T >= s.need - 3));
      if (s.kind === 'light') mark(s, fired || vs.some((i) => i.vessel.illuminated));
      if (s.kind === 'ignite') mark(s, fired || vs.some((i) => i.vessel.ignited));
      if (s.kind === 'catalyst') mark(s, fired);
      if (s.kind === 'current') mark(s, fired || [...this.ctx.bench.items.values()].some((i) => i.def.id === 'tok-manbai' && i.heaterOn));
    }
    const res = this.steps.find((s) => s.kind === 'result');
    const prior = this.steps.filter((s) => s !== res).every((s) => s.done);
    if (!res.done) {
      let ok = fired;
      if (!ok && prior) {
        // umumiy qoidalar bilan ketgan reaksiya: mahsulotlardan biri paydo bo'ldi yoki ajralib chiqdi
        ok = vs.some((i) => this.products.some((p) => this.#present(i.vessel, p) || (i._released?.[p] || 0) > 1e-7));
        if (!ok && r.no_reaction) {
          this._nrT = this._nrT || performance.now();
          ok = performance.now() - this._nrT > 3000;
        }
      }
      if (ok) { this._obsT = this._obsT || performance.now(); if (performance.now() - this._obsT > 2500) mark(res, true); }
    }
    if (changed) {
      this.render();
      if (res.done) this.finish();
    }
  }

  noteWarning() { if (this.rec) this.warnings++; }

  async finish() {
    if (this.done) return;
    this.done = true;
    const r = this.rec;
    const score = Math.max(40, 100 - this.warnings * 10);
    try { await this.ctx.api.saveProgress(r.id, true, score); } catch { /* lokal rejimda ham saqlanadi */ }
    this.ctx.journal.add({ kind: 'natija', text: `Tajriba yakunlandi: ${r.title_uz}. Kuzatish: ${r.observations?.text_uz || ''}`, equation: r.equation?.molecular, experiment_id: r.id });
    this.render();
    this.ctx.ui.toast('success', t('guided.finished'));
  }

  render() {
    const el = clear(this.el);
    const r = this.rec;
    if (!r) return;
    const head = h('header', { class: 'guided-head' },
      h('div', {}, h('div', { class: 'eyebrow' }, t('mode.guided')), h('h2', { class: 'guided-title' }, r.title_uz),
        h('div', { class: 'chips' }, h('span', { class: 'chip' }, r.level || ''), r.confidence === "o'rta" ? h('span', { class: 'chip warn', title: t('catalog.confidenceMid') }, t("confidence.o'rta")) : null)),
      h('div', { class: 'row' },
        h('button', { class: 'icon-btn', title: this.collapsed ? "Ochish" : "Yig'ish", 'aria-label': "Yig'ish", onclick: () => { this.collapsed = !this.collapsed; this.el.classList.toggle('collapsed', this.collapsed); } }, this.collapsed ? '▸' : '▾'),
        h('button', { class: 'icon-btn', title: t('common.close'), 'aria-label': t('common.close'), onclick: () => this.stop() }, '×')));
    el.appendChild(head);
    const body = h('div', { class: 'guided-body' });
    el.appendChild(body);
    if (this.stage === 'prepare') {
      body.appendChild(h('h3', {}, t('guided.need')));
      const ul = h('ul', { class: 'need' });
      for (const re of r.reactants || []) {
        const id = this.ctx.db.keyOf(re.species);
        ul.appendChild(h('li', {}, h('b', {}, prettyFormula(this.ctx.db.displayOf(id))), ' — ', this.ctx.db.nameOf(id), re.conc_M ? ` (${re.conc_M} M)` : '', re.form ? `, ${re.form}` : ''));
      }
      for (const a of r.apparatus || []) { const d = this.ctx.bench.def(a); if (d) ul.appendChild(h('li', { class: 'muted' }, d.name_uz)); }
      body.appendChild(ul);
      if (r.conditions?.note_uz) body.appendChild(h('p', { class: 'small' }, r.conditions.note_uz));
      body.appendChild(h('div', { class: 'safety' }, h('b', {}, `${t('guided.safety')}: `), r.safety_uz || "Umumiy xavfsizlik qoidalariga rioya qiling."));
      body.appendChild(h('button', { class: 'btn primary block', onclick: () => this.prepare() }, t('guided.autoPlace')));
      return;
    }
    // bosqichlar
    body.appendChild(h('h3', {}, t('guided.title')));
    const ol = h('ol', { class: 'steps' });
    for (const s of this.steps) ol.appendChild(h('li', { class: s.done ? 'done' : '' }, h('span', { class: 'tick', 'aria-label': s.done ? t('guided.done') : t('guided.notYet') }, s.done ? '✓' : ''), h('span', {}, s.text)));
    body.appendChild(ol);
    if (r.procedure_uz?.length) {
      body.appendChild(h('details', { open: !this.done }, h('summary', {}, "Ish tartibi (darslik bo'yicha)"), h('ol', { class: 'proc' }, r.procedure_uz.map((p) => h('li', {}, p)))));
    }
    body.appendChild(h('div', { class: 'safety small' }, h('b', {}, `${t('guided.safety')}: `), r.safety_uz || ''));
    body.appendChild(h('p', { class: 'small muted' }, "Maslahat: idishni tanlang — pastdagi kartada \"Quyish\", \"Tomizish\", \"Qizdirish\" kabi amallar bor. Quyishda nishon idishni bosing."));
    if (this.done) {
      const res = h('div', { class: 'result' },
        h('h3', {}, t('guided.result')),
        h('p', {}, h('b', {}, `${t('guided.observation')}: `), r.observations?.text_uz || ''),
        r.equation?.molecular ? h('p', { class: 'eq' }, prettyFormula(r.equation.molecular)) : null,
        r.equation?.ionic_net && r.equation.ionic_net !== r.equation.molecular ? h('p', { class: 'eq muted' }, prettyFormula(r.equation.ionic_net)) : null,
        h('p', {}, h('b', {}, `${t('guided.explanation')}: `), r.explanation_uz || ''),
        h('button', { class: 'btn', onclick: () => this.ctx.ui.openMechanism(r) }, t('guided.mechanism')),
        r.questions_uz?.length ? h('div', {}, h('h4', {}, t('guided.questions')), h('ol', {}, r.questions_uz.map((q) => h('li', {}, q)))) : null,
        h('div', { class: 'row gap' }, h('button', { class: 'btn primary', onclick: () => { this.stage = 'prepare'; this.done = false; this.render(); } }, t('guided.restart'))));
      body.appendChild(res);
    }
  }
}
