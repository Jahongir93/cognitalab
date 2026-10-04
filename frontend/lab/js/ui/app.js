// Interfeys: asboblar paneli, yon panellar (katalog, reaktivlar, jihozlar, andozalar, jurnal, sozlamalar),
// inspektor, yo'riqnomali rejim, xabarlar, modal oynalar (doza, himoya vositalari, mexanizm, saqlash).
import { h, clear, icon, prettyFormula, download } from './dom.js';
import { t } from '../i18n/uz.js';
import { Inspector } from './inspector.js';
import { Guided } from './guided.js';
import { Journal } from './journal.js';
import { QUALITY, saveQuality } from '../scene/quality.js';
import { setSoundEnabled, soundEnabled } from '../scene/effects/audio.js';

const PREFS = 'cognita-lab:prefs';
const HAZ_ICON = { korroziv: '⚗', zaharli: '☠', yonuvchan: '🔥', oksidlovchi: '◎', zararli: '!', 'atrof-muhit': '🌿', kanserogen: '⚠', bosim: '⊙', 'portlash-xavfi': '✸' };

function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREFS) || '{}'); } catch { return {}; } }
function savePrefs(p) { try { localStorage.setItem(PREFS, JSON.stringify(p)); } catch { /* e'tiborsiz */ } }

export class LabUI {
  constructor(root, ctx) {
    this.root = root;
    this.ctx = ctx; // {scene, bench, chem, db, sim, ix, effects, api, catalog, equipment, templates, mechanisms, loadReaction}
    this.prefs = { theme: 'auto', sound: false, speed: 1, bigUi: false, ...loadPrefs() };
    this.applyPrefs();
    this.journal = new Journal(ctx.api);
    ctx.journal = this.journal;
    ctx.ui = this;
    this.#build();
    this.inspector = new Inspector(this.dock, ctx);
    this.guided = new Guided(this.root, ctx);
    this.#wire();
  }

  // ----------------------------------------------------------------- sozlamalar
  applyPrefs() {
    const p = this.prefs;
    const rootEl = document.documentElement;
    if (p.theme === 'auto') rootEl.removeAttribute('data-theme'); else rootEl.setAttribute('data-theme', p.theme);
    rootEl.classList.toggle('big-ui', !!p.bigUi);
    setSoundEnabled(!!p.sound);
    if (this.ctx.sim) this.ctx.sim.speed = p.speed || 1;
    const dark = p.theme === 'dark' || (p.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    this.ctx.scene.scene.background?.set(dark ? 0x1a212c : 0xd9dee5);
    savePrefs(p);
  }

  ppeOk() { return !!this.ppe?.kozoynak && !!this.ppe?.qolqop && !!this.ppe?.xalat; }

  // ----------------------------------------------------------------- tuzilma
  #build() {
    const R = this.root;
    const tb = h('header', { class: 'toolbar', role: 'toolbar', 'aria-label': t('app.title') });
    const brand = h('div', { class: 'brand' }, icon('atom', 22), h('span', { class: 'brand-text' }, t('app.short')));
    this.modeBtn = h('div', { class: 'seg', role: 'group', 'aria-label': 'Rejim' },
      h('button', { class: 'seg-btn', 'data-mode': 'free', 'aria-pressed': 'true', 'aria-label': t('mode.free'), onclick: () => this.setMode('free') }, h('span', { class: 'seg-long' }, t('mode.free')), h('span', { class: 'seg-short' }, t('mode.freeShort'))),
      h('button', { class: 'seg-btn', 'data-mode': 'guided', 'aria-pressed': 'false', 'aria-label': t('mode.guided'), onclick: () => this.setMode('guided') }, h('span', { class: 'seg-long' }, t('mode.guided')), h('span', { class: 'seg-short' }, t('mode.guidedShort'))));
    const tbtn = (key, ic, fn, extra = {}) => h('button', { class: 'tb-btn', title: t(key), 'aria-label': t(key), onclick: fn, ...extra }, icon(ic), h('span', { class: 'tb-label' }, t(key)));
    this.tbButtons = {
      catalog: tbtn('toolbar.catalog', 'book', () => this.openPanel('catalog')),
      reagents: tbtn('toolbar.reagents', 'bottle', () => this.openPanel('reagents')),
      equipment: tbtn('toolbar.equipment', 'flask', () => this.openPanel('equipment')),
      templates: tbtn('toolbar.templates', 'tools', () => this.openPanel('templates')),
      journal: tbtn('toolbar.journal', 'journal', () => this.openPanel('journal')),
    };
    const right = h('div', { class: 'tb-right' },
      tbtn('toolbar.save', 'save', () => this.openSaveLoad()),
      tbtn('toolbar.reset', 'trash', () => this.resetBench()),
      tbtn('toolbar.view', 'eye', () => this.ctx.scene.resetView()),
      tbtn('toolbar.settings', 'gear', () => this.openPanel('settings')),
      tbtn('toolbar.help', 'help', () => this.openHelp()));
    tb.append(brand, this.modeBtn, h('nav', { class: 'tb-main' }, Object.values(this.tbButtons)), right);
    R.appendChild(tb);
    this.drawer = h('aside', { class: 'drawer', hidden: true, 'aria-live': 'polite' });
    R.appendChild(this.drawer);
    this.dock = h('div', { class: 'dock' });
    R.appendChild(this.dock);
    this.toasts = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    R.appendChild(this.toasts);
    this.banner = h('div', { class: 'banner', hidden: true });
    R.appendChild(this.banner);
    this.pourBar = h('div', { class: 'pourbar card', hidden: true });
    R.appendChild(this.pourBar);
    this.modalLayer = h('div', { class: 'modal-layer', hidden: true, onclick: (e) => { if (e.target === this.modalLayer) this.closeModal(); } });
    R.appendChild(this.modalLayer);
    this.hud = h('div', { class: 'hud small' });
    R.appendChild(this.hud);
  }

  #wire() {
    const { sim, ix, bench } = this.ctx;
    ix.addEventListener('select', (e) => this.inspector.show(e.detail.item));
    ix.addEventListener('message', (e) => this.toastKey(e.detail.kind, e.detail.key, e.detail.params));
    ix.addEventListener('journal', (e) => this.journal.add(e.detail));
    ix.addEventListener('zone', (e) => {
      const z = e.detail.zone;
      if (z === 'cabinet') this.openPanel('equipment');
      else if (z === 'shelf') this.openPanel('reagents');
      else if (z === 'sink') this.toast('info', "Rakovina: idishni shu yerga sudrab olib keling — u yuviladi.");
      else if (z === 'waste') this.toast('info', "Chiqindi idishi: idishni stolning chap chetiga sudrang — ichidagisi chiqindiga to'kiladi.");
      else if (z === 'hood') this.toast('info', "Mo'rili shkaf: zaharli gaz ajraladigan tajribalarni shu yerda o'tkazing.");
    });
    ix.addEventListener('pending', (e) => this.#banner(e.detail));
    ix.addEventListener('pour', (e) => this.#pourUI(e.detail));
    bench.addEventListener('message', (e) => this.toastKey(e.detail.kind, e.detail.key, e.detail.params));
    sim.addEventListener('message', (e) => {
      this.toastKey(e.detail.kind, e.detail.key, e.detail.params);
      if (e.detail.kind === 'danger' || e.detail.kind === 'warn') {
        this.journal.add({ kind: 'ogohlantirish', text: t(e.detail.key, e.detail.params) });
        if (e.detail.kind === 'danger') this.guided.noteWarning();
      }
    });
    sim.addEventListener('reaction', (e) => {
      const r = e.detail.record;
      this.toast('success', t('info.reactionStarted', { title: r.title_uz }), { action: { label: t('guided.mechanism'), fn: () => this.openMechanismById(r.id) } });
      this.journal.add({ kind: 'reaksiya', text: `${r.title_uz} (${e.detail.item.def.name_uz})`, equation: r.equation?.molecular, experiment_id: r.id });
    });
    sim.addEventListener('rule', (e) => {
      const ev = e.detail.event;
      const db = this.ctx.db;
      let text = null;
      if (ev.type === 'acid-base' && ev.water) text = 'Neytrallanish: H⁺ + OH⁻ → H₂O';
      else if (ev.type === 'displacement') text = `${db.nameOf(ev.metal)} ${db.displayOf(ev.ion)} ionlarini siqib chiqarmoqda → ${db.nameOf(ev.to)} ajraladi`;
      else if (ev.type === 'metal-acid') text = `${db.nameOf(ev.metal)} kislota bilan reaksiyaga kirishmoqda: vodorod ajraladi`;
      else if (ev.type === 'metal-water') text = `${db.nameOf(ev.metal)} suv bilan reaksiyaga kirishmoqda`;
      else if (ev.type === 'acid-dissolve') text = `${db.nameOf(ev.species)} kislotada erimoqda`;
      else if (ev.eq) text = ev.note_uz ? `${ev.note_uz}` : 'Reaksiya';
      if (text) this.journal.add({ kind: 'reaksiya', text, equation: ev.eq });
    });
    sim.addEventListener('observation', (e) => {
      const d = e.detail;
      const db = this.ctx.db;
      if (d.kind === 'precipitate') {
        const s = db.sub(d.species);
        const msg = `${s?.name_uz || d.species} cho'kmasi tushdi${s?.appearance?.desc_uz ? ` — ${s.appearance.desc_uz}` : ''}`;
        this.toast('info', msg, { swatch: d.color });
        this.journal.add({ kind: 'kuzatish', text: msg });
      }
      if (d.kind === 'crystal') this.journal.add({ kind: 'kuzatish', text: `Eritmadan ${db.nameOf(d.species)} kristallari ajraldi` });
    });
    sim.addEventListener('noreaction', (e) => {
      const reasons = e.detail.reasons || [];
      this.toast('warn', `${t('info.noReaction')}. ${reasons[0] || ''}`, { long: true });
      this.journal.add({ kind: 'kuzatish', text: `${t('info.noReaction')} (${e.detail.item.def.name_uz}). ${t('info.why')}: ${reasons.join(' ')}` });
    });
    // HUD: kadr tezligi va vaqt tezligi
    setInterval(() => {
      const fps = this.ctx.scene.fps.fps;
      this.hud.textContent = `${this.ctx.scene.quality.id === 'orta' ? "o'rta" : this.ctx.scene.quality.id} · ${fps.toFixed(0)} FPS · ×${this.prefs.speed}`;
    }, 1000);
  }

  setMode(m) {
    for (const b of this.modeBtn.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.mode === m));
    this.mode = m;
    if (m === 'guided') this.openPanel('catalog');
    else this.guided.stop();
  }

  // ----------------------------------------------------------------- xabarlar
  toastKey(kind, key, params) { this.toast(kind, t(key, params)); }

  toast(kind, text, opts = {}) {
    const last = this.toasts.lastElementChild;
    if (last && last.dataset.text === text) return;
    const el = h('div', { class: `toast ${kind}`, dataset: { text } },
      opts.swatch ? h('span', { class: 'swatch', style: { background: opts.swatch } }) : null,
      h('span', { class: 'toast-text' }, text),
      opts.action ? h('button', { class: 'link', onclick: () => { opts.action.fn(); el.remove(); } }, opts.action.label) : null,
      h('button', { class: 'icon-btn small', 'aria-label': t('common.close'), onclick: () => el.remove() }, '×'));
    this.toasts.appendChild(el);
    while (this.toasts.children.length > 4) this.toasts.firstElementChild.remove();
    setTimeout(() => el.remove(), kind === 'danger' || opts.long ? 9000 : 5000);
  }

  toastSwatch(text, color) { this.toast('info', text, { swatch: color }); }

  #banner(p) {
    if (!p) { this.banner.hidden = true; return; }
    clear(this.banner);
    const label = { pour: t('pour.target'), drops: t('dose.chooseTarget'), pipette: t('dose.chooseTarget'), spatula: t('dose.chooseTarget'), gas: t('dose.chooseTarget') }[p.action] || t('info.selectTarget');
    this.banner.append(h('span', {}, label), h('button', { class: 'btn small', onclick: () => this.ctx.ix.cancelPending() }, t('common.cancel')));
    this.banner.hidden = false;
  }

  // ----------------------------------------------------------------- quyish va dozalar
  async beginPour(src) {
    const c = this.ctx.ix.canPour(src);
    if (!c.ok) { this.toast('warn', c.reason); return; }
    const tgt = await this.ctx.ix.awaitTarget(src, 'pour');
    if (!tgt) return;
    if (!tgt.vessel) { this.toast('warn', "Bu jihozga quyib bo'lmaydi"); return; }
    this.ctx.ix.startPour(src, tgt);
  }

  #pourUI(d) {
    const ix = this.ctx.ix;
    if (d.state === 'start') {
      clear(this.pourBar);
      const val = h('output', { class: 'pour-val' }, '0°');
      const amount = h('output', { class: 'pour-amount' }, '0 ml');
      const slider = h('input', { type: 'range', min: '0', max: '135', step: '1', value: '0', 'aria-label': t('pour.angle'), oninput: (e) => { ix.setPourAngle(Number(e.target.value)); val.textContent = `${e.target.value}°`; } });
      this.pourAmount = amount;
      this.pourBar.append(
        h('div', { class: 'pour-title' }, `${t('pour.title')}: ${d.src.def.name_uz} → ${d.tgt.def.name_uz}`),
        h('label', { class: 'pour-row' }, h('span', {}, t('pour.angle')), slider, val),
        h('div', { class: 'row gap' }, amount, h('span', { class: 'muted small' }, "Burchak qancha katta bo'lsa, shuncha tez quyiladi"), h('button', { class: 'btn primary', onclick: () => ix.endPour() }, t('guided.done'))));
      this.pourBar.hidden = false;
      slider.focus();
    } else if (d.state === 'flow') {
      if (this.pourAmount) this.pourAmount.textContent = `${d.poured.toFixed(1)} ml`;
    } else if (d.state === 'end') {
      this.pourBar.hidden = true;
    }
  }

  async beginDose(src, mode) {
    const tgt = await this.ctx.ix.awaitTarget(src, mode);
    if (!tgt) return;
    if (!tgt.vessel) { this.toast('warn', "Bu jihozga qo'shib bo'lmaydi"); return; }
    const presets = { drops: [1, 2, 5, 10, 20], pipette: [0.5, 1, 2, 5, 10], spatula: [0.05, 0.1, 0.5, 1, 2], gas: [10, 25, 50, 100] }[mode];
    const unit = { drops: t('dose.drops'), pipette: t('dose.ml'), spatula: t('dose.g'), gas: t('dose.ml') }[mode];
    const input = h('input', { type: 'number', min: '0', step: mode === 'drops' ? '1' : '0.05', value: String(presets[1]), class: 'input', 'aria-label': t('dose.title') });
    const go = (v) => { this.closeModal(); this.ctx.ix.dose(src, tgt, mode, Number(v)); };
    this.openModal(t('dose.title'), h('div', {},
      h('p', { class: 'small muted' }, `${t('dose.from')}: ${src.def.name_uz} → ${t('dose.to')}: ${tgt.def.name_uz}`),
      h('div', { class: 'chips' }, presets.map((p) => h('button', { class: 'chip-btn', onclick: () => go(p) }, `${p} ${unit}`))),
      h('div', { class: 'row gap' }, input, h('span', {}, unit), h('button', { class: 'btn primary', onclick: () => go(input.value) }, t('dose.ok')))));
    input.focus();
  }

  askWater(it) {
    const go = (v) => { this.closeModal(); this.ctx.ix.addWater(it, v); };
    this.openModal(t('inspector.water'), h('div', { class: 'chips' }, [1, 2, 5, 10, 20, 50, 100].map((v) => h('button', { class: 'chip-btn', onclick: () => go(v) }, `${v} ml`))));
  }

  // ----------------------------------------------------------------- modal
  openModal(title, body, { wide = false } = {}) {
    clear(this.modalLayer);
    const dlg = h('div', { class: `modal card ${wide ? 'wide' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('header', { class: 'modal-head' }, h('h2', {}, title), h('button', { class: 'icon-btn', 'aria-label': t('common.close'), onclick: () => this.closeModal() }, '×')),
      h('div', { class: 'modal-body' }, body));
    this.modalLayer.appendChild(dlg);
    this.modalLayer.hidden = false;
    this._modalKey = (e) => { if (e.key === 'Escape') this.closeModal(); };
    window.addEventListener('keydown', this._modalKey);
    return dlg;
  }

  closeModal() {
    this.modalLayer.hidden = true;
    this._mech?.destroy?.();
    this._mech = null;
    clear(this.modalLayer);
    window.removeEventListener('keydown', this._modalKey);
  }

  openPPE() {
    this.ppe = this.ppe || {};
    const boxes = ['kozoynak', 'qolqop', 'xalat'].map((k) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!this.ppe[k], onchange: (e) => { this.ppe[k] = e.target.checked; } }), t(`guided.ppe.${k}`)));
    this.openModal(t('guided.safetyCheck'), h('div', {}, h('p', {}, t('warn.ppe')), ...boxes,
      h('div', { class: 'row gap' }, h('button', { class: 'btn primary', onclick: () => { this.closeModal(); if (!this.ppeOk()) this.toastKey('warn', 'warn.ppe'); else this.journal.add({ kind: 'amal', text: "Himoya vositalari kiyildi (ko'zoynak, qo'lqop, xalat)" }); } }, t('common.ok')))));
  }

  async openMechanismById(id) {
    const r = await this.ctx.loadReaction(id);
    if (r) this.openMechanism(r);
  }

  async openMechanism(record) {
    const box = h('div', { class: 'mech-host' });
    this.openModal(`${t('mechanism.title')}: ${record.title_uz}`, box, { wide: true });
    try {
      const m = await import('./mechanism.js');
      this._mech = m.renderMechanism(box, record, this.ctx.mechanisms, { db: this.ctx.db });
    } catch (e) {
      console.warn(e);
      box.append(h('p', { class: 'eq' }, prettyFormula(record.equation?.molecular || '')), record.equation?.ionic_net ? h('p', { class: 'eq' }, prettyFormula(record.equation.ionic_net)) : null, h('p', {}, record.explanation_uz || ''));
    }
  }

  openHelp() {
    this.openModal(t('toolbar.help'), h('div', { class: 'help' },
      h('ul', {},
        h('li', {}, "Kamerani aylantirish — bo'sh joyni sudrang; yaqinlashtirish — g'ildirak yoki ikki barmoq; surish — o'ng tugma yoki ikki barmoq."),
        h('li', {}, "Jihozni tanlash — ustiga bosing; ikki marta bosish — unga yaqinlashish."),
        h('li', {}, "Jihozni ko'chirish — sudrang. Mos ulanish nuqtasi yaqinida yashil belgilar va ko'k oldindan ko'rinish chiqadi; qo'yib yuborsangiz joyiga o'tiradi (tiqin bo'g'izga, naycha tiqin teshigiga, kolba qisqichga, idish plitkaga)."),
        h('li', {}, "Quyish — idishni tanlab \"Quyish\"ni bosing, keyin nishon idishni bosing va og'ish burchagini sozlang."),
        h('li', {}, "Idishni rakovinaga sudrasangiz yuviladi; stolning chap chetiga sudrasangiz ichidagisi chiqindiga to'kiladi."),
        h('li', {}, "Reaksiya bormasa, sababi xabarda va jurnalda yoziladi."),
        h('li', {}, "Klaviatura: Esc — bekor qilish, Delete — tanlangan jihozni olib qo'yish, ↑/↓ — quyish burchagi.")),
      h('p', { class: 'small muted' }, `Ma'lumotlar: ${this.ctx.catalog.items.length} ta tajriba, ${Object.keys(this.ctx.db.substances).length} ta modda, ${this.ctx.equipment.items.length} ta jihoz. Saqlash: ${this.ctx.api.mode === 'backend' ? 'server' : 'brauzer (localStorage)'}.`)));
  }

  // ----------------------------------------------------------------- yon panel
  openPanel(name) {
    if (this.panel === name && !this.drawer.hidden) { this.closePanel(); return; }
    this.panel = name;
    this._unsub?.();
    this._unsub = null;
    clear(this.drawer);
    const titles = { catalog: t('catalog.title'), reagents: t('reagents.title'), equipment: t('equipment.title'), templates: t('templates.title'), journal: t('journal.title'), settings: t('settings.title') };
    const body = h('div', { class: 'drawer-body' });
    this.drawer.append(h('header', { class: 'drawer-head' }, h('h2', {}, titles[name]), h('button', { class: 'icon-btn', 'aria-label': t('common.close'), onclick: () => this.closePanel() }, '×')), body);
    this.drawer.hidden = false;
    for (const [k, b] of Object.entries(this.tbButtons)) b.classList.toggle('active', k === name);
    ({ catalog: () => this.#catalog(body), reagents: () => this.#reagents(body), equipment: () => this.#equipment(body), templates: () => this.#templates(body), journal: () => { this._unsub = this.journal.render(body); }, settings: () => this.#settings(body) })[name]();
  }

  closePanel() {
    this.drawer.hidden = true;
    this.panel = null;
    this._unsub?.();
    for (const b of Object.values(this.tbButtons)) b.classList.remove('active');
  }

  #catalog(body) {
    const cat = this.ctx.catalog;
    const search = h('input', { class: 'input', type: 'search', placeholder: t('catalog.search'), 'aria-label': t('catalog.search') });
    const selCat = h('select', { class: 'input', 'aria-label': t('catalog.allCats') }, h('option', { value: '' }, t('catalog.allCats')), cat.categories.map((c) => h('option', { value: c.id }, `${c.n}. ${c.title_uz} (${c.count})`)));
    const levels = [...new Set(cat.items.map((i) => i.l).filter(Boolean))].sort((a, b) => (parseInt(a, 10) || 99) - (parseInt(b, 10) || 99) || a.localeCompare(b));
    const selLvl = h('select', { class: 'input', 'aria-label': t('catalog.allLevels') }, h('option', { value: '' }, t('catalog.allLevels')), levels.map((l) => h('option', { value: l }, l)));
    const count = h('div', { class: 'small muted' });
    const list = h('ul', { class: 'cat-list' });
    let progress = {};
    this.ctx.api.getProgress().then((p) => { progress = p || {}; draw(); }).catch(() => {});
    const norm = (s) => String(s || '').toLowerCase().replace(/[‘’ʻʼ`]/g, "'");
    const draw = () => {
      const q = norm(search.value.trim());
      const qf = q.replace(/\s+/g, '');
      const items = cat.items.filter((i) => (!selCat.value || i.c === selCat.value) && (!selLvl.value || i.l === selLvl.value) && (!q || norm(i.t).includes(q) || norm(i.tp).includes(q) || (i.s || []).some((s) => norm(s).includes(qf)) || i.id.includes(q)));
      count.textContent = t('catalog.count', { n: items.length });
      clear(list);
      for (const i of items.slice(0, 250)) {
        const done = progress[i.id]?.completed;
        list.appendChild(h('li', { class: 'cat-item' },
          h('div', { class: 'cat-main' },
            h('div', { class: 'cat-title' }, done ? h('span', { class: 'ok', title: t('guided.done') }, '✓ ') : null, i.t),
            h('div', { class: 'small muted' }, [i.l, i.tp].filter(Boolean).join(' · '), i.cf ? h('span', { class: 'chip warn tiny', title: t('catalog.confidenceMid') }, t("confidence.o'rta")) : null)),
          h('button', { class: 'btn small primary', onclick: () => { this.closePanel(); this.setModeSilently('guided'); this.guided.start(i.id); } }, t('catalog.start'))));
      }
      if (!items.length) list.appendChild(h('li', { class: 'muted' }, t('catalog.empty')));
      if (items.length > 250) list.appendChild(h('li', { class: 'muted small' }, `… yana ${items.length - 250} ta — qidiruvni aniqlashtiring`));
    };
    for (const el of [search, selCat, selLvl]) el.addEventListener('input', draw);
    body.append(search, h('div', { class: 'row gap' }, selCat, selLvl), count, list);
    draw();
    search.focus();
  }

  setModeSilently(m) {
    for (const b of this.modeBtn.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.mode === m));
    this.mode = m;
  }

  #reagents(body) {
    const db = this.ctx.db;
    const all = Object.values(db.substances).filter((s) => s.reagent).sort((a, b) => a.name_uz.localeCompare(b.name_uz, 'uz'));
    const search = h('input', { class: 'input', type: 'search', placeholder: t('reagents.search'), 'aria-label': t('reagents.search') });
    const classes = [...new Set(all.map((s) => s.class).filter(Boolean))].sort();
    const selCls = h('select', { class: 'input', 'aria-label': 'Sinf' }, h('option', { value: '' }, t('reagents.all')), classes.map((c) => h('option', { value: c }, c)));
    const list = h('ul', { class: 'reagent-list' });
    const norm = (s) => String(s || '').toLowerCase();
    const draw = () => {
      const q = norm(search.value.trim());
      clear(list);
      const items = all.filter((s) => (!selCls.value || s.class === selCls.value) && (!q || norm(s.name_uz).includes(q) || norm(s.formula).includes(q.replace(/\s/g, '')) || norm(s.id).includes(q)));
      for (const s of items.slice(0, 200)) list.appendChild(this.#reagentRow(s));
      if (!items.length) list.appendChild(h('li', { class: 'muted' }, t('catalog.empty')));
    };
    search.addEventListener('input', draw);
    selCls.addEventListener('input', draw);
    body.append(search, selCls, list);
    draw();
    search.focus();
  }

  #reagentRow(s) {
    const opts = h('div', { class: 'chips' });
    const take = (reagent, defId) => {
      const it = this.ctx.bench.add(defId, { reagent });
      this.toastKey('info', 'info.placed', { name: `${s.name_uz}` });
      this.journal.add({ kind: 'amal', text: `Javondan olindi: ${s.name_uz}${reagent.conc_M ? ` (${reagent.conc_M} M)` : ''}` });
      this.ctx.ix.select(it);
    };
    const bottle = s.storage === 'qoramtir-sklyanka' ? 'qoramtir-sklyanka' : null;
    if (s.solutions?.length) {
      for (const sol of s.solutions) opts.appendChild(h('button', { class: 'chip-btn', title: sol.grade || '', onclick: () => take({ id: s.id, conc_M: sol.conc_M, as: 'solution', volume_mL: 100 }, bottle || 'tomizgichli-sklyanka') }, `${t('reagents.solution')} ${sol.label || `${sol.conc_M} M`}`));
    }
    if (s.state === 's') {
      const forms = s.forms?.length ? s.forms : [s.appearance?.form || 'kukun'];
      for (const f of forms) opts.appendChild(h('button', { class: 'chip-btn', onclick: () => take({ id: s.id, as: 'solid', mass_g: 25, form: f }, bottle || 'reaktiv-sklyankasi') }, `${t('reagents.solid')}: ${f}`));
    }
    if (s.state === 'l' || ((s.mixture || s.mixture_opaque) && !s.solutions?.length) || (s.state === 'aq' && !s.solutions?.length)) opts.appendChild(h('button', { class: 'chip-btn', onclick: () => take({ id: s.id, as: 'liquid', volume_mL: 100 }, bottle || 'tomizgichli-sklyanka') }, t('reagents.liquid')));
    if (s.state === 'g') opts.appendChild(h('button', { class: 'chip-btn', onclick: () => take({ id: s.id, as: 'gas' }, 'gaz-silindri') }, `${t('reagents.gas')} (silindrda)`));
    const haz = (s.hazards || []).map((x) => h('span', { class: `haz haz-${x}`, title: t(`hazard.${x}`) }, HAZ_ICON[x] || '!'));
    return h('li', { class: 'reagent' },
      h('div', { class: 'row between' }, h('div', {}, h('b', { class: 'formula' }, prettyFormula(s.display || s.formula || '')), ' ', s.name_uz), h('div', { class: 'haz-row' }, haz)),
      s.appearance?.desc_uz ? h('div', { class: 'small muted' }, s.appearance.desc_uz) : null,
      s.storage ? h('div', { class: 'tiny muted' }, `${t('reagents.storage')}: ${t(`storage.${s.storage}`)}`) : null,
      opts);
  }

  #equipment(body) {
    const eq = this.ctx.equipment;
    const search = h('input', { class: 'input', type: 'search', placeholder: t('equipment.search'), 'aria-label': t('equipment.search') });
    const list = h('div', { class: 'equip-list' });
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      clear(list);
      for (const c of eq.categories || [{ id: null, name_uz: '' }]) {
        const items = eq.items.filter((d) => (c.id === null || d.category === c.id) && (!q || d.name_uz.toLowerCase().includes(q) || d.id.includes(q)));
        if (!items.length) continue;
        list.appendChild(h('h3', { class: 'eq-cat' }, c.name_uz || c.title_uz || c.id));
        const ul = h('ul', { class: 'eq-items' });
        for (const d of items) {
          const sizeSel = d.sizes.length > 1 ? h('select', { class: 'input tiny', 'aria-label': t('equipment.size') }, d.sizes.map((s) => h('option', { value: s.id }, s.label_uz || s.id))) : null;
          const isPPE = d.category === 'himoya';
          ul.appendChild(h('li', { class: 'eq-item' },
            h('div', {}, h('div', {}, d.name_uz), d.desc_uz ? h('div', { class: 'tiny muted' }, d.desc_uz) : null),
            h('div', { class: 'row gap' }, sizeSel,
              h('button', { class: 'btn small', onclick: () => {
                if (isPPE) { this.ppe = this.ppe || {}; this.ppe[d.id] = true; this.toast('success', `${d.name_uz} — kiyildi`); return; }
                const it = this.ctx.bench.add(d.id, { sizeId: sizeSel?.value });
                this.toastKey('info', 'info.placed', { name: d.name_uz });
                this.ctx.ix.select(it);
              } }, isPPE ? 'Kiyish' : t('equipment.take')))));
        }
        list.appendChild(ul);
      }
    };
    search.addEventListener('input', draw);
    body.append(search, list);
    draw();
  }

  async #templates(body) {
    const tpls = this.ctx.templates || [];
    if (!tpls.length) { body.appendChild(h('p', { class: 'muted' }, 'Andozalar yuklanmadi.')); return; }
    let mod = null;
    try { mod = await import('../lab/templates.js'); } catch (e) { console.warn(e); }
    const ul = h('ul', { class: 'tpl-list' });
    for (const tp of tpls) {
      const check = h('div', { class: 'tpl-check' });
      ul.appendChild(h('li', { class: 'tpl' },
        h('div', { class: 'cat-title' }, tp.name_uz),
        h('div', { class: 'small muted' }, tp.purpose_uz || ''),
        h('div', { class: 'row gap wrap' },
          h('button', { class: 'btn small primary', onclick: () => {
            if (!mod) return;
            const res = mod.assembleTemplate(this.ctx.bench, tp, { anchor: { x: -0.1, z: -0.95 + 0.05 } });
            if (res.errors?.length) this.toast('warn', res.errors.join('; '));
            else this.toast('success', t('templates.done'));
            this.journal.add({ kind: 'amal', text: `Asbob yig'ildi: ${tp.name_uz}` });
            this.closePanel();
          } }, t('templates.auto')),
          h('button', { class: 'btn small', onclick: () => this.#manualChecklist(tp, mod, check) }, t('templates.manual'))),
        check));
    }
    body.appendChild(ul);
  }

  #manualChecklist(tp, mod, box) {
    if (!mod) return;
    clearInterval(this._tplTimer);
    const draw = () => {
      clear(box);
      const missing = mod.missingItems(this.ctx.bench, tp) || [];
      if (missing.length) {
        box.appendChild(h('div', { class: 'small' }, h('b', {}, `${t('templates.missing')}: `), missing.map((m) => (typeof m === 'string' ? (this.ctx.bench.def(m)?.name_uz || m) : (m.name_uz || this.ctx.bench.def(m.def)?.name_uz || m.def))).join(', ')));
      }
      const st = mod.checkAssembly(this.ctx.bench, tp) || [];
      box.appendChild(h('ol', { class: 'steps small' }, st.map((s) => h('li', { class: s.done ? 'done' : '' }, h('span', { class: 'tick' }, s.done ? '✓' : ''), h('span', {}, s.step?.text_uz || s.step || s.hint_uz || '')))));
      if (st.length && st.every((s) => s.done)) { box.appendChild(h('div', { class: 'badge success' }, t('templates.done'))); clearInterval(this._tplTimer); }
    };
    draw();
    this._tplTimer = setInterval(() => { if (!box.isConnected) { clearInterval(this._tplTimer); return; } draw(); }, 1000);
  }

  #settings(body) {
    const p = this.prefs;
    const radio = (name, value, label, checked, fn) => h('label', { class: 'radio' }, h('input', { type: 'radio', name, value, checked, onchange: fn }), label);
    const cur = this.ctx.scene.quality.id;
    body.append(
      h('fieldset', {}, h('legend', {}, t('settings.quality')),
        ...Object.keys(QUALITY).map((q) => radio('q', q, t(`settings.q.${q}`), cur === q, () => { saveQuality(q); this.toast('info', t('settings.reload'), { action: { label: 'Qayta yuklash', fn: () => location.reload() } }); })),
        h('p', { class: 'tiny muted' }, "Yuqori — shishada haqiqiy sinish (transmission) va soyalar; past — integratsiyalashgan grafika uchun.")),
      h('fieldset', {}, h('legend', {}, t('settings.theme')),
        ...['auto', 'light', 'dark'].map((th) => radio('th', th, t(`settings.themes.${th}`), p.theme === th, () => { p.theme = th; this.applyPrefs(); }))),
      h('fieldset', {}, h('legend', {}, t('settings.speed')),
        ...[0.5, 1, 2, 4, 8].map((s) => radio('sp', String(s), `×${s}`, p.speed === s, () => { p.speed = s; this.applyPrefs(); }))),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!p.sound, onchange: (e) => { p.sound = e.target.checked; this.applyPrefs(); } }), t('settings.sound')),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!p.bigUi, onchange: (e) => { p.bigUi = e.target.checked; this.applyPrefs(); } }), t('settings.bigUi')),
      h('p', { class: 'tiny muted' }, `Saqlash rejimi: ${this.ctx.api.mode === 'backend' ? 'server' : 'brauzer (localStorage)'}`));
    void soundEnabled;
  }

  // ----------------------------------------------------------------- saqlash / ochish
  async openSaveLoad() {
    const api = this.ctx.api;
    const nameIn = h('input', { class: 'input', value: `Stol ${new Date().toLocaleString('uz-UZ')}`, 'aria-label': 'Nomi' });
    const list = h('ul', { class: 'slot-list' });
    const refresh = async () => {
      clear(list);
      let slots = [];
      try { slots = await api.listStates(); } catch (e) { list.appendChild(h('li', { class: 'muted' }, e.message)); return; }
      if (!slots.length) list.appendChild(h('li', { class: 'muted small' }, "Saqlangan holatlar yo'q"));
      for (const s of slots) {
        list.appendChild(h('li', { class: 'row between' }, h('span', {}, s.name || s.slot, h('span', { class: 'tiny muted' }, ` ${s.updated_at ? new Date(s.updated_at).toLocaleString('uz-UZ') : ''}`)),
          h('span', { class: 'row gap' },
            h('button', { class: 'btn small', onclick: async () => { const st = await api.getState(s.slot); this.loadState(st.state); this.closeModal(); } }, t('common.open')),
            h('button', { class: 'btn small ghost', onclick: async () => { await api.deleteState(s.slot); refresh(); } }, '×'))));
      }
    };
    const file = h('input', { type: 'file', accept: '.json,application/json', class: 'input', onchange: async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try { this.loadState(JSON.parse(await f.text())); this.closeModal(); } catch (err) { this.toast('danger', `Fayl o'qilmadi: ${err.message}`); }
    } });
    this.openModal(`${t('toolbar.save')} / ${t('toolbar.load')}`, h('div', {},
      h('div', { class: 'row gap' }, nameIn, h('button', { class: 'btn primary', onclick: async () => {
        const slot = `s${Date.now().toString(36)}`;
        try { await api.saveState(slot, nameIn.value, this.ctx.bench.serialize()); this.toastKey('success', 'info.saved'); refresh(); } catch (e) { this.toast('danger', e.message); }
      } }, t('toolbar.save'))),
      h('div', { class: 'row gap' }, h('button', { class: 'btn small', onclick: () => download(`laboratoriya-stoli-${Date.now()}.json`, JSON.stringify(this.ctx.bench.serialize())) }, 'JSON faylga yuklab olish'), file),
      h('h3', {}, t('toolbar.load')), list));
    refresh();
  }

  loadState(state) {
    this.ctx.effects.reset();
    this.ctx.bench.load(state);
    this.toastKey('success', 'info.loaded');
    this.journal.add({ kind: 'amal', text: 'Stol holati tiklandi' });
  }

  resetBench() {
    if (this.ctx.bench.items.size && !confirm(`${t('toolbar.reset')}?`)) return;
    this.ctx.ix.select(null);
    this.ctx.bench.clear();
    this.ctx.effects.reset();
    this.journal.add({ kind: 'amal', text: 'Stol tozalandi' });
  }
}
