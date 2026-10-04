// Simulyatsiya sikli: har kadrda idishlar kimyoviy holatini yangilaydi, asbob grafi bo'yicha gaz va bug'ni
// harakatlantiradi, qizdirish/elektrolizni aniqlaydi, hodisalarni effektlar, jurnal va ogohlantirishlarga uzatadi.
import * as THREE from 'three';
import { collectionCheck, PRESSURE_WARN, PRESSURE_POP } from '../engine/apparatus.js';
import { explainNoReaction } from '../engine/explain.js';
import { ZONES, BENCH } from '../scene/room.js';
import { MM } from '../scene/models/glassware.js';

const SETTLE_TAU = { suzmasimon: 5, 'mayda-kristall': 18, kristall: 8, iviqsimon: 45, kukunsimon: 15, "oltin-yomg'ir": 12, kolloid: 400 };
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

export class Simulation extends EventTarget {
  constructor({ bench, chem, effects, scene }) {
    super();
    this.bench = bench;
    this.chem = chem;
    this.db = chem.db;
    this.effects = effects;
    this.scene = scene;
    this.speed = 1;
    this.paused = false;
    this.warned = new Map();
    this.pendingExplain = new Map();
    this.time = 0;
  }

  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
  message(kind, key, params, once = null, cooldown = 8) {
    const k = once || key;
    const last = this.warned.get(k);
    if (last !== undefined && this.time - last < cooldown) return;
    this.warned.set(k, this.time);
    this.emit('message', { kind, key, params });
  }

  /** Foydalanuvchi idishga modda qo'shganda chaqiriladi — natija bo'lmasa tushuntirish uchun */
  noteAddition(item) {
    if (!item?.vessel) return;
    this.pendingExplain.set(item.id, { t: this.time, sources: (item._sources = (item._sources || 0) + 1) });
  }

  update(dt) {
    if (this.paused) return;
    const simDt = dt * this.speed;
    this.time += dt;
    const steps = Math.max(1, Math.ceil(simDt / 0.1));
    const h = simDt / steps;
    const items = [...this.bench.items.values()];
    const vessels = items.filter((i) => i.vessel && !i.flags.cracked);
    const heaters = this.#heatSources(items);
    const electro = this.#electrolysis(items);
    for (const it of vessels) {
      const env = { heater: this.#heaterFor(it, heaters), electrolysis: electro.get(it.id) || null };
      it._heated = !!env.heater;
      it._inHood = this.#inHood(it);
      for (let s = 0; s < steps; s++) {
        const ev = this.chem.step(it.vessel, h, env);
        this.#handleEvents(it, ev, h);
      }
      this.#gasFlow(it, simDt);
      this.#safety(it, simDt, env);
      this.#explainCheck(it);
    }
    this.#instruments(items, electro);
    for (const it of vessels) this.#visuals(it, dt);
  }

  // ------------------------------------------------------------------ qizdirish manbalari
  #heatSources(items) {
    const out = [];
    for (const it of items) {
      if (!it.model.heater || !it.heaterOn) continue;
      it.group.updateMatrixWorld(true);
      const H = it.def.heater;
      if (it.model.flame) {
        const base = it.model.flame.getWorldPosition(new THREE.Vector3());
        const tip = base.clone().add(new THREE.Vector3(0, (H.flameH || 50) * MM, 0));
        out.push({ item: it, kind: 'alanga', base, tip, power: H.power_W, maxT: H.maxT });
      } else {
        const portId = Object.keys(it.model.ports)[0];
        const pose = portId ? this.bench.portPose(it, portId) : null;
        out.push({ item: it, kind: 'sirt', base: pose ? pose.pos : it.group.getWorldPosition(new THREE.Vector3()), power: H.power_W, maxT: H.maxT, r: it.def.builder === 'mufel' ? 0.12 : 0.08 });
      }
    }
    // alanga ustidagi to'rlar va uchburchaklar
    for (const g of items.filter((i) => ['asbest-tor', 'chinni-uchburchak'].includes(i.def.id))) {
      const p = g.group.getWorldPosition(new THREE.Vector3());
      const f = out.find((s) => s.kind === 'alanga' && Math.hypot(s.base.x - p.x, s.base.z - p.z) < 0.06 && p.y > s.base.y && p.y < s.tip.y + 0.12);
      if (f) out.push({ item: g, kind: 'tor', base: p, power: f.power * 0.85, maxT: Math.min(f.maxT, g.def.id === 'asbest-tor' ? 450 : f.maxT), r: 0.07, viaFlame: f });
    }
    return out;
  }

  #heaterFor(it, heaters) {
    it.group.updateMatrixWorld(true);
    const bottom = it.group.localToWorld(_a.set(0, 0, 0));
    for (const s of heaters) {
      const dxz = Math.hypot(s.base.x - bottom.x, s.base.z - bottom.z);
      if (s.kind === 'alanga') {
        if (dxz < 0.035 && bottom.y > s.base.y - 0.01 && bottom.y < s.tip.y + 0.05) {
          it._directFlame = true;
          const f = bottom.y < s.tip.y ? 1 : 0.6;
          return { power_W: s.power * f, maxT: s.maxT, flame: true };
        }
      } else if (dxz < (s.r || 0.08) && bottom.y > s.base.y - 0.03 && bottom.y < s.base.y + 0.03) {
        it._directFlame = false;
        return { power_W: s.power, maxT: s.maxT, flame: false };
      }
    }
    it._directFlame = false;
    return null;
  }

  #inHood(it) {
    const p = it.group.getWorldPosition(_b);
    return p.x > ZONES.hood.x0 && p.x < ZONES.hood.x1 && p.z > BENCH.zc + ZONES.hood.z0 && p.z < BENCH.zc + ZONES.hood.z1;
  }

  // ------------------------------------------------------------------ elektroliz va galvanik element
  #electrolysis(items) {
    const map = new Map();
    const graph = this.bench.graph;
    const viaWire = (itemId, portId) => {
      // klemmadan sim orqali qaysi jihozga borilgan
      for (const c of graph.connectionsOf(itemId, portId)) {
        const other = this.bench.items.get(c.other.node);
        if (!other) continue;
        if (other.def.id === 'simlar') {
          const end = c.other.port === 'a' ? 'b' : 'a';
          const far = graph.connectionsOf(other.id, end)[0];
          if (far) return this.bench.items.get(far.other.node);
        } else return other;
      }
      return null;
    };
    const vesselOfElectrode = (el) => {
      for (const c of graph.connectionsOf(el.id, 'uchi')) {
        const v = this.bench.items.get(c.other.node);
        if (v?.vessel) return v;
      }
      return null;
    };
    for (const ps of items.filter((i) => i.def.id === 'tok-manbai' && i.heaterOn)) {
      const an = viaWire(ps.id, 'plus'), ca = viaWire(ps.id, 'minus');
      if (!an?.def.electrode || !ca?.def.electrode) continue;
      const va = vesselOfElectrode(an), vc = vesselOfElectrode(ca);
      if (va && vc && va === vc) {
        map.set(va.id, { current_A: ps.flags.current ?? 0.5, anode: an.def.electrode.material, cathode: ca.def.electrode.material, speed: 30 });
        va._electrodes = { anode: an, cathode: ca };
      }
    }
    return map;
  }

  #instruments(items, electro) {
    const graph = this.bench.graph;
    for (const it of items) {
      const id = it.def.id;
      if (id === 'voltmetr') {
        // ikki elektrod (turli idishlarda, tuz ko'prigi bilan) — EYuK
        const ends = ['plus', 'minus'].map((p) => {
          for (const c of graph.connectionsOf(it.id, p)) {
            const w = this.bench.items.get(c.other.node);
            if (w?.def.id === 'simlar') {
              const far = graph.connectionsOf(w.id, c.other.port === 'a' ? 'b' : 'a')[0];
              return far ? this.bench.items.get(far.other.node) : null;
            }
            return w;
          }
          return null;
        });
        let emf = 0;
        if (ends[0]?.def.electrode && ends[1]?.def.electrode) {
          const vOf = (el) => graph.connectionsOf(el.id, 'uchi').map((c) => this.bench.items.get(c.other.node)).find((x) => x?.vessel);
          const v1 = vOf(ends[0]), v2 = vOf(ends[1]);
          const bridged = v1 && v2 && (v1 === v2 || items.some((b) => b.def.id === 'tuz-koprigi' && [v1, v2].every((v) => graph.connectionsOf(b.id).some((c) => c.other.node === v.id))));
          if (bridged) {
            const m1 = ends[0].def.electrode.material, m2 = ends[1].def.electrode.material;
            const conc = (v, m) => { const ion = this.db.metals.get(m)?.ion; return ion ? Math.max(this.chem.get(v.vessel, ion, 'aq') / this.chem.aqL(v.vessel), 1e-6) : 1; };
            const e = this.chem.galvanicEMF({ anode: m2, cathode: m1, anodeConc: conc(v2, m2), cathodeConc: conc(v1, m1) });
            emf = e ?? 0;
          }
        }
        it.flags.reading = emf;
        if (it.model.needle) it.model.needle.rotation.z = -Math.max(-1.2, Math.min(1.2, emf * 0.8));
      }
      if (id === 'otkazuvchanlik-lampochkasi') {
        const v = graph.connectionsOf(it.id, 'elektrod').map((c) => this.bench.items.get(c.other.node)).find((x) => x?.vessel);
        const level = v ? this.chem.conductivity(v.vessel).level : "yo'q";
        it.flags.reading = level;
        const m = it.model.bulb?.material;
        if (m) { m.emissive.set(level === 'kuchli' ? 0xffd27a : level === 'kuchsiz' ? 0x7a5a20 : 0x000000); m.emissiveIntensity = level === 'kuchli' ? 2.5 : 1; }
      }
      if (id === 'elektron-tarozi') {
        const pan = this.bench.portPose(it, 'palla');
        let mass = 0;
        for (const o of items) {
          if (o === it || !o.vessel) continue;
          const p = o.group.getWorldPosition(_a);
          if (Math.hypot(p.x - pan.pos.x, p.z - pan.pos.z) < 0.07 && Math.abs(p.y - pan.pos.y) < 0.02) {
            mass += (o.def.vessel?.glass_g ?? 20) + this.chem.massOf(o.vessel, 'aq') + this.chem.massOf(o.vessel, 's') + this.chem.massOf(o.vessel, 'org');
          }
        }
        it.flags.reading = mass - (it.flags.tare || 0);
      }
      if (id === 'termometr' || id === 'ph-metr' || id === 'konduktometr') {
        const portId = id === 'termometr' ? 'uchi' : 'elektrod';
        const v = graph.connectionsOf(it.id, portId).map((c) => this.bench.items.get(c.other.node)).find((x) => x?.vessel)
          || this.#vesselContaining(it, items);
        if (v) {
          if (id === 'termometr') it.flags.reading = v.vessel.T;
          if (id === 'ph-metr') it.flags.reading = this.chem.pH(v.vessel);
          if (id === 'konduktometr') it.flags.reading = this.chem.conductivity(v.vessel).value;
        } else it.flags.reading = id === 'termometr' ? 20 : null;
        if (id === 'termometr' && it.model.column) {
          const T = it.flags.reading ?? 20;
          it.model.column.scale.y = Math.max(0.05, Math.min(1.6, (T + 10) / 120));
        }
      }
    }
  }

  #vesselContaining(tool, items) {
    const p = tool.group.getWorldPosition(new THREE.Vector3());
    for (const o of items) {
      if (!o.vessel || o === tool) continue;
      const q = o.group.getWorldPosition(_a);
      if (Math.hypot(p.x - q.x, p.z - q.z) < (o.liquid ? 0.03 : 0) && p.y > q.y - 0.01 && p.y < q.y + (o.model.vessel?.rimY ?? 100) * MM) return o;
    }
    return null;
  }

  // ------------------------------------------------------------------ hodisalar
  #handleEvents(it, events, dt) {
    if (!events.length) return;
    const v = it.vessel;
    const st = (it._fx = it._fx || { gasRate: 0, boil: 0, ppt: {}, lastRecord: null });
    for (const e of events) {
      switch (e.type) {
        case 'gas': st.gasRate += e.mol / Math.max(dt, 0.01); break;
        case 'boil': st.boil = 1; break;
        case 'precipitate': {
          const p = (st.ppt[e.species] = st.ppt[e.species] || { mol: 0, suspended: 0, color: e.color, texture: e.texture });
          p.mol += e.mol; p.suspended += e.mol; p.color = e.color; p.texture = e.texture;
          if (!it._seenPpt?.has(e.species)) {
            it._seenPpt = it._seenPpt || new Set(); it._seenPpt.add(e.species);
            this.emit('observation', { item: it, kind: 'precipitate', species: e.species, color: e.color, texture: e.texture });
          }
          break;
        }
        case 'record': {
          const r = this.db.reactionById.get(e.record);
          if (r && st.lastRecord !== r.id) {
            st.lastRecord = r.id;
            this.emit('reaction', { item: it, record: r });
          }
          if (r) this.effects?.recordEffects(it, r, e.xi, dt);
          this.pendingExplain.delete(it.id);
          break;
        }
        case 'rule':
        case 'acid-base':
        case 'displacement':
        case 'metal-acid':
        case 'metal-water':
        case 'complex':
        case 'acid-dissolve':
          if (e.type !== 'acid-base' || e.water) this.pendingExplain.delete(it.id);
          if (!it._ruleSeen?.has(e.type + (e.eq || ''))) {
            it._ruleSeen = it._ruleSeen || new Set(); it._ruleSeen.add(e.type + (e.eq || ''));
            if (e.type !== 'acid-base' || e.water) this.emit('rule', { item: it, event: e });
          }
          break;
        case 'deposit': this.effects?.deposit(it, e.species, e.on); break;
        case 'splash': this.effects?.splash(it); this.message('danger', 'warn.suv-kislotaga', null, `splash-${it.id}`, 3); break;
        case 'no-reaction': this.emit('noreaction', { item: it, reasons: [e.reason_uz] }); this.pendingExplain.delete(it.id); break;
        case 'flame': this.effects?.flash(it, e.color); break;
        case 'electrode': this.effects?.electrode(it, e); break;
        case 'crystal': if (!it._crys) { it._crys = true; this.emit('observation', { item: it, kind: 'crystal', species: e.species }); } break;
        default: break;
      }
    }
    void v;
  }

  // ------------------------------------------------------------------ gazlar asbob bo'ylab
  #gasFlow(it, dt) {
    const v = it.vessel;
    const gases = this.chem.inPhase(v, 'g').filter(([, n]) => n > 1e-10);
    if (!gases.length) return;
    const route = this.bench.graph.gasRoute(it.id);
    const exits = route.exits.filter((x) => x.type !== 'yopiq');
    if (route.sealed || !exits.length) {
      // germetik idish: bosim
      const P = this.chem.pressure(v);
      it._pressure = P;
      if (P > PRESSURE_POP) this.#pop(it);
      else if (P > PRESSURE_WARN) this.message('warn', 'warn.bosim', { p: P.toFixed(1) }, `p-${it.id}`, 6);
      return;
    }
    it._pressure = 1;
    // ochiq idish (tiqinsiz): gaz og'izdan chiqadi; yig'gich idishlarda zichlikka qarab ushlanadi
    const isOpen = exits.length === 1 && exits[0].type === 'havo' && exits[0].path.length === 1;
    for (const [gid, n] of gases) {
      const gs = this.db.sub(gid)?.gas;
      let leave;
      if (isOpen) {
        if (gid === 'H2O') leave = n;
        else {
          const up = new THREE.Vector3(0, 1, 0).transformDirection(it.group.matrixWorld).y > 0;
          const heavy = (gs?.rel_density_air ?? 1) > 1.05, light = (gs?.rel_density_air ?? 1) < 0.95;
          const tau = (up && heavy) || (!up && light) ? 90 : 3;
          leave = n * (1 - Math.exp(-dt / tau));
        }
      } else leave = n;
      if (leave <= 0) continue;
      this.chem.add(v, gid, 'g', -leave);
      const share = leave / exits.length;
      for (const ex of exits) this.#deliverGas(it, gid, share, ex, gs);
    }
  }

  #deliverGas(src, gid, n, ex, gs) {
    const items = this.bench.items;
    const vapor = gid === 'H2O' || (this.db.sub(gid)?.state === 'l');
    if (vapor && this.bench.graph.hasCondenser(ex.path)) {
      const cond = ex.path.map((id) => items.get(id)).find((i) => i?.def.builder === 'sovutgich');
      if (cond && !cond.flags.water) { this.message('warn', 'warn.sovutgich-suvi', null, 'sovutgich', 15); this.#release(src, gid, n, ex); return; }
      // kondensatlangan suyuqlik qabul qiluvchi idishga
      const dest = ex.node ? items.get(ex.node) : null;
      const recv = dest?.vessel ? dest : [...items.values()].find((i) => i.vessel && i !== src && this.#below(cond, i));
      if (recv?.vessel) {
        this.chem.add(recv.vessel, gid, this.db.sub(gid)?.miscible_water === false ? 'org' : 'aq', n);
        this.effects?.drip(recv);
        return;
      }
      this.#release(src, gid, n, ex);
      return;
    }
    if (ex.type === 'havo') { this.#release(src, gid, n, ex); return; }
    const dest = items.get(ex.node);
    if (!dest?.vessel) { this.#release(src, gid, n, ex); return; }
    if (ex.type === 'yuvish' || (ex.type === 'idish' && this.chem.liquidVolume(dest.vessel) > 0.3)) {
      // gaz suyuqlik orqali o'tadi (pufakchalar)
      this.chem.bubbleGas(dest.vessel, gid, n);
      dest._fx = dest._fx || { gasRate: 0, boil: 0, ppt: {} };
      dest._fx.bubbleIn = (dest._fx.bubbleIn || 0) + n * 1e4;
      return;
    }
    if (ex.type === 'yiggich' || ex.type === 'suv-osti') {
      const chk = collectionCheck(gs, 'suv-osti');
      if (!chk.ok) this.message('warn', 'warn.yigish-xato', { reason: chk.reason_uz }, `col-${gid}`, 20);
      if (ex.type === 'yiggich') this.chem.add(dest.vessel, gid, 'g', n * chk.efficiency);
      const trough = items.get(ex.trough || ex.node);
      if (trough) { trough._fx = trough._fx || { gasRate: 0, boil: 0, ppt: {} }; trough._fx.bubbleIn = (trough._fx.bubbleIn || 0) + n * 1e4; }
      return;
    }
    // havo siqib chiqarish usulida yig'ish
    const up = new THREE.Vector3(0, 1, 0).transformDirection(dest.group.matrixWorld).y > 0;
    const chk = collectionCheck(gs, up ? 'havo-yuqoriga' : 'havo-pastga');
    if (!chk.ok) this.message('warn', 'warn.yigish-xato', { reason: chk.reason_uz }, `col-${gid}-${up}`, 20);
    this.chem.add(dest.vessel, gid, 'g', n * chk.efficiency);
    if (chk.efficiency < 1) this.#release(dest, gid, n * (1 - chk.efficiency), { type: 'havo', path: [dest.id] });
  }

  #below(cond, item) {
    const c = cond.group.getWorldPosition(new THREE.Vector3());
    const p = item.group.getWorldPosition(_a);
    return Math.hypot(c.x - p.x, c.z - p.z) < 0.5 && p.y < c.y;
  }

  /** Gaz havoga chiqadi: rangli/zaharli gaz effekti va ogohlantirish */
  #release(src, gid, n, ex) {
    const gs = this.db.sub(gid)?.gas;
    const exitItem = ex?.path?.length ? this.bench.items.get(ex.path[ex.path.length - 1]) : src;
    if (n > 1e-7) this.effects?.gasOut(exitItem || src, gid, n, ex);
    if (gs?.toxic && n > 2e-7 && !this.#inHood(exitItem || src)) {
      this.message('danger', 'warn.zaharli-gaz', { gas: this.db.displayOf(gid) }, `tox-${gid}`, 25);
    }
    src._released = src._released || {};
    src._released[gid] = (src._released[gid] || 0) + n;
  }

  #pop(it) {
    const c = this.bench.graph.connectionsOf(it.id).find((x) => {
      const o = this.bench.items.get(x.other.node);
      return o && (o.def.id.startsWith('rezina-tiqin') || o.def.id.startsWith('shlif-tiqin'));
    });
    this.message('danger', 'warn.tiqin-otildi', null, `pop-${it.id}`, 2);
    if (c) {
      const stopper = this.bench.items.get(c.other.node);
      const from = stopper.group.getWorldPosition(new THREE.Vector3());
      this.bench.detach(stopper);
      this.effects?.popStopper(stopper, from);
    }
    for (const [gid, n] of this.chem.inPhase(it.vessel, 'g')) { this.chem.add(it.vessel, gid, 'g', -n); this.#release(it, gid, n, { type: 'havo', path: [it.id] }); }
    this.effects?.sound('pop');
  }

  // ------------------------------------------------------------------ xavfsizlik
  #safety(it, dt, env) {
    const v = it.vessel;
    if (env.heater) {
      const name = it.def.name_uz;
      if ((v.measuring || it.def.vessel?.thick || it.def.vessel?.heatable === false) && !it.flags.cracked) {
        it._unsafeHeat = (it._unsafeHeat || 0) + dt;
        if (it._unsafeHeat > 6) this.#crack(it, name);
      }
      if (env.heater.flame && it.def.vessel?.needsGauze) {
        this.message('warn', 'warn.tor-kerak', null, `gauze-${it.id}`, 20);
        it._unsafeHeat = (it._unsafeHeat || 0) + dt * 0.4;
        if (it._unsafeHeat > 25 && !it.flags.cracked) this.#crack(it, name);
      }
      if (env.heater.flame) {
        for (const [id, n] of this.chem.inPhase(v, 'aq').concat(this.chem.inPhase(v, 'org'))) {
          const s = this.db.sub(id);
          if (n > 1e-4 && s?.hazards?.includes('yonuvchan') && s.state === 'l' && (s.bp ?? 200) < 100) this.message('danger', 'warn.yonuvchan-alanga', { name: s.name_uz }, `flam-${id}`, 30);
        }
      }
    }
    // keskin sovutish (issiq idishga sovuq suv)
    if (it._prevT !== undefined && it._prevT - v.T > 120 && !v.porcelain) this.#crack(it, it.def.name_uz);
    it._prevT = v.T;
    // toshib ketish
    if (it.liquid && this.chem.liquidVolume(v) > it.liquid.capacity_mL * 1.001) {
      const extra = this.chem.liquidVolume(v) - it.liquid.capacity_mL;
      this.chem.transfer(v, this.chem.createVessel({ id: 'tokilgan' }), extra);
      this.effects?.spill(it, extra);
      this.message('warn', 'warn.toshib-ketdi', null, `over-${it.id}`, 10);
    }
  }

  #crack(it, name) {
    it.flags.cracked = true;
    this.effects?.crack(it);
    this.effects?.sound('crack');
    const vol = this.chem.liquidVolume(it.vessel);
    if (vol > 0) this.effects?.spill(it, vol);
    this.chem.empty(it.vessel);
    this.message('danger', 'warn.darz', { name }, `crack-${it.id}`, 1);
    this.emit('accident', { item: it, kind: 'darz' });
  }

  #explainCheck(it) {
    const p = this.pendingExplain.get(it.id);
    if (!p || this.time - p.t < 2.5) return;
    this.pendingExplain.delete(it.id);
    const v = it.vessel;
    const nonWater = [...v.contents.keys()].filter((k) => !k.startsWith('H2O@')).length;
    if ((it._sources || 0) < 2 || nonWater < 2) return;
    if (it._fx?.lastRecord || Object.keys(it._fx?.ppt || {}).length || it._ruleSeen?.size) return;
    this.emit('noreaction', { item: it, reasons: explainNoReaction(this.chem, v) });
  }

  // ------------------------------------------------------------------ ko'rinish
  #visuals(it, dt) {
    const v = it.vessel;
    const L = it.liquid;
    const st = it._fx || { gasRate: 0, boil: 0, ppt: {} };
    if (L) {
      L.volume_mL = this.chem.volumeOf(v, 'aq');
      L.orgVolume_mL = this.chem.volumeOf(v, 'org');
      // muallaq cho'kma (loyqalik) asta cho'kadi
      let turb = 0, tColor = null, settled = 0;
      for (const [sp, p] of Object.entries(st.ppt)) {
        const tau = SETTLE_TAU[p.texture] ?? 15;
        p.suspended *= Math.exp(-(dt * this.speed) / tau);
        const present = this.chem.get(v, sp, 's');
        if (present < p.suspended) p.suspended = present;
        const conc = p.suspended / Math.max(this.chem.aqL(v), 1e-5);
        const tb = Math.min(conc / 0.004, 1);
        if (tb > turb) { turb = tb; tColor = p.color; }
        settled += present - p.suspended;
      }
      const col = this.chem.color(v);
      L.setAppearance({ rgb: col.rgb, intensity: col.intensity, turbidity: turb, turbidColor: tColor, org: L.orgVolume_mL > 0.01 ? this.chem.organicColor(v) : null });
      L.update();
      this.effects?.liquidFx(it, { bubbles: st.gasRate, bubbleIn: st.bubbleIn || 0, boil: st.boil, turbidity: turb, turbidColor: tColor, settled, dt });
      if (L.overflow && L.volume_mL > 0.05 && !it._pouring) {
        // og'ib turgan idishdan oqish (quyish boshqaruvchisi bo'lmasa — to'kilish)
        const rate = Math.min(L.volume_mL, 60 * Math.pow(L.overflow.excess * 1000, 1.5) * dt);
        if (rate > 0.001) { this.chem.transfer(v, this.chem.createVessel({ id: 'tokilgan' }), rate); this.effects?.spill(it, rate); }
      }
    }
    this.effects?.solids(it, v, dt);
    this.effects?.headspace(it, v);
    st.gasRate *= 0.6;
    st.bubbleIn = (st.bubbleIn || 0) * 0.6;
    st.boil *= 0.9;
  }
}
