// Tanlangan jihoz kartasi: tarkibi, hajmi, harorati, pH, o'lchov asboblari ko'rsatkichi va amallar.
import { h, clear, prettyFormula } from './dom.js';
import { t } from '../i18n/uz.js';

const PHASE = { aq: 'phase.aq', s: 'phase.s', org: 'phase.org', g: 'phase.g' };

export class Inspector {
  constructor(root, ctx) {
    this.ctx = ctx; // {bench, chem, ix (Interaction), ui}
    this.el = h('section', { class: 'inspector card', 'aria-live': 'polite', 'aria-label': t('inspector.contents') });
    root.appendChild(this.el);
    this.item = null;
    this.sig = '';
    this.renderEmpty();
    setInterval(() => this.refresh(), 300);
  }

  show(item) {
    this.item = item;
    this.sig = '';
    if (!item) this.renderEmpty();
    else this.refresh(true);
  }

  renderEmpty() {
    clear(this.el);
    this.el.classList.add('is-empty');
    this.el.appendChild(h('p', { class: 'muted small' }, t('inspector.empty')));
  }

  refresh(force = false) {
    const it = this.item;
    if (!it) return;
    if (!this.ctx.bench.items.has(it.id)) { this.show(null); return; }
    const { chem } = this.ctx;
    const d = it.vessel ? chem.describe(it.vessel) : null;
    const sig = JSON.stringify([d && d.items.map((x) => [x.id, x.phase, x.mol.toPrecision(2)]), d && Math.round(d.T), d && d.pH && d.pH.toFixed(1), it.flags.reading, it.heaterOn, it.flags.water, it.flags.cracked, it.flags.current, d && d.volume_mL.toFixed(1), !!it.parentLink, this.ctx.bench.graph.connectionsOf(it.id).length]);
    if (!force && sig === this.sig) return;
    this.sig = sig;
    this.render(it, d);
  }

  render(it, d) {
    const { ix, ui } = this.ctx;
    const el = clear(this.el);
    el.classList.remove('is-empty');
    const title = it.reagent ? `${prettyFormula(this.ctx.chem.db.sub(it.reagent.id)?.display || it.reagent.id)} — ${this.ctx.chem.db.sub(it.reagent.id)?.name_uz || ''}` : it.def.name_uz;
    el.appendChild(h('header', { class: 'insp-head' },
      h('div', {}, h('div', { class: 'insp-title' }, title), h('div', { class: 'muted small' }, it.reagent ? it.def.name_uz : (it.size?.label_uz || it.size?.id !== 'standart' ? `${t('equipment.size')}: ${it.size.label_uz || it.size.id}` : ''))),
      h('button', { class: 'icon-btn', title: t('common.close'), 'aria-label': t('common.close'), onclick: () => ix.select(null) }, '×')));
    if (it.flags.cracked) el.appendChild(h('div', { class: 'badge danger' }, t('warn.darz', { name: it.def.name_uz })));
    if (d) {
      const stats = h('div', { class: 'insp-stats' },
        stat(t('inspector.volume'), `${d.volume_mL.toFixed(d.volume_mL < 10 ? 2 : 1)} ${t('units.ml')}`),
        stat(t('inspector.temp'), `${d.T.toFixed(0)} ${t('units.c')}`),
        d.pH !== null && d.volume_mL > 0.01 ? stat(t('inspector.ph'), d.pH.toFixed(1)) : null,
        d.pressure_atm > 1.1 && it.vessel.closed ? stat(t('inspector.pressure'), `${d.pressure_atm.toFixed(2)} ${t('units.atm')}`) : null,
        d.solid_g > 0.0005 ? stat(t('inspector.mass'), `${d.solid_g.toFixed(3)} ${t('units.g')}`) : null);
      el.appendChild(stats);
      if (d.volume_mL > 0.01) {
        el.appendChild(h('div', { class: 'swatch-row' }, h('span', { class: 'swatch', style: { background: d.color.hex || '#e4f1f6' } }), h('span', { class: 'small muted' }, d.color.name_uz || '')));
      }
      const rows = d.items.filter((x) => !(x.id === 'H2O' && x.phase === 'aq')).slice(0, 10);
      if (rows.length || d.volume_mL > 0) {
        const list = h('ul', { class: 'contents' });
        if (d.items.some((x) => x.id === 'H2O' && x.phase === 'aq')) list.appendChild(h('li', {}, h('b', {}, 'H₂O'), ' ', h('span', { class: 'muted' }, 'suv')));
        for (const x of rows) {
          const amount = x.isIon ? `${(x.mol / Math.max(d.aq_mL / 1000, 1e-6)).toPrecision(2)} M` : (x.phase === 's' ? `${x.mass_g.toPrecision(2)} g` : `${x.mol.toPrecision(2)} mol`);
          list.appendChild(h('li', {}, h('b', {}, prettyFormula(x.display)), ' ', h('span', { class: 'muted' }, `${x.name || ''} · ${t(PHASE[x.phase])} · ${amount}`)));
        }
        el.append(h('div', { class: 'small strong' }, t('inspector.contents')), list);
      } else el.appendChild(h('p', { class: 'muted small' }, t('inspector.emptyVessel')));
    }
    // o'lchov asboblari
    if (it.flags.reading !== undefined && it.flags.reading !== null) {
      const id = it.def.id;
      const r = it.flags.reading;
      let txt = String(r);
      if (id === 'termometr') txt = `${Number(r).toFixed(1)} °C`;
      if (id === 'ph-metr') txt = `pH ${Number(r).toFixed(2)}`;
      if (id === 'voltmetr') txt = `${Number(r).toFixed(2)} V`;
      if (id === 'konduktometr') txt = `${(Number(r) * 1000).toFixed(1)} mS/m (nisbiy)`;
      if (id === 'elektron-tarozi') txt = `${Number(r).toFixed(3)} g`;
      if (id === 'otkazuvchanlik-lampochkasi') txt = r === 'kuchli' ? t('info.lampOn') : r === 'kuchsiz' ? t('info.lampDim') : t('info.lampOff');
      el.appendChild(h('div', { class: 'reading', role: 'status' }, txt));
    }
    // amallar
    const acts = h('div', { class: 'insp-actions' });
    const btn = (label, fn, opts = {}) => acts.appendChild(h('button', { class: `btn small ${opts.cls || ''}`, onclick: fn, title: opts.title || label, disabled: opts.disabled }, label));
    if (it.vessel && !it.flags.cracked) {
      const hasLiquid = d && d.volume_mL > 0.01;
      const hasSolid = d && d.solid_g > 0.0005;
      const hasGas = d && d.items.some((x) => x.phase === 'g');
      if (hasLiquid) {
        btn(t('inspector.pour'), () => ui.beginPour(it), { cls: 'primary' });
        btn(t('inspector.drops'), () => ui.beginDose(it, 'drops'));
        btn(t('inspector.pipette'), () => ui.beginDose(it, 'pipette'));
      }
      if (hasSolid) btn(t('inspector.spatula'), () => ui.beginDose(it, 'spatula'));
      if (hasGas && !hasLiquid) btn(t('inspector.gasPass'), () => ui.beginDose(it, 'gas'));
      if (!it.vessel.isReagentBottle) {
        btn(t('inspector.water'), () => ui.askWater(it));
        btn(t('inspector.heat'), () => ix.autoHeat(it));
        btn(t('inspector.stir'), () => ix.stir(it));
        btn(t('inspector.indicator'), () => { const r = ix.indicatorPaper(it); if (r) ui.toastSwatch(t('info.paperColor', { ph: Math.round(r.pH) }), r.color); });
        btn(t('inspector.flameTest'), () => ix.flameTest(it));
        btn(t('inspector.splint'), () => ix.splintTest(it, 'yonib'));
        btn(t('inspector.splintGlow'), () => ix.splintTest(it, 'chog'));
        btn(t('inspector.ignite'), () => ix.ignite(it));
        btn(t('inspector.light'), () => ix.toggleLight(it));
        btn(t('inspector.close'), () => ix.closeWithStopper(it));
      }
      btn(t('inspector.wash'), () => ix.wash(it));
      btn(t('inspector.waste'), () => ix.toWaste(it));
    }
    if (it.model.heater) btn(it.heaterOn ? t('inspector.off') : t('inspector.on'), () => ix.toggleHeater(it), { cls: it.heaterOn ? 'danger' : 'primary' });
    if (it.def.id === 'tok-manbai') {
      btn(it.heaterOn ? t('inspector.off') : t('inspector.on'), () => ix.toggleHeater(it), { cls: 'primary' });
      const cur = h('input', { type: 'range', min: '0.1', max: '2', step: '0.1', value: String(it.flags.current ?? 0.5), 'aria-label': t('inspector.current'), oninput: (e) => { it.flags.current = Number(e.target.value); } });
      acts.appendChild(h('label', { class: 'small range' }, `${t('inspector.current')}, A`, cur));
    }
    if (it.def.builder === 'sovutgich') btn(it.flags.water ? `${t('inspector.cooling')}: ${t('inspector.off')}` : `${t('inspector.cooling')}: ${t('inspector.on')}`, () => { it.flags.water = !it.flags.water; this.refresh(true); });
    if (it.def.id === 'elektron-tarozi') btn(t('inspector.tare'), () => { it.flags.tare = (it.flags.tare || 0) + (it.flags.reading || 0); });
    if (it.parentLink || this.ctx.bench.graph.connectionsOf(it.id).length) btn(t('inspector.disconnect'), () => { this.ctx.bench.detach(it); this.refresh(true); });
    btn(t('inspector.remove'), () => ix.removeItem(it), { cls: 'ghost' });
    el.appendChild(acts);
  }
}

function stat(label, value) {
  return h('div', { class: 'stat' }, h('div', { class: 'stat-label' }, label), h('div', { class: 'stat-value' }, value));
}
