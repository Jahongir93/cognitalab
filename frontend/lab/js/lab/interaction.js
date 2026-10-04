// Foydalanuvchi bilan o'zaro ta'sir: tanlash, sudrash va portlarga "yopishish" (yarim shaffof oldindan ko'rinish bilan),
// ikki marta bosib fokuslash, quyish (og'ish burchagi tezlikni belgilaydi), tomizgich/pipetka/shpatel dozalari,
// qizdirish, aralashtirish, yuvish, chiqindiga to'kish, cho'p sinovlari, alanga sinovi, indikator qog'ozi.
import * as THREE from 'three';
import { BENCH, ZONES } from '../scene/room.js';
import { MM } from '../scene/models/glassware.js';
import { radiusAt } from '../scene/models/profiles.js';

const DRAG_PX = 6;
const SNAP_PX = 48;
const DROP_ML = 0.05;
const _v = new THREE.Vector3();
const _p = new THREE.Vector3();

/** Universal indikator rangi (pH bo'yicha) */
export function universalIndicatorColor(pH) {
  const stops = [[0, '#c0262d'], [2, '#e8452c'], [4, '#f39a2b'], [5, '#f2c12e'], [6, '#e4d83a'], [7, '#8fc43e'], [8, '#3aa655'], [9, '#2c8f8a'], [10, '#2d5fa8'], [12, '#4b3a96'], [14, '#5a2a7a']];
  if (pH === null || pH === undefined || Number.isNaN(pH)) return '#f4efe1';
  for (let i = 1; i < stops.length; i++) {
    if (pH <= stops[i][0]) {
      const [x0, c0] = stops[i - 1], [x1, c1] = stops[i];
      return '#' + new THREE.Color(c0).lerp(new THREE.Color(c1), (pH - x0) / (x1 - x0)).getHexString();
    }
  }
  return stops[stops.length - 1][1];
}

export class Interaction extends EventTarget {
  constructor({ scene, bench, chem, sim, effects }) {
    super();
    this.scene = scene;
    this.bench = bench;
    this.chem = chem;
    this.db = chem.db;
    this.sim = sim;
    this.effects = effects;
    this.selected = null;
    this.pending = null; // {action, src, resolve}
    this.pour = null;
    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.down = null;
    this.drag = null;
    this.timers = [];
    const el = scene.renderer.domElement;
    this.el = el;
    // ushlash halqasi (tanlangan jihoz ostida)
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8, depthWrite: false }));
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.visible = false;
    this.ring.renderOrder = 9;
    scene.scene.add(this.ring);
    this.markers = new THREE.Group();
    scene.scene.add(this.markers);
    // capture bosqichida — OrbitControls'dan oldin
    scene.container.addEventListener('pointerdown', (e) => this.#onDown(e), true);
    window.addEventListener('pointermove', (e) => this.#onMove(e));
    window.addEventListener('pointerup', (e) => this.#onUp(e));
    el.addEventListener('dblclick', (e) => this.#onDbl(e));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => this.#onKey(e));
    scene.onFrame.push((dt, raw) => this.#frame(dt, raw));
  }

  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
  msg(kind, key, params) { this.emit('message', { kind, key, params }); }
  journal(text, extra = {}) { this.emit('journal', { text, ...extra }); }

  // ----------------------------------------------------------------- tanlash
  #setNdc(e) {
    const r = this.el.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.scene.camera);
  }

  /** Ko'rsatkich ostidagi jihoz yoki xona zonasi */
  pick(e) {
    this.#setNdc(e);
    const hits = this.ray.intersectObjects([this.scene.world, ...Object.values(this.scene.roomParts).filter((o) => o?.isObject3D && o !== this.scene.roomParts.room)], true);
    for (const h of hits) {
      if (!h.object.visible || h.object.isPoints) continue;
      let o = h.object;
      while (o) {
        if (o.userData.itemId && this.bench.items.has(o.userData.itemId)) return { item: this.bench.items.get(o.userData.itemId), point: h.point };
        if (o.userData.zone) return { zone: o.userData.zone, point: h.point };
        o = o.parent;
      }
    }
    return null;
  }

  select(item) {
    this.selected = item || null;
    this.emit('select', { item: this.selected });
  }

  // ----------------------------------------------------------------- ko'rsatkich hodisalari
  #onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (this.pour) return;
    const hit = this.pick(e);
    this.down = { x: e.clientX, y: e.clientY, hit, id: e.pointerId };
    if (hit?.item) this.scene.controls.enabled = false;
  }

  #onMove(e) {
    if (!this.down) return;
    const d = Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y);
    if (!this.drag && this.down.hit?.item && d > DRAG_PX && !this.pending) this.#startDrag(this.down.hit.item, this.down.hit.point);
    if (this.drag) this.#dragMove(e);
  }

  #onUp(e) {
    const down = this.down;
    this.down = null;
    this.scene.controls.enabled = true;
    if (this.drag) { this.#endDrag(e); return; }
    if (!down) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_PX) return;
    const hit = down.hit;
    if (this.pending) {
      if (hit?.item && hit.item !== this.pending.src) {
        const p = this.pending;
        this.pending = null;
        this.emit('pending', null);
        p.resolve(hit.item);
      } else if (!hit) { this.cancelPending(); }
      return;
    }
    if (hit?.item) this.select(hit.item);
    else if (hit?.zone) { this.emit('zone', { zone: hit.zone }); }
    else this.select(null);
  }

  #onDbl(e) {
    const hit = this.pick(e);
    if (!hit?.item) return;
    const box = new THREE.Box3().setFromObject(hit.item.group);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    this.scene.focusOn(c, Math.max(0.22, size * 1.6));
  }

  #onKey(e) {
    if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.key === 'Escape') { this.cancelPending(); if (this.pour) this.endPour(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selected && !this.pour) { this.removeItem(this.selected); }
    if (this.pour && (e.key === 'ArrowUp' || e.key === 'ArrowRight')) this.setPourAngle(this.pour.angle + 5);
    if (this.pour && (e.key === 'ArrowDown' || e.key === 'ArrowLeft')) this.setPourAngle(this.pour.angle - 5);
  }

  /** Nishon idishni tanlashni kutish (quyish, tomizish ...) */
  awaitTarget(src, action) {
    this.cancelPending();
    return new Promise((resolve) => {
      this.pending = { src, action, resolve };
      this.emit('pending', { src, action });
    });
  }

  cancelPending() {
    if (!this.pending) return;
    const p = this.pending;
    this.pending = null;
    this.emit('pending', null);
    p.resolve(null);
  }

  // ----------------------------------------------------------------- sudrash
  #subtree(item) {
    const ids = new Set([item.id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const o of this.bench.items.values()) if (o.parentLink && ids.has(o.parentLink.item) && !ids.has(o.id)) { ids.add(o.id); grew = true; }
    }
    return ids;
  }

  #startDrag(item, point) {
    if (item.parentLink) this.bench.detach(item);
    const flexible = !!item.def.flexible;
    item.group.updateMatrixWorld(true);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -point.y);
    const start = item.group.position.clone();
    const sub = this.#subtree(item);
    // mos portlar (bu jihozning bo'sh portlari x boshqa jihozlarning bo'sh portlari)
    const cands = [];
    const own = this.bench.freePorts(item);
    for (const other of this.bench.items.values()) {
      if (sub.has(other.id)) continue;
      for (const tp of this.bench.freePorts(other)) {
        for (const op of own) {
          const r = this.bench.graph.canConnect(other.id, tp.id, item.id, op.id);
          if (r.ok) cands.push({ a: other, pa: tp.id, pb: op.id });
        }
      }
    }
    // port belgilari
    this.markers.clear();
    const seen = new Set();
    for (const c of cands.slice(0, 80)) {
      const key = c.a.id + c.pa;
      if (seen.has(key)) continue;
      seen.add(key);
      const pose = this.bench.portPose(c.a, c.pa);
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.004, 12, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.85, depthTest: false }));
      m.position.copy(pose.pos);
      m.renderOrder = 20;
      this.markers.add(m);
    }
    this.drag = { item, plane, offset: start.clone().sub(plane.projectPoint(point, new THREE.Vector3())), start, cands, snap: null, ghost: null, flexible };
    if (!flexible) item.group.position.y = BENCH.y + 0.015;
    this.select(item);
  }

  #ghostFor(item) {
    if (this.drag.ghost) return this.drag.ghost;
    const g = item.group.clone(true);
    const mat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.28, depthWrite: false });
    g.traverse((o) => { if (o.isMesh || o.isLine) o.material = mat; });
    this.scene.world.add(g);
    this.drag.ghost = g;
    return g;
  }

  #dragMove(e) {
    const D = this.drag;
    this.#setNdc(e);
    const hit = this.ray.ray.intersectPlane(D.plane, _v);
    if (hit && !D.flexible) {
      const p = hit.add(D.offset);
      p.x = THREE.MathUtils.clamp(p.x, BENCH.x0 - 0.35, BENCH.x1 - 0.04);
      p.z = THREE.MathUtils.clamp(p.z, BENCH.zc - 0.42, BENCH.zc + 0.42);
      D.item.group.position.set(p.x, BENCH.y + 0.015, p.z);
    }
    // yaqin port (ekran bo'yicha)
    const r = this.el.getBoundingClientRect();
    let best = null, bd = SNAP_PX;
    for (const c of D.cands) {
      const pose = this.bench.portPose(c.a, c.pa);
      _p.copy(pose.pos).project(this.scene.camera);
      const sx = (_p.x * 0.5 + 0.5) * r.width + r.left, sy = (-_p.y * 0.5 + 0.5) * r.height + r.top;
      const d = Math.hypot(sx - e.clientX, sy - e.clientY);
      if (d < bd) { bd = d; best = c; }
    }
    D.snap = best;
    if (best && !D.flexible) {
      const g = this.#ghostFor(D.item);
      const { pos, quat } = this.bench.attachPose(best.a, best.pa, D.item, best.pb);
      g.position.copy(pos); g.quaternion.copy(quat);
      g.visible = true;
    } else if (D.ghost) D.ghost.visible = false;
    for (const m of this.markers.children) m.scale.setScalar(1);
    if (best) {
      const pose = this.bench.portPose(best.a, best.pa);
      for (const m of this.markers.children) if (m.position.distanceTo(pose.pos) < 1e-4) m.scale.setScalar(2);
    }
  }

  #endDrag() {
    const D = this.drag;
    this.drag = null;
    this.markers.clear();
    if (D.ghost) this.scene.world.remove(D.ghost);
    const it = D.item;
    if (D.snap) {
      if (!D.flexible) it.group.position.y = BENCH.y;
      const r = this.bench.connect(D.snap.a, D.snap.pa, it, D.snap.pb);
      if (r.ok) {
        this.journal(`${it.def.name_uz} → ${D.snap.a.def.name_uz} ulandi`, { kind: 'amal' });
        this.effects.sound('click');
      }
      if (D.flexible) it.group.position.copy(D.start);
      return;
    }
    if (D.flexible) return;
    const p = it.group.position;
    p.y = BENCH.y;
    // rakovina: yuvish
    if (Math.hypot(p.x - ZONES.sink.x, p.z - (BENCH.zc + ZONES.sink.z)) < ZONES.sink.r) {
      if (it.vessel) this.wash(it);
      const spot = this.bench.findFreeSpot(this.bench.radiusOf(it), { x: ZONES.sink.x + 0.3, z: BENCH.zc + 0.05 });
      p.set(spot.x, BENCH.y, spot.z);
      return;
    }
    // stol chetidan tashqari (chiqindi idishi tomonga)
    if (p.x < BENCH.x0 + 0.02) {
      if (it.vessel) this.toWaste(it);
      const spot = this.bench.findFreeSpot(this.bench.radiusOf(it));
      p.set(spot.x, BENCH.y, spot.z);
      return;
    }
    // boshqa jihoz bilan ustma-ust tushmasin
    const r0 = this.bench.radiusOf(it);
    const sub = this.#subtree(it);
    const clash = [...this.bench.items.values()].some((o) => !sub.has(o.id) && !o.parentLink && o.group.parent === this.scene.world && !o.def.flexible && Math.hypot(o.group.position.x - p.x, o.group.position.z - p.z) < (this.bench.radiusOf(o) + r0) * 0.7);
    if (clash) {
      const spot = this.bench.findFreeSpot(r0, { x: p.x, z: p.z });
      p.set(spot.x, BENCH.y, spot.z);
    }
    this.bench.emit('change', { type: 'move', item: it });
  }

  // ----------------------------------------------------------------- kadr
  #frame(dt, raw = dt) {
    const s = this.selected;
    if (s && this.bench.items.has(s.id)) {
      const box = new THREE.Box3().setFromObject(s.group);
      const c = box.getCenter(_v);
      const r = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 0.6 + 0.008;
      this.ring.position.set(c.x, Math.max(box.min.y, BENCH.y) + 0.0015, c.z);
      this.ring.scale.setScalar(Math.min(r, 0.4));
      this.ring.visible = true;
    } else this.ring.visible = false;
    if (this.pour) this.#pourFrame(dt);
    this.timers = this.timers.filter((t) => { t.t -= raw; if (t.t <= 0) { t.fn(); return false; } return true; });
  }

  after(seconds, fn) { this.timers.push({ t: seconds, fn }); }

  // ----------------------------------------------------------------- quyish
  canPour(src) {
    if (!src?.vessel || !src.liquid) return { ok: false, reason: 'Bu jihozdan quyib bo\'lmaydi' };
    if (this.chem.liquidVolume(src.vessel) < 0.01) return { ok: false, reason: 'Idish bo\'sh' };
    if (this.bench.graph.connectionsOf(src.id).some((c) => ['tiqin', 'shlif-erkak'].includes(this.bench.graph.portDef(c.other.node, c.other.port)?.type))) return { ok: false, reason: 'Avval tiqinni oling' };
    return { ok: true };
  }

  startPour(src, tgt) {
    const c = this.canPour(src);
    if (!c.ok) { this.msg('warn', 'info.cannotConnect', { reason: c.reason }); return false; }
    if (!tgt?.vessel) return false;
    if (src.parentLink) this.bench.detach(src);
    src.group.updateMatrixWorld(true);
    const orig = { pos: src.group.position.clone(), quat: src.group.quaternion.clone() };
    const rimR = radiusAt(src.liquid.inner, src.liquid.rimY - 0.5) + 1;
    // quyish tomoni: nishon tomonga
    const tm = this.effects.mouth(tgt, new THREE.Vector3());
    const sp = src.group.position;
    const yaw = Math.atan2(-(tm.z - sp.z), tm.x - sp.x) + Math.PI; // lab -x tomonda
    this.pour = { src, tgt, angle: 0, orig, rimR, yaw, poured: 0, shown: 0, startVol: this.chem.liquidVolume(src.vessel) };
    src._pouring = true;
    this.effects.sound('pour');
    this.emit('pour', { state: 'start', src, tgt });
    this.#placeForPour();
    return true;
  }

  setPourAngle(deg) {
    if (!this.pour) return;
    this.pour.angle = THREE.MathUtils.clamp(deg, 0, 135);
    this.#placeForPour();
  }

  #placeForPour() {
    const P = this.pour;
    const g = P.src.group;
    const tilt = THREE.MathUtils.degToRad(P.angle);
    g.quaternion.setFromEuler(new THREE.Euler(0, P.yaw, tilt, 'YXZ'));
    // lab nuqtasi (-x tomonda) nishon og'zi ustida bo'lsin
    const lip = new THREE.Vector3(-P.rimR * MM, P.src.liquid.rimY * MM, 0).applyQuaternion(g.quaternion);
    const tm = this.effects.mouth(P.tgt, new THREE.Vector3());
    const tr = P.tgt.model.vessel ? radiusAt(P.tgt.model.vessel.inner, P.tgt.model.vessel.rimY - 1) * MM : 0.01;
    const toward = new THREE.Vector3(Math.cos(P.yaw), 0, -Math.sin(P.yaw)).multiplyScalar(-tr * 0.4);
    g.position.copy(tm).add(toward).add(new THREE.Vector3(0, 0.025, 0)).sub(lip);
    if (P.angle < 1) { g.position.y = Math.max(g.position.y, BENCH.y); }
    g.updateMatrixWorld(true);
  }

  #pourFrame(dt) {
    const P = this.pour;
    const L = P.src.liquid;
    L.update();
    if (!L.overflow || L.volume_mL + L.orgVolume_mL < 0.005) return;
    const rate = Math.min(L.volume_mL + L.orgVolume_mL, 40 * Math.pow(L.overflow.excess * 1000, 1.4) * dt + 0.002);
    const tgtCap = P.tgt.liquid?.capacity_mL ?? 1e9;
    const moved = this.chem.transfer(P.src.vessel, P.tgt.vessel, rate, { settled: 0.5 });
    if (moved <= 0) return;
    P.poured += moved;
    this.sim.noteAddition(P.tgt);
    const ev = P.tgt.vessel._lastTransferEvents || [];
    if (ev.some((x) => x.type === 'splash')) { this.effects.splash(P.tgt); this.msg('danger', 'warn.suv-kislotaga'); }
    // oqim
    const from = L.overflow.point;
    const to = this.effects.mouth(P.tgt, new THREE.Vector3());
    const col = L.material.color;
    const n = Math.min(1 + moved * 4, 8);
    for (let i = 0; i < n; i++) {
      this.effects.soft.spawn({ p: from.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.002, 0, (Math.random() - 0.5) * 0.002)), v: [(to.x - from.x) * 1.5, 0.02, (to.z - from.z) * 1.5], color: col, alpha: 0.85, size: 0.0035, life: 0.6, gravity: 9.8, floor: (P.tgt.liquid?.level ?? to.y) + 0.001, fadeIn: 0.01 });
    }
    if (this.chem.liquidVolume(P.tgt.vessel) > tgtCap) this.msg('warn', 'info.tooFull');
    if (P.poured - P.shown > 0.5) { P.shown = P.poured; this.emit('pour', { state: 'flow', poured: P.poured }); }
  }

  endPour() {
    const P = this.pour;
    if (!P) return;
    this.pour = null;
    P.src._pouring = false;
    P.src.group.position.copy(P.orig.pos);
    P.src.group.quaternion.copy(P.orig.quat);
    if (P.poured > 0.005) {
      this.journal(`${this.#label(P.src)} dan ${this.#label(P.tgt)} ga ${P.poured.toFixed(1)} ml quyildi`, { kind: 'amal' });
      this.msg('info', 'pour.poured', { v: P.poured.toFixed(1) });
    }
    this.emit('pour', { state: 'end', poured: P.poured });
  }

  #label(it) {
    if (it.reagent) { const s = this.db.sub(it.reagent.id); return `${s?.name_uz || it.reagent.id}${it.reagent.conc_M ? ` (${it.reagent.conc_M} M)` : ''}`; }
    return it.def.name_uz;
  }

  // ----------------------------------------------------------------- aniq dozalar
  /**
   * @param {'drops'|'pipette'|'spatula'} mode
   * @param {number} amount tomchi soni, ml yoki g
   */
  dose(src, tgt, mode, amount) {
    if (!src?.vessel || !tgt?.vessel || src === tgt) return 0;
    const v = src.vessel;
    if (mode === 'spatula') {
      const solids = this.chem.inPhase(v, 's').filter(([, n]) => n > 1e-9);
      const total = solids.reduce((a, [id, n]) => a + n * (this.db.molarMass(id) || 0), 0);
      if (total <= 1e-6) { this.msg('warn', 'info.emptySrc'); return 0; }
      const f = Math.min(1, amount / total);
      for (const [id, n] of solids) {
        const m = n * f * (this.db.molarMass(id) || 0);
        this.chem.add(v, id, 's', -n * f);
        const ev = this.chem.addSubstance(tgt.vessel, id, { as: 'solid', mass_g: m, form: v.forms[id] });
        this.#handleAddEvents(tgt, ev);
      }
      this.sim.noteAddition(tgt);
      this.#dropAnim(tgt, 'solid', solids[0] && this.db.sub(solids[0][0])?.appearance?.color);
      this.journal(`${this.#label(src)}: ${amount} g ${this.#label(tgt)} ga solindi (shpatel)`, { kind: 'amal' });
      return amount;
    }
    if (mode === 'gas') {
      // gazni naycha orqali boshqa idishdagi suyuqlikdan o'tkazish (amount — ml gaz)
      const gases = this.chem.inPhase(v, 'g').filter(([, n]) => n > 1e-10);
      const total = gases.reduce((a, [, n]) => a + n, 0);
      if (total <= 1e-10) { this.msg('warn', 'info.emptySrc'); return 0; }
      const f = Math.min(1, (amount / 24000) / total);
      for (const [id, n] of gases) {
        this.chem.add(v, id, 'g', -n * f);
        this.chem.bubbleGas(tgt.vessel, id, n * f);
      }
      tgt._fx = tgt._fx || { gasRate: 0, boil: 0, ppt: {} };
      tgt._fx.bubbleIn = (tgt._fx.bubbleIn || 0) + total * f * 3e4;
      this.sim.noteAddition(tgt);
      this.journal(`${this.#label(src)}: ${amount} ml gaz ${this.#label(tgt)} orqali o'tkazildi`, { kind: 'amal' });
      return amount;
    }
    const mL = mode === 'drops' ? amount * DROP_ML : amount;
    if (this.chem.liquidVolume(v) < 1e-4) {
      // suyuqlik yo'q, lekin gaz bo'lishi mumkin (masalan, gaz yig'ilgan silindr) — bu yerda faqat suyuqlik
      this.msg('warn', 'info.emptySrc');
      return 0;
    }
    const moved = this.chem.transfer(v, tgt.vessel, mL, { settled: 0.2 });
    this.sim.noteAddition(tgt);
    const ev = tgt.vessel._lastTransferEvents || [];
    if (ev.some((x) => x.type === 'splash')) { this.effects.splash(tgt); this.msg('danger', 'warn.suv-kislotaga'); }
    this.#dropAnim(tgt, mode, null, mode === 'drops' ? amount : 3);
    const what = mode === 'drops' ? `${amount} tomchi` : `${moved.toFixed(2)} ml`;
    this.journal(`${this.#label(src)} dan ${this.#label(tgt)} ga ${what} qo'shildi (${mode === 'drops' ? 'tomizgich' : 'pipetka'})`, { kind: 'amal' });
    return moved;
  }

  #handleAddEvents(it, ev) {
    if (ev?.some((x) => x.type === 'splash')) { this.effects.splash(it); this.msg('danger', 'warn.suv-kislotaga'); }
  }

  #dropAnim(tgt, mode, color, n = 3) {
    const m = this.effects.mouth(tgt, new THREE.Vector3());
    const c = color ? new THREE.Color(color) : (mode === 'solid' ? new THREE.Color(0xeeeeee) : new THREE.Color(0xdfeff7));
    for (let i = 0; i < Math.min(n, 12); i++) {
      this.effects.soft.spawn({ p: m.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.004, 0.03 + i * 0.006, (Math.random() - 0.5) * 0.004)), v: [0, -0.1, 0], color: c, alpha: 0.95, size: mode === 'solid' ? 0.0015 : 0.003, life: 0.8, gravity: 9.8, floor: (tgt.liquid?.level ?? m.y - 0.05), fadeIn: 0.01 });
    }
  }

  /** Suv qo'shish (yuvgichdan) */
  addWater(it, mL) {
    if (!it?.vessel) return;
    const ev = this.chem.addSubstance(it.vessel, 'H2O', { as: 'liquid', volume_mL: mL });
    this.#handleAddEvents(it, ev);
    this.sim.noteAddition(it);
    this.#dropAnim(it, 'water', '#dfeff7', 5);
    this.journal(`${this.#label(it)} ga ${mL} ml distillangan suv qo'shildi`, { kind: 'amal' });
  }

  // ----------------------------------------------------------------- boshqa amallar
  wash(it) {
    if (!it?.vessel) return;
    this.chem.empty(it.vessel);
    this.effects.cleanVessel(it);
    it.reagent = null;
    if (it.labelMesh) { it.group.remove(it.labelMesh); it.labelMesh = null; }
    it.vessel.isReagentBottle = false;
    this.msg('info', 'info.washed');
    this.journal(`${it.def.name_uz} yuvildi`, { kind: 'amal' });
  }

  toWaste(it) {
    if (!it?.vessel) return;
    this.chem.empty(it.vessel);
    this.effects.cleanVessel(it);
    this.msg('info', 'info.waste');
    this.journal(`${it.def.name_uz} chiqindi idishiga bo'shatildi`, { kind: 'amal' });
  }

  toggleHeater(it) {
    if (!it?.model.heater) return;
    it.heaterOn = !it.heaterOn;
    this.msg('info', it.heaterOn ? 'info.heatOn' : 'info.heatOff');
    this.journal(`${it.def.name_uz}: ${it.heaterOn ? 'yoqildi' : "o'chirildi"}`, { kind: 'amal' });
    this.emit('change', { item: it });
  }

  /** Idishni qizdirish: tagida qizdirgich bo'lmasa — mosini qo'yib, idishni ustiga joylaydi */
  autoHeat(it) {
    if (!it?.vessel) return null;
    const heaters = [...this.bench.items.values()].filter((h) => h.model.heater);
    // allaqachon ulangan
    for (const c of this.bench.graph.connectionsOf(it.id)) {
      const o = this.bench.items.get(c.other.node);
      if (o?.model.heater) { if (!o.heaterOn) this.toggleHeater(o); return o; }
      if (o && ['asbest-tor', 'uchoyoq', 'chinni-uchburchak'].includes(o.def.id)) {
        const burner = heaters.find((h) => this.bench.graph.connectionsOf(h.id).some((x) => x.other.node === o.id || this.bench.items.get(x.other.node)?.def.id === 'uchoyoq'));
        if (burner) { if (!burner.heaterOn) this.toggleHeater(burner); return burner; }
      }
    }
    const tube = it.def.builder === 'probirka';
    const r0 = it.group.position.clone();
    if (it.parentLink) this.bench.detach(it);
    if (tube) {
      // probirka spirt lampasi alangasi ustida (qisqichda ushlab turiladi)
      const lamp = this.bench.add('spirt-lampasi', { x: r0.x + 0.09, z: r0.z });
      lamp.group.updateMatrixWorld(true);
      const tip = lamp.model.flame.getWorldPosition(new THREE.Vector3());
      it.group.position.set(tip.x, tip.y + 0.012, tip.z);
      it.group.rotation.set(0, 0, 0.35);
      it._heldOverFlame = lamp.id;
      if (!lamp.heaterOn) this.toggleHeater(lamp);
      this.journal(`${it.def.name_uz} spirt lampasi alangasida qizdirilmoqda`, { kind: 'amal' });
      return lamp;
    }
    // stakan/kolba: elektr plitka (yonuvchan suyuqlik bo'lsa ham xavfsiz)
    let plate = heaters.find((h) => h.def.id === 'elektr-plitka' && !this.bench.graph.connectionsOf(h.id).length);
    if (!plate) plate = this.bench.add('elektr-plitka', { ...this.bench.findFreeSpot(0.1, { x: r0.x, z: r0.z }) });
    const portA = Object.keys(plate.model.ports)[0];
    const portB = Object.keys(it.model.ports).find((p) => this.bench.graph.canConnect(plate.id, portA, it.id, p).ok);
    if (portB) this.bench.connect(plate, portA, it, portB);
    if (!plate.heaterOn) this.toggleHeater(plate);
    return plate;
  }

  stir(it) {
    if (!it?.vessel) return;
    it.vessel.stirring = true;
    const rodLen = (it.model.vessel?.rimY ?? 80) * MM * 1.15;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, rodLen, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.05 }));
    const pivot = new THREE.Group();
    pivot.add(rod);
    rod.position.set(0.004, rodLen / 2 + (it.model.vessel?.inner[0][1] ?? 2) * MM + 0.002, 0);
    rod.rotation.z = 0.12;
    it.group.add(pivot);
    let t = 0;
    const spin = (dt) => {
      t += dt;
      pivot.rotation.y += dt * 9;
      if (t > 4) { it.group.remove(pivot); rod.geometry.dispose(); it.vessel.stirring = false; this.scene.onFrame.splice(this.scene.onFrame.indexOf(spin), 1); }
    };
    this.scene.onFrame.push(spin);
    this.journal(`${it.def.name_uz} shisha tayoqcha bilan aralashtirildi`, { kind: 'amal' });
  }

  /** Cho'p bilan gazni sinash: 'yonib' (yonib turgan) yoki 'chog' (cho'g'langan) */
  splintTest(it, kind = 'yonib') {
    if (!it?.vessel) return null;
    const v = it.vessel;
    const g = Object.fromEntries(this.chem.inPhase(v, 'g'));
    const rel = it._released || {};
    const amount = (id) => (g[id] || 0) + Math.min(rel[id] || 0, 1e-3) * 0.2;
    const pos = this.effects.mouth(it, new THREE.Vector3()).add(new THREE.Vector3(0, 0.01, 0));
    let res;
    if (kind === 'yonib' && amount('H2') > 2e-6) {
      this.effects.popFlash(pos);
      this.chem.add(v, 'H2', 'g', -(g.H2 || 0));
      if (g.O2) this.chem.add(v, 'O2', 'g', -Math.min(g.O2, (g.H2 || 0) / 2));
      res = 'pop';
    } else if (amount('O2') > 2e-6 && (amount('O2') / Math.max(Object.values(g).reduce((a, b) => a + b, 0), 1e-9) > 0.35 || !Object.keys(g).length)) {
      this.effects.flash(it, '#ffb000');
      res = 'relit';
    } else if (['CO2', 'N2', 'SO2', 'NH3', 'Cl2', 'HCl'].some((x) => amount(x) > 2e-6)) {
      res = 'extinguished';
    } else res = kind === 'yonib' ? 'burns' : 'nothing';
    const key = { pop: 'info.pop', relit: 'info.relit', extinguished: 'info.extinguished' }[res];
    if (key) this.msg(res === 'pop' ? 'success' : 'info', key);
    else this.msg('info', 'info.splintNothing');
    this.journal(`${it.def.name_uz} og'ziga ${kind === 'yonib' ? 'yonib turgan' : "cho'g'langan"} cho'p tutildi: ${res === 'pop' ? '"paq" etgan ovoz (vodorod)' : res === 'relit' ? "cho'p alangalandi (kislorod)" : res === 'extinguished' ? "cho'p o'chdi" : "o'zgarish yo'q"}`, { kind: 'kuzatish' });
    return res;
  }

  /** Yondirish (gugurt/gorelka bilan) — yondirish talab qiladigan reaksiyalar uchun */
  ignite(it) {
    if (!it?.vessel) return;
    it.vessel.ignited = true;
    this.effects.flash(it, '#ffb000');
    this.after(10, () => { if (it.vessel) it.vessel.ignited = false; });
    this.journal(`${it.def.name_uz} ichidagi modda yondirildi`, { kind: 'amal' });
  }

  toggleLight(it) {
    if (!it?.vessel) return;
    it.vessel.illuminated = !it.vessel.illuminated;
    if (it.vessel.illuminated && !it._lamp) {
      it._lamp = new THREE.PointLight(0xb9a8ff, 1.2, 0.5, 2);
      it._lamp.position.set(0.06, (it.model.vessel?.rimY ?? 80) * MM, 0.06);
      it.group.add(it._lamp);
    }
    if (it._lamp) it._lamp.visible = it.vessel.illuminated;
    this.journal(`${it.def.name_uz}: yoritish ${it.vessel.illuminated ? 'yoqildi' : "o'chirildi"}`, { kind: 'amal' });
  }

  /** Alanga sinovi: nixrom simni eritmaga botirib, gorelka alangasiga kiritish */
  flameTest(it) {
    if (!it?.vessel) return null;
    let burner = [...this.bench.items.values()].find((h) => h.model.flame && h.heaterOn && h.def.builder !== 'chop');
    if (!burner) {
      burner = this.bench.add('bunzen-gorelkasi', { ...this.bench.findFreeSpot(0.05, { x: it.group.position.x + 0.12, z: it.group.position.z }) });
      this.toggleHeater(burner);
    }
    const list = this.chem.flameTest(it.vessel);
    const top = list[0];
    if (top) {
      this.effects.tintFlame(burner, top.color, 6);
      this.msg('info', 'info.flameColor', { color: top.desc_uz || top.color });
      this.journal(`Alanga sinovi (${it.def.name_uz}): ${top.desc_uz || top.color}`, { kind: 'kuzatish' });
    } else {
      this.msg('info', 'info.flameColor', { color: "o'zgarmadi" });
      this.journal(`Alanga sinovi (${it.def.name_uz}): alanga rangi o'zgarmadi`, { kind: 'kuzatish' });
    }
    return top || null;
  }

  indicatorPaper(it) {
    if (!it?.vessel) return null;
    const pH = this.chem.pH(it.vessel);
    if (pH === null) { this.msg('warn', 'info.paperDry'); return null; }
    const color = universalIndicatorColor(pH);
    const r = Math.round(pH);
    this.msg('info', 'info.paperColor', { ph: r, color });
    this.journal(`Universal indikator qog'ozi (${it.def.name_uz}): pH ≈ ${r}`, { kind: 'kuzatish' });
    return { pH, color };
  }

  /** Idish og'ziga mos tiqin qo'yish */
  closeWithStopper(it) {
    if (!it?.vessel) return false;
    const mouthPort = (it.size.ports || []).find((p) => ['ogiz', 'shlif-urgochi'].includes(p.type) && !this.bench.graph.connectionsOf(it.id, p.id).length);
    if (!mouthPort) return false;
    const ids = mouthPort.type === 'ogiz' ? ['rezina-tiqin-yaxlit-kichik', 'rezina-tiqin-yaxlit-orta', 'rezina-tiqin-yaxlit-katta'] : ['shlif-tiqin-14-23', 'shlif-tiqin-19-26', 'shlif-tiqin-29-32'];
    for (const id of ids) {
      const def = this.bench.def(id);
      if (!def) continue;
      const st = this.bench.add(id, { x: it.group.position.x + 0.05, z: it.group.position.z + 0.05 });
      const sp = Object.keys(st.model.ports).find((p) => this.bench.graph.canConnect(it.id, mouthPort.id, st.id, p).ok);
      if (sp) { this.bench.connect(it, mouthPort.id, st, sp); this.journal(`${it.def.name_uz} tiqin bilan yopildi`, { kind: 'amal' }); return true; }
      this.bench.remove(st);
    }
    return false;
  }

  removeItem(it) {
    if (!it) return;
    if (this.selected === it) this.select(null);
    this.effects.cleanVessel?.(it);
    this.bench.remove(it);
  }
}
