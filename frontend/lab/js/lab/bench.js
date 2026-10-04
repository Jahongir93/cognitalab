// Laboratoriya stoli: jihozlar nusxalari, ularning 3D joylashuvi, ulanishlar (asbob grafi) va saqlash.
import * as THREE from 'three';
import { buildEquipment, bottleLabel } from '../scene/models/equipment.js';
import { LiquidBody } from '../scene/liquid.js';
import { MM } from '../scene/models/glassware.js';
import { BENCH, ZONES } from '../scene/room.js';
import { ApparatusGraph } from '../engine/apparatus.js';
import * as M from '../scene/materials.js';

let SEQ = 1;
const ALIGN_TYPES = new Set(['tiqin', 'tiqin-teshik', 'naycha-uchi', 'naycha-uchi-tor', 'shlif-erkak', 'shlif-urgochi', 'voronka-oyogi', 'elektrod-uchi', 'yiggich-joyi']);
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();

export class Bench extends EventTarget {
  /**
   * @param {{scene: import('../scene/app.js').LabScene, db: any, chem: any, equipment: any, ports: any}} o
   */
  constructor({ scene, db, chem, equipment, ports }) {
    super();
    this.scene = scene;
    this.db = db;
    this.chem = chem;
    this.equipment = equipment;
    this.defs = new Map(equipment.items.map((d) => [d.id, d]));
    this.graph = new ApparatusGraph(ports);
    this.items = new Map();
    this.hoses = new Set();
    scene.onFrame.push(() => this.#updateHoses());
  }

  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }

  def(id) { return this.defs.get(id); }

  /**
   * Jihozni stolga qo'yish.
   * @param {string} defId
   * @param {{sizeId?:string, x?:number, z?:number, reagent?:{id:string, conc_M?:number, volume_mL?:number, mass_g?:number, form?:string, as?:string}, id?:string}} o
   */
  add(defId, o = {}) {
    const def = this.def(defId);
    if (!def) throw new Error(`Jihoz topilmadi: ${defId}`);
    const size = (o.sizeId && def.sizes.find((s) => s.id === String(o.sizeId))) || def.sizes[0];
    const model = buildEquipment(def, size);
    const id = o.id || `${defId}#${SEQ++}`;
    const item = { id, def, size, model, group: model.group, vessel: null, liquid: null, heaterOn: false, reagent: null, flags: {}, tilt: 0 };
    model.group.userData.itemId = id;
    model.group.traverse((m) => { m.userData.itemId = id; });
    this.scene.world.add(model.group);
    // kimyoviy idish
    const vinfo = model.vessel;
    if (vinfo && (def.vessel || ['probirka', 'stakan', 'erlenmeyer', 'kolba', 'olchov-kolba', 'silindr', 'menzurka', 'sklyanka', 'kosacha', 'tigel', 'petri', 'soat-oynasi', 'hovoncha'].includes(def.builder))) {
      const liquid = new LiquidBody(vinfo.inner, vinfo.rimY, model.group, this.scene.world);
      item.liquid = liquid;
      item.vessel = this.chem.createVessel({
        id, kind: def.id, capacity_mL: liquid.capacity_mL, glass_g: def.vessel?.glass_g ?? 20, heatable: def.vessel?.heatable ?? true,
      });
      item.vessel.porcelain = def.category === 'chinni';
      item.vessel.measuring = !!def.vessel?.measuring;
    }
    this.graph.addNode(id, def, size);
    this.items.set(id, item);
    // joylashuv
    const p = (o.x !== undefined && o.z !== undefined) ? { x: o.x, z: o.z } : this.findFreeSpot(this.radiusOf(item));
    model.group.position.set(p.x, BENCH.y, p.z);
    if (o.reagent) this.fillReagent(item, o.reagent);
    this.emit('change', { type: 'add', item });
    if (def.flexible) this.hoses.add(item);
    return item;
  }

  /** Reaktiv sklyankasini to'ldirish va yorliq qo'yish */
  fillReagent(item, r) {
    const s = this.db.sub(r.id);
    if (!s || !item.vessel) return;
    const as = r.as || (r.conc_M ? 'solution' : (s.state === 'g' ? 'gas' : (s.state === 'l' || s.state === 'aq' || s.mixture || s.mixture_opaque) ? 'liquid' : 'solid'));
    if (as === 'solution' || (as === 'liquid')) {
      const vol = r.volume_mL ?? Math.min(item.liquid.capacity_mL * 0.7, 200);
      this.chem.addSubstance(item.vessel, r.id, { as, conc_M: r.conc_M, volume_mL: vol });
    } else if (as === 'gas') {
      this.chem.addSubstance(item.vessel, r.id, { as: 'gas', mol: (item.liquid?.capacity_mL ?? 250) / 24000 });
    } else {
      this.chem.addSubstance(item.vessel, r.id, { as: 'solid', mass_g: r.mass_g ?? 25, form: r.form });
    }
    item.reagent = { ...r, as };
    item.vessel.isReagentBottle = true;
    if (item.model.labelR) {
      const label = [s.display || s.name_uz, s.name_uz.length > 22 ? s.name_uz.slice(0, 22) + '…' : s.name_uz, r.conc_M ? `${String(r.conc_M).replace('.', ',')} M` : (as === 'solid' ? (r.form || s.appearance?.form || '') : '')];
      if (item.labelMesh) item.group.remove(item.labelMesh);
      item.labelMesh = bottleLabel(item.group, item.model.labelR, item.model.labelY, label);
    }
  }

  radiusOf(item) {
    const box = new THREE.Box3().setFromObject(item.group);
    const s = box.getSize(_v);
    return Math.max(Math.max(s.x, s.z) / 2, 0.025);
  }

  /** Stolda bo'sh joy topish (old markazdan boshlab) */
  findFreeSpot(r, near = null) {
    const cx = near?.x ?? -0.1, cz = near?.z ?? BENCH.zc + 0.18;
    const occupied = [...this.items.values()].filter((i) => !i.group.parent?.userData?.itemId && i.group.parent === this.scene.world).map((i) => ({ x: i.group.position.x, z: i.group.position.z, r: this.radiusOf(i) }));
    for (let ring = 0; ring < 40; ring++) {
      const n = Math.max(1, ring * 6);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const x = cx + Math.cos(a) * ring * 0.045, z = cz + Math.sin(a) * ring * 0.03;
        if (x < BENCH.x0 + 0.05 + r || x > ZONES.hood.x0 - r - 0.01 || z < BENCH.zc - 0.4 + r || z > BENCH.zc + 0.4 - r) continue;
        if (Math.hypot(x - ZONES.sink.x, z - (BENCH.zc + ZONES.sink.z)) < ZONES.sink.r + r) continue;
        if (occupied.every((o) => Math.hypot(o.x - x, o.z - z) > o.r + r + 0.01)) return { x, z };
      }
    }
    return { x: cx, z: cz };
  }

  remove(item) {
    if (typeof item === 'string') item = this.items.get(item);
    if (!item) return;
    // bolalarni ajratish
    for (const child of [...item.group.children]) {
      if (child.userData.itemId && child.userData.itemId !== item.id && this.items.has(child.userData.itemId)) this.detachObject(this.items.get(child.userData.itemId));
    }
    this.graph.removeNode(item.id);
    item.liquid?.dispose();
    item.group.parent?.remove(item.group);
    this.items.delete(item.id);
    this.hoses.delete(item);
    this.emit('change', { type: 'remove', item });
  }

  clear() { for (const it of [...this.items.values()]) this.remove(it); }

  /** Portning dunyo koordinatalaridagi joyi va yo'nalishi */
  portPose(item, portId) {
    const o = item.model.ports[portId];
    if (!o) return null;
    item.group.updateMatrixWorld(true);
    const pos = o.getWorldPosition(new THREE.Vector3());
    const d = o.userData.port.dir;
    const dir = new THREE.Vector3(d[0], d[1], d[2]).transformDirection(item.group.matrixWorld);
    return { pos, dir, def: o.userData.port };
  }

  /** Bo'sh portlar */
  freePorts(item) {
    return (item.size.ports || []).filter((p) => p.multi || !this.graph.connectionsOf(item.id, p.id).length);
  }

  /**
   * Ikki jihozni ulash: b jihozi (harakatlanuvchi) a ning portiga joylashadi.
   * @returns {{ok:boolean, reason?:string}}
   */
  connect(a, pa, b, pb, { moveB = true, depth = null } = {}) {
    const r = this.graph.canConnect(a.id, pa, b.id, pb);
    if (!r.ok) { this.emit('message', { kind: 'warn', key: 'info.cannotConnect', params: { reason: r.reason } }); return r; }
    this.graph.connect(a.id, pa, b.id, pb);
    const flexible = a.def.flexible || b.def.flexible;
    if (!flexible && moveB && !b.parentLink) this.#attach(a, pa, b, pb, depth);
    this.emit('change', { type: 'connect', a, b, pa, pb });
    return { ok: true };
  }

  #attach(a, pa, b, pb, depth) {
    const A = this.portPose(a, pa);
    const bPort = b.model.ports[pb];
    const typeA = A.def.type, typeB = bPort.userData.port.type;
    // b ni dunyoga qaytarib, yo'nalishni sozlaymiz
    this.scene.world.attach(b.group);
    const align = ALIGN_TYPES.has(typeB) || ALIGN_TYPES.has(typeA);
    if (align) {
      const d = bPort.userData.port.dir;
      const dirB = new THREE.Vector3(d[0], d[1], d[2]).applyQuaternion(b.group.quaternion);
      _q.setFromUnitVectors(dirB.normalize(), A.dir.clone().negate().normalize());
      b.group.quaternion.premultiply(_q);
    }
    b.group.updateMatrixWorld(true);
    const bp = bPort.getWorldPosition(new THREE.Vector3());
    const delta = A.pos.clone().sub(bp);
    b.group.position.add(delta);
    // naychani idish ichiga chuqurroq tushirish (pufakchalar suyuqlik ichida chiqishi uchun)
    if ((typeB === 'naycha-uchi' || typeB === 'elektrod-uchi') && typeA === 'ogiz' && a.model.vessel) {
      const depthM = depth ?? Math.max((a.model.vessel.rimY - (a.model.vessel.inner[0][1] + 6)) * MM * 0.85, 0);
      b.group.position.addScaledVector(A.dir, -depthM);
    }
    a.group.attach(b.group);
    b.parentLink = { item: a.id, port: pa, own: pb };
  }

  /** Jihozni ulanishlardan ajratish va stolga qaytarish */
  detach(item) {
    this.graph.disconnect(item.id);
    this.detachObject(item);
    for (const other of this.items.values()) if (other.parentLink?.item === item.id) this.detachObject(other);
    this.emit('change', { type: 'detach', item });
  }

  detachObject(item) {
    if (!item.parentLink && item.group.parent === this.scene.world) return;
    this.scene.world.attach(item.group);
    item.parentLink = null;
    // tik holatga qaytarish va stolga tushirish
    const e = new THREE.Euler().setFromQuaternion(item.group.quaternion, 'YXZ');
    item.group.rotation.set(0, e.y, 0);
    item.group.position.y = BENCH.y;
  }

  /** Ildiz jihoz (sudrash uchun) */
  rootOf(item) {
    let cur = item;
    for (let guard = 0; guard < 20 && cur.parentLink; guard++) cur = this.items.get(cur.parentLink.item) || cur;
    return cur;
  }

  // ------------------------------------------------------------- egiluvchan shlang va simlar
  #updateHoses() {
    for (const h of this.hoses) {
      const ends = ['a', 'b'].map((p) => {
        const c = this.graph.connectionsOf(h.id, p)[0];
        if (!c) return null;
        const other = this.items.get(c.other.node);
        return other ? this.portPose(other, c.other.port) : null;
      });
      const key = ends.map((e) => (e ? `${e.pos.x.toFixed(3)},${e.pos.y.toFixed(3)},${e.pos.z.toFixed(3)}` : '-')).join('|');
      if (key === h._hoseKey) continue;
      h._hoseKey = key;
      if (!ends[0] && !ends[1]) continue;
      const start = ends[0]?.pos || h.group.localToWorld(new THREE.Vector3(0, 0.005, 0));
      const end = ends[1]?.pos || start.clone().add(new THREE.Vector3(0.2, 0, 0));
      const d0 = ends[0]?.dir || new THREE.Vector3(0, 1, 0);
      const d1 = ends[1]?.dir || new THREE.Vector3(0, 1, 0);
      const dist = start.distanceTo(end);
      const sag = Math.max(0.04, dist * 0.35);
      const p1 = start.clone().addScaledVector(d0, Math.min(0.04, dist * 0.3));
      const p2 = end.clone().addScaledVector(d1, Math.min(0.04, dist * 0.3));
      const mid = start.clone().lerp(end, 0.5);
      mid.y = Math.max(Math.min(start.y, end.y) - sag, BENCH.y + 0.006);
      const curve = new THREE.CatmullRomCurve3([start, p1, mid, p2, end]);
      const r = h.def.id === 'simlar' ? 0.0015 : 0.004;
      const geo = new THREE.TubeGeometry(curve, 40, r, 8, false);
      if (!h._hoseMesh) {
        h._hoseMesh = new THREE.Mesh(geo, h.def.id === 'simlar' ? M.plastic(0xdc2626) : M.rubber(0xb23a28));
        h._hoseMesh.castShadow = true;
        h._hoseMesh.userData.itemId = h.id;
        this.scene.world.add(h._hoseMesh);
        // asl modelni yashirish
        h.group.visible = false;
      } else {
        h._hoseMesh.geometry.dispose();
        h._hoseMesh.geometry = geo;
      }
    }
  }

  // ------------------------------------------------------------- saqlash va tiklash
  serialize() {
    const items = [];
    for (const it of this.items.values()) {
      it.group.updateMatrixWorld(true);
      const p = it.group.getWorldPosition(new THREE.Vector3());
      const q = it.group.getWorldQuaternion(new THREE.Quaternion());
      items.push({
        id: it.id, def: it.def.id, size: it.size.id, pos: [p.x, p.y, p.z], quat: [q.x, q.y, q.z, q.w],
        vessel: it.vessel ? this.chem.serialize(it.vessel) : null, reagent: it.reagent, heaterOn: it.heaterOn, flags: it.flags,
      });
    }
    return { version: 1, items, edges: this.graph.edges.map((e) => ({ a: e.a, b: e.b })) };
  }

  load(state) {
    this.clear();
    for (const s of state.items || []) {
      const it = this.add(s.def, { sizeId: s.size, id: s.id, x: s.pos[0], z: s.pos[2] });
      it.group.position.set(s.pos[0], s.pos[1], s.pos[2]);
      it.group.quaternion.set(...s.quat);
      if (s.vessel && it.vessel) {
        const v = this.chem.deserialize(s.vessel);
        Object.assign(it.vessel, { contents: v.contents, forms: v.forms, T: v.T, deposits: v.deposits, firedRecords: v.firedRecords });
      }
      it.reagent = s.reagent || null;
      if (it.reagent && it.model.labelR) {
        const sb = this.db.sub(it.reagent.id);
        if (sb) it.labelMesh = bottleLabel(it.group, it.model.labelR, it.model.labelY, [sb.display || sb.name_uz, sb.name_uz.slice(0, 22), it.reagent.conc_M ? `${it.reagent.conc_M} M` : '']);
      }
      it.heaterOn = !!s.heaterOn;
      it.flags = s.flags || {};
    }
    for (const e of state.edges || []) {
      const a = this.items.get(e.a.node), b = this.items.get(e.b.node);
      if (!a || !b) continue;
      this.graph.connect(a.id, e.a.port, b.id, e.b.port);
      if (!a.def.flexible && !b.def.flexible && !b.parentLink) {
        a.group.attach(b.group);
        b.parentLink = { item: a.id, port: e.a.port, own: e.b.port };
      }
    }
    for (const it of this.items.values()) if (it.def.flexible) this.hoses.add(it);
    this.emit('change', { type: 'load' });
  }
}
