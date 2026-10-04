// Vizual effektlar: pufakchalar, cho'kma, rangli gazlar, tutun, bug', kondensat, alanga, uchqun, Mg yorug'ligi,
// cho'g'lanish, qaynash, issiqlik to'lqini, "paq", metall qoplamalari, kristallar, ho'l devorlar, qurum, darz, to'kilish.
// Simulyatsiya (lab/simulation.js) hodisalarini 3D sahnaga aylantiradi. Kimyo mantiqi bu yerda yo'q.
import * as THREE from 'three';
import { ParticlePool } from './particles.js';
import { Flame } from './flame.js';
import * as audio from './audio.js';
import { MM } from '../models/glassware.js';
import { radiusAt } from '../models/profiles.js';
import { BENCH } from '../room.js';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const FALLBACK_GAS = { I2: '#8a3fbf', Br2: '#b5521b', NO2: '#a8461c', Cl2: '#c8d24a', F2: '#e6e6a0', ClO2: '#d8c040' };
const PIECE_FORMS = new Set(['granula', "bo'lak", 'lenta', 'sim', 'plastinka', 'qirindi', 'mix', 'tola']);
const MIRROR = new Set(['Ag', 'Cu']);

function rnd(a, b) { return a + Math.random() * (b - a); }
function hexColor(h, fallback = 0xffffff) { try { return new THREE.Color(h || fallback); } catch { return new THREE.Color(fallback); } }

export class Effects {
  /**
   * @param {{scene: import('../app.js').LabScene, bench: any, chem: any}} o
   */
  constructor({ scene, bench, chem }) {
    this.scene = scene;
    this.bench = bench;
    this.chem = chem;
    this.db = chem.db;
    this.q = scene.quality;
    this.k = this.q.particles;
    const root = new THREE.Group();
    root.name = 'effektlar';
    scene.scene.add(root);
    this.root = root;
    this.soft = new ParticlePool(root, 'soft', Math.round(3000 * this.k) + 200);
    this.bub = new ParticlePool(root, 'bubble', Math.round(2500 * this.k) + 200);
    this.add = new ParticlePool(root, 'add', Math.round(1500 * this.k) + 100);
    this.time = 0;
    this.flames = new Map();
    this.anims = [];
    this.puddles = [];
    this.lights = [];
    // umumiy chaqnash yorug'ligi (Mg yonishi, portlash)
    this.flashLight = new THREE.PointLight(0xffffff, 0, 1.6, 2);
    root.add(this.flashLight);
    this.flashLevel = 0;
    scene.onFrame.push((dt) => this.update(dt));
  }

  // ----------------------------------------------------------------- yordamchi geometriya
  #vfx(it) {
    if (!it._vfx) it._vfx = { levels: {}, acc: {}, peak: {}, solids: new Map(), mirror: 0, soot: 0, cond: 0, wetTop: -1, wetT: 0 };
    return it._vfx;
  }

  mouth(it, out = new THREE.Vector3()) {
    it.group.updateMatrixWorld(true);
    if (it.model.vessel) return it.group.localToWorld(out.set(0, it.model.vessel.rimY * MM, 0));
    const box = new THREE.Box3().setFromObject(it.group);
    return box.getCenter(out).setY(box.max.y);
  }

  bottom(it, out = new THREE.Vector3()) {
    const y = it.model.vessel ? it.model.vessel.inner[0][1] * MM + 0.0015 : 0.002;
    return it.group.localToWorld(out.set(0, y, 0));
  }

  /** Suyuqlik ichidagi tasodifiy nuqta (pastroqlari ustun) */
  #pointInLiquid(it, out, low = true) {
    const L = it.liquid;
    if (!L || !L.nSamples) return null;
    const e = it.group.matrixWorld.elements;
    let best = null, by = Infinity;
    for (let k = 0; k < (low ? 4 : 1); k++) {
      for (let guard = 0; guard < 8; guard++) {
        const i = (Math.random() * L.nSamples) | 0;
        const x = L.samples[i * 3], y = L.samples[i * 3 + 1], z = L.samples[i * 3 + 2];
        const wy = e[1] * x + e[5] * y + e[9] * z + e[13];
        if (wy < L.level - 0.0015) {
          if (wy < by) { by = wy; best = [x, y, z]; }
          break;
        }
      }
    }
    if (!best) return null;
    return it.group.localToWorld(out.set(best[0], best[1], best[2]));
  }

  #upright(it) { return _w.set(0, 1, 0).transformDirection(it.group.matrixWorld).y; }

  // ----------------------------------------------------------------- simulyatsiya chaqiradigan API
  /** Tajriba yozuvi bo'yicha effektlar (har qadamda: xi — shu qadamdagi o'zgarish, dt — qadam) */
  recordEffects(it, r, xi, dt) {
    const f = this.#vfx(it);
    const rate = xi / Math.max(dt || 0.1, 1e-3);
    f.peak[r.id] = Math.max(f.peak[r.id] || 0, rate);
    const lvl = rate < 1e-9 ? 0 : Math.min(1, rate / f.peak[r.id]);
    const set = (k, v = lvl) => { f.levels[k] = Math.max(f.levels[k] || 0, v); };
    const obs = r.observations || {};
    for (const e of obs.effects || []) set(typeof e === 'string' ? e : e.type);
    if (obs.heat === 'kuchli-ekzotermik') set('heat');
    if (obs.flame?.color) { set('flame'); f.flameColor = obs.flame.color; }
    if ((obs.effects || []).some((e) => e.type === 'mirror')) {
      const ag = (r._net?.right || []).find((t) => MIRROR.has(t.id));
      f.mirrorColor = this.db.sub(ag?.id || 'Ag')?.appearance?.color || '#d8d8dc';
    }
    if (/qurum|qora tutun|dudlanib/i.test(obs.text_uz || '')) set('soot');
  }

  deposit(it, species, on) {
    if (!on) return;
    const f = this.#vfx(it);
    const piece = f.solids.get(on);
    if (!piece) return;
    const c = hexColor(this.db.sub(species)?.appearance?.color, 0x8a5a3a);
    piece.coat = Math.min((piece.coat || 0) + 0.02, 0.9);
    piece.coatColor = c;
  }

  /** Elektroliz: elektrodlarda gaz pufakchalari va metall qoplami */
  electrode(it, e) {
    const el = it._electrodes?.[e.electrode === 'katod' ? 'cathode' : 'anode'];
    if (!el) return;
    const f = this.#vfx(el);
    if (e.deposit) {
      f.coat = Math.min((f.coat || 0) + 0.01, 0.9);
      f.coatColor = hexColor(this.db.sub(e.species)?.appearance?.color, 0x8a5a3a);
      el.group.traverse((m) => {
        if (!m.isMesh || m.userData.part === 'clamp') return;
        if (!m.userData._baseColor) { m.material = m.material.clone(); m.userData._baseColor = m.material.color.clone(); }
        if (m.userData.part !== 'sim') m.material.color.copy(m.userData._baseColor).lerp(f.coatColor, f.coat);
      });
    } else if (this.db.sub(e.species)?.state === 'g') {
      f.gasAt = (f.gasAt || 0) + e.mol * 4e5;
      f.gasHost = it;
    }
  }

  liquidFx(it, o) {
    const f = this.#vfx(it);
    const L = it.liquid;
    if (!L) return;
    const dt = o.dt;
    const k = this.k;
    const vol = L.volume_mL + L.orgVolume_mL;
    const liqCol = L.material.color;
    // gaz pufakchalari
    let n = Math.min(o.bubbles * 4e4, 160) + Math.min(o.bubbleIn * 30, 80) + o.boil * 70;
    if ((f.levels.foam || 0) > 0.05) n += 40 * f.levels.foam;
    f.acc.bub = (f.acc.bub || 0) + n * k * dt;
    if (vol > 0.2) {
      while (f.acc.bub >= 1) {
        f.acc.bub -= 1;
        const p = this.#pointInLiquid(it, _v, true);
        if (!p) break;
        const big = o.boil > 0.3 && Math.random() < 0.6;
        const s = big ? rnd(0.0025, 0.005) : rnd(0.0008, 0.0022);
        this.bub.spawn({ p, v: [rnd(-0.004, 0.004), big ? rnd(0.08, 0.15) : rnd(0.03, 0.07), rnd(-0.004, 0.004)], color: [0.85 + liqCol.r * 0.15, 0.9 + liqCol.g * 0.1, 0.95], alpha: 0.85, size: s, life: 6, ceil: L.level - 0.0004, fadeIn: 0.05 });
      }
    } else f.acc.bub = 0;
    audio.level('fizz', Math.min(o.bubbles * 4e3, 1));
    if (o.boil > 0.1) audio.level('boil', o.boil);
    // ko'pik: sath ustida oq qatlam
    if ((f.levels.foam || 0) > 0.05) {
      f.acc.foam = (f.acc.foam || 0) + 60 * f.levels.foam * k * dt;
      while (f.acc.foam >= 1) {
        f.acc.foam -= 1;
        const p = this.#pointInLiquid(it, _v, false);
        if (!p) break;
        p.y = L.level + rnd(0, 0.004);
        this.soft.spawn({ p, v: [0, rnd(0.001, 0.004), 0], color: [0.97, 0.97, 0.95], alpha: 0.9, size: rnd(0.004, 0.008), life: rnd(2, 4), drag: 2, fadeIn: 0.2 });
      }
    }
    // qaynash / issiq suyuqlikdan bug'
    const T = it.vessel.T;
    if (o.boil > 0.1 || T > 75) {
      const rate = (o.boil > 0.1 ? 25 : 4 * (T - 75) / 25) * k;
      f.acc.steam = (f.acc.steam || 0) + rate * dt;
      while (f.acc.steam >= 1) {
        f.acc.steam -= 1;
        const p = this.mouth(it, _v);
        this.soft.spawn({ p: p.add(_w.set(rnd(-0.006, 0.006), 0.003, rnd(-0.006, 0.006))), v: [rnd(-0.01, 0.01), rnd(0.04, 0.08), rnd(-0.01, 0.01)], color: [1, 1, 1], alpha: o.boil > 0.1 ? 0.22 : 0.1, size: 0.012, grow: 3, life: rnd(1.5, 3), drag: 0.8, fadeIn: 0.3 });
      }
      f.cond = Math.min(1, f.cond + dt * (o.boil > 0.1 ? 0.08 : 0.02));
    } else f.cond = Math.max(0, f.cond - dt * 0.01);
    this.#wetWalls(it, f, dt);
    this.#condensate(it, f);
    this.#coatings(it, f);
  }

  /** Qattiq moddalar: kukun uyumi, cho'kma qatlami, metall bo'laklari, kristallar, cho'g'lanish */
  solids(it, v, dt) {
    if (!it.model.vessel) return;
    const f = this.#vfx(it);
    const inner = it.model.vessel.inner;
    const y0 = inner[0][1];
    const seen = new Set();
    let stackY = y0;
    const list = this.chem.inPhase(v, 's').filter(([, n]) => n > 1e-8).sort((a, b) => b[1] - a[1]);
    for (const [id, n] of list) {
      const s = this.db.sub(id);
      if (!s) continue;
      seen.add(id);
      const ppt = it._fx?.ppt?.[id];
      const visMol = Math.max(0, n - (ppt ? ppt.suspended : 0));
      const form = v.forms[id] || s.appearance?.form || 'kukun';
      const piece = (s.metal && form !== 'kukun') || PIECE_FORMS.has(form);
      let obj = f.solids.get(id);
      if (!obj || obj.piece !== piece || obj.form !== form) {
        if (obj) this.#disposeSolid(it, obj);
        obj = this.#makeSolid(it, id, s, form, piece);
        f.solids.set(id, obj);
      }
      const vol_cm3 = (visMol * (s.M || 50)) / (s.density || 2.2);
      if (piece) {
        const scale = Math.cbrt(Math.max(vol_cm3, 1e-4) / Math.max(obj.vol0, 1e-4));
        obj.mesh.scale.setScalar(Math.min(Math.max(scale, 0.15), 1.4));
        obj.mesh.position.y = (y0 + 0.4) * MM;
        obj.mesh.visible = visMol > 1e-7;
      } else {
        // uyum: hajm -> balandlik (sochiluvchan, g'ovak ~2x)
        const rB = Math.max(radiusAt(inner, stackY + 1.5), 2);
        const area = Math.PI * Math.pow(rB * MM, 2);
        const loose = ppt ? 3.5 : 1.8;
        let h = (vol_cm3 * 1e-6 * loose) / area;
        h = Math.min(Math.max(h, visMol > 1e-7 ? 0.0003 : 0), (it.model.vessel.rimY - y0) * MM * 0.6);
        obj.mesh.visible = h > 0.0001;
        obj.mesh.scale.set(rB * MM * 0.97, Math.max(h, 1e-5), rB * MM * 0.97);
        obj.mesh.position.y = stackY * MM;
        stackY += h / MM;
      }
      // cho'g'lanish (qizigan qattiq modda)
      const glow = Math.max(0, Math.min(1, (v.T - 450) / 500)) + (f.levels.glow || 0) * 0.8;
      const m = obj.mesh.material;
      if (m.emissive) {
        if (glow > 0.02) { m.emissive.setRGB(1, 0.35 + glow * 0.3, 0.08 * glow); m.emissiveIntensity = glow * 2; } else m.emissiveIntensity = 0;
      }
      if (obj.coat && m.color) m.color.copy(obj.base).lerp(obj.coatColor, obj.coat);
    }
    for (const [id, obj] of f.solids) if (!seen.has(id)) { this.#disposeSolid(it, obj); f.solids.delete(id); }
  }

  #makeSolid(it, id, s, form, piece) {
    const col = hexColor(s.precipitate?.color || s.appearance?.color, 0xdddddd);
    const metal = !!s.metal;
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: metal ? 0.35 : 0.85, metalness: metal ? 0.85 : 0, emissive: 0x000000 });
    const inner = it.model.vessel.inner;
    const rIn = Math.max(radiusAt(inner, inner[0][1] + 4), 3);
    let mesh, vol0 = 1;
    if (piece) {
      const g = new THREE.Group();
      if (form === 'lenta') {
        const len = Math.min(rIn * 1.6, 40);
        const m = new THREE.Mesh(new THREE.BoxGeometry(len * MM, 0.3 * MM, 3 * MM), mat);
        m.rotation.z = 0.25;
        m.position.y = 2 * MM;
        g.add(m); vol0 = (len * 0.3 * 3) / 1000;
      } else if (form === 'sim') {
        const m = new THREE.Mesh(new THREE.TorusKnotGeometry(Math.min(rIn * 0.45, 5) * MM, 0.4 * MM, 48, 6, 2, 5), mat);
        m.rotation.x = Math.PI / 2; m.position.y = 2 * MM; g.add(m); vol0 = 0.05;
      } else if (form === 'plastinka') {
        const w = Math.min(rIn * 1.2, 25);
        const m = new THREE.Mesh(new THREE.BoxGeometry(w * MM, 30 * MM, 0.8 * MM), mat);
        m.position.y = 15 * MM; m.rotation.z = 0.12; g.add(m); vol0 = (w * 30 * 0.8) / 1000;
      } else {
        // granula / bo'lak / qirindi: tartibsiz bo'laklar
        const count = form === 'qirindi' ? 14 : 5;
        const size = form === 'qirindi' ? 1.2 : Math.min(rIn * 0.35, 4);
        for (let i = 0; i < count; i++) {
          const geo = form === 'qirindi' ? new THREE.BoxGeometry(size * 2.5 * MM, 0.3 * MM, size * MM) : new THREE.IcosahedronGeometry(size * MM * rnd(0.7, 1.1), 0);
          const m = new THREE.Mesh(geo, mat);
          const a = rnd(0, Math.PI * 2), r = rnd(0, rIn * 0.6) * MM;
          m.position.set(Math.cos(a) * r, size * 0.6 * MM, Math.sin(a) * r);
          m.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
          g.add(m);
        }
        vol0 = (count * Math.pow(size, 3) * 2.5) / 1000;
      }
      mesh = g;
      mesh.material = mat;
      g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    } else {
      // gumbaz shaklidagi uyum (birlik o'lcham, scale bilan)
      const pts = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(Math.max(1 - t * t * 0.15, 0) * (1 - Math.pow(t, 6)), t)); }
      pts.unshift(new THREE.Vector2(0, 0));
      pts.push(new THREE.Vector2(0, 1));
      const geo = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p.x, p.y)), 24);
      mesh = new THREE.Mesh(geo, mat);
      if (form === 'kristall' || s.precipitate?.texture === 'kristall' || s.precipitate?.texture === "oltin-yomg'ir") {
        mat.roughness = 0.25; mat.metalness = 0.15;
        // kristall yuzalari: ustiga mayda oktaedrlar
        const cr = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.18, 0), mat, 18);
        const m4 = new THREE.Matrix4();
        for (let i = 0; i < 18; i++) {
          const a = rnd(0, Math.PI * 2), r = rnd(0, 0.85);
          m4.compose(new THREE.Vector3(Math.cos(a) * r, rnd(0.6, 1.2), Math.sin(a) * r), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(0, 3), rnd(0, 3), 0)), new THREE.Vector3(1, rnd(1.5, 4), 1));
          cr.setMatrixAt(i, m4);
        }
        mesh.add(cr);
      }
    }
    mesh.userData.itemId = it.id;
    mesh.renderOrder = 0;
    it.group.add(mesh);
    return { mesh, piece, form, vol0, base: col.clone() };
  }

  #disposeSolid(it, obj) {
    it.group.remove(obj.mesh);
    obj.mesh.traverse((m) => { if (m.isMesh) m.geometry.dispose(); });
  }

  /** Idishdagi gaz (bo'shliq): rangli gaz va bug' */
  headspace(it, v) {
    if (!it.model.vessel || !it.liquid) return;
    const f = this.#vfx(it);
    const gases = this.chem.inPhase(v, 'g');
    const headL = Math.max((it.liquid.capacity_mL - this.chem.liquidVolume(v)) / 1000, 1e-4);
    let r = 0, g = 0, b = 0, op = 0;
    for (const [id, n] of gases) {
      const s = this.db.sub(id);
      let hex = s?.gas?.color || (s?.state === 'g' ? s?.appearance?.color : null) || FALLBACK_GAS[id];
      let strength = 1;
      if (id === 'H2O') { hex = '#ffffff'; strength = 0.25; }
      if (!hex || /^#f[ef]f[ef]f[ef]$/i.test(hex)) continue;
      const c = hexColor(hex);
      const a = Math.min(0.85, (n / headL / 0.04) * 0.6 * strength);
      r += c.r * a; g += c.g * a; b += c.b * a; op += a;
    }
    // sublimatsiya (yod bug'i) — qizigan qattiq I2
    if (this.chem.get(v, 'I2', 's') > 1e-6 && v.T > 80) { const c = hexColor(FALLBACK_GAS.I2); const a = Math.min(0.6, (v.T - 80) / 150); r += c.r * a; g += c.g * a; b += c.b * a; op += a; }
    if (op < 0.01) { if (f.gasMesh) f.gasMesh.visible = false; return; }
    if (!f.gasMesh) {
      const inner = it.liquid.inner;
      const pts = [[0, inner[0][1]], ...inner.slice(1), [0, it.model.vessel.rimY]].map(([x, y]) => new THREE.Vector2(Math.max(x - 0.3, 0) * MM, y * MM));
      const geo = new THREE.LatheGeometry(pts, 28);
      f.gasPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.BackSide, clippingPlanes: [f.gasPlane] });
      f.gasMesh = new THREE.Mesh(geo, mat);
      f.gasMesh.renderOrder = 4;
      f.gasMesh.userData.itemId = it.id;
      it.group.add(f.gasMesh);
    }
    f.gasMesh.visible = true;
    f.gasMesh.material.color.setRGB(r / op, g / op, b / op);
    f.gasMesh.material.opacity = Math.min(0.75, op);
    f.gasPlane.constant = -(it.liquid.volume_mL + it.liquid.orgVolume_mL > 0.01 ? it.liquid.level : -10);
  }

  /** Gaz atmosferaga chiqadi (og'iz yoki naycha uchidan) */
  gasOut(item, gid, n, ex) {
    const s = this.db.sub(gid);
    let hex = s?.gas?.color || (s?.state === 'g' ? s?.appearance?.color : null) || FALLBACK_GAS[gid];
    let alpha = 0.35, size = 0.01;
    if (gid === 'H2O') { hex = '#ffffff'; alpha = 0.18; size = 0.014; }
    if (['HCl', 'HNO3', 'SO3', 'NH4Cl', 'P4O10'].includes(gid)) { hex = '#f2f2f2'; alpha = 0.2; }
    if (!hex || /^#f[ef]f[ef]f[ef]$/i.test(hex) && gid !== 'H2O' && alpha === 0.35) return;
    const f = this.#vfx(item);
    f.acc[`g:${gid}`] = (f.acc[`g:${gid}`] || 0) + Math.min(n * 6e4, 12) * this.k;
    const pos = this.#exitPoint(item, ex);
    const c = hexColor(hex);
    const heavy = (s?.gas?.rel_density_air ?? 1) > 1.2;
    while (f.acc[`g:${gid}`] >= 1) {
      f.acc[`g:${gid}`] -= 1;
      this.soft.spawn({ p: _v.copy(pos).add(_w.set(rnd(-0.004, 0.004), 0, rnd(-0.004, 0.004))), v: [rnd(-0.01, 0.01), heavy ? rnd(-0.01, 0.01) : rnd(0.02, 0.05), rnd(-0.01, 0.01)], color: c, alpha, size, grow: 3.5, life: rnd(2.5, 5), drag: 0.9, gravity: heavy ? 0.004 : -0.002, floor: BENCH.y + 0.004, fadeIn: 0.3 });
    }
  }

  #exitPoint(item, ex) {
    // erkin naycha uchi bo'lsa — o'sha nuqta
    if (item.def?.builder === 'naycha' || item.def?.flexible) {
      for (const p of item.size.ports || []) {
        if (!this.bench.graph.connectionsOf(item.id, p.id).length) {
          const pose = this.bench.portPose(item, p.id);
          if (pose) return pose.pos;
        }
      }
    }
    void ex;
    return this.mouth(item, new THREE.Vector3());
  }

  splash(it) {
    const p = this.mouth(it, new THREE.Vector3());
    const c = it.liquid?.material.color || new THREE.Color(0xdfeff7);
    for (let i = 0; i < 40 * this.k + 6; i++) {
      this.soft.spawn({ p: p.clone(), v: [rnd(-0.35, 0.35), rnd(0.5, 1.2), rnd(-0.35, 0.35)], color: c, alpha: 0.9, size: rnd(0.002, 0.004), life: 1.5, gravity: 9.8, floor: BENCH.y + 0.001, fadeIn: 0.01 });
    }
    audio.play('splash');
  }

  /** Qisqa rangli alanga (masalan, K suvda) */
  flash(it, color = '#ffb000') {
    const p = it.liquid ? _v.copy(this.mouth(it)).setY(it.liquid.level + 0.003) : this.mouth(it, _v);
    const c = hexColor(color);
    for (let i = 0; i < 6 * this.k + 2; i++) this.add.spawn({ p: p.clone().add(_w.set(rnd(-0.003, 0.003), 0, rnd(-0.003, 0.003))), v: [rnd(-0.01, 0.01), rnd(0.05, 0.12), rnd(-0.01, 0.01)], color: c, alpha: 0.8, size: rnd(0.006, 0.012), life: rnd(0.2, 0.45) });
    this.#flashLight(p, c, 0.6);
  }

  /** "Paq!" — vodorodning yonishi (cho'p bilan sinov) */
  popFlash(pos) {
    for (let i = 0; i < 18 * this.k + 4; i++) this.add.spawn({ p: pos.clone(), v: [rnd(-0.3, 0.3), rnd(-0.1, 0.4), rnd(-0.3, 0.3)], color: [1, 0.75, 0.4], alpha: 1, size: rnd(0.006, 0.015), life: rnd(0.08, 0.2) });
    this.#flashLight(pos, new THREE.Color(0xffd0a0), 2.5);
    audio.play('pop');
  }

  #flashLight(pos, color, power) {
    this.flashLight.position.copy(pos);
    this.flashLight.color.copy(color);
    this.flashLevel = Math.max(this.flashLevel, power);
  }

  popStopper(stopper, from) {
    const g = stopper.group;
    if (from) g.position.copy(from);
    const vel = new THREE.Vector3(rnd(-0.4, 0.4), rnd(1.6, 2.4), rnd(-0.3, 0.3));
    const spin = new THREE.Vector3(rnd(-12, 12), rnd(-6, 6), rnd(-12, 12));
    let t = 0;
    this.anims.push((dt) => {
      t += dt;
      vel.y -= 9.8 * dt;
      g.position.addScaledVector(vel, dt);
      g.rotation.x += spin.x * dt; g.rotation.z += spin.z * dt;
      if (g.position.y <= BENCH.y) {
        g.position.y = BENCH.y;
        if (Math.abs(vel.y) < 0.4) { g.rotation.set(Math.PI / 2, g.rotation.y, 0); return false; }
        vel.y *= -0.35; vel.x *= 0.6; vel.z *= 0.6; spin.multiplyScalar(0.5);
      }
      return t < 6;
    });
    const m = this.mouth(stopper, new THREE.Vector3());
    for (let i = 0; i < 20 * this.k; i++) this.soft.spawn({ p: m.clone(), v: [rnd(-0.1, 0.1), rnd(0.1, 0.4), rnd(-0.1, 0.1)], color: [0.95, 0.95, 0.95], alpha: 0.3, size: 0.01, grow: 3, life: 1.5, drag: 1.5 });
  }

  sound(kind) { audio.play(kind); }

  /** Darz ketgan shisha: singan chiziqlar va xira devor */
  crack(it) {
    const f = this.#vfx(it);
    if (f.crack) return;
    const inner = it.model.vessel?.inner;
    const pts = [];
    const H = it.model.vessel ? it.model.vessel.rimY : 60;
    for (let c = 0; c < 5; c++) {
      let a = rnd(0, Math.PI * 2), y = rnd(H * 0.05, H * 0.4);
      for (let s = 0; s < 8; s++) {
        const r = (inner ? radiusAt(inner, y) : 15) + 1.2;
        const a2 = a + rnd(-0.25, 0.25), y2 = y + rnd(-2, 9);
        const r2 = (inner ? radiusAt(inner, Math.max(y2, 1)) : 15) + 1.2;
        pts.push(new THREE.Vector3(Math.cos(a) * r * MM, y * MM, Math.sin(a) * r * MM), new THREE.Vector3(Math.cos(a2) * r2 * MM, Math.max(y2, 1) * MM, Math.sin(a2) * r2 * MM));
        a = a2; y = Math.max(y2, 1);
      }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    f.crack = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.85 }));
    it.group.add(f.crack);
    it.group.traverse((m) => { if (m.isMesh && m.userData.part === 'body') { m.material = m.material.clone(); m.material.roughness = 0.6; if ('transmission' in m.material) m.material.transmission = 0; m.material.opacity = Math.max(m.material.opacity ?? 0.3, 0.45); } });
  }

  /** Stolga to'kilgan suyuqlik (ko'lmak) */
  spill(it, vol_mL) {
    if (vol_mL <= 0.001) return;
    const src = it.liquid?.overflow?.point || this.mouth(it, new THREE.Vector3());
    const c = it.liquid?.material.color.clone() || new THREE.Color(0xdfeff7);
    let pud = this.puddles.find((p) => p.item === it && p.t < 20);
    if (!pud) {
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshPhysicalMaterial({ color: c, transparent: true, opacity: 0.55, roughness: 0.05, depthWrite: false }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(src.x, BENCH.y + 0.0007, src.z);
      mesh.scale.setScalar(0.001);
      mesh.renderOrder = 1;
      this.root.add(mesh);
      pud = { item: it, mesh, vol: 0, t: 0 };
      this.puddles.push(pud);
    }
    pud.vol += vol_mL;
    pud.t = 0;
    const area = (pud.vol * 1e-6) / 0.0012;
    pud.mesh.scale.setScalar(Math.min(Math.sqrt(area / Math.PI), 0.3));
    // oqim tomchilari
    for (let i = 0; i < Math.min(vol_mL * 6, 6) * this.k + 1; i++) this.soft.spawn({ p: src.clone(), v: [rnd(-0.02, 0.02), rnd(-0.05, 0), rnd(-0.02, 0.02)], color: c, alpha: 0.8, size: rnd(0.002, 0.0035), life: 1.2, gravity: 9.8, floor: BENCH.y + 0.001, fadeIn: 0.01 });
  }

  /** Sovutgichdan qabul qiluvchi idishga tomchilar */
  drip(recv) {
    const f = this.#vfx(recv);
    f.acc.drip = (f.acc.drip || 0) + 0.2;
    if (f.acc.drip < 1) return;
    f.acc.drip = 0;
    const p = this.mouth(recv, new THREE.Vector3()).add(_w.set(0, 0.03, 0));
    this.soft.spawn({ p, v: [0, -0.05, 0], color: [0.85, 0.93, 1], alpha: 0.9, size: 0.003, life: 1, gravity: 9.8, ceil: 9, floor: (recv.liquid?.level ?? BENCH.y) + 0.0005, fadeIn: 0.02 });
  }

  /** Alanga sinovi: gorelka alangasini bo'yash */
  tintFlame(burner, color, seconds = 4) {
    const fl = this.flames.get(burner.id);
    if (fl) fl.setTint(color, seconds);
  }

  // ----------------------------------------------------------------- ichki effektlar
  #wetWalls(it, f, dt) {
    const L = it.liquid;
    if (!L.nSamples || this.#upright(it) < 0.9) { if (f.wet) f.wet.visible = false; return; }
    const level = L.volume_mL + L.orgVolume_mL > 0.01 ? L.level : this.bottom(it, _v).y;
    if (level >= f.wetTop - 0.0005) { f.wetTop = level; f.wetT = 0; } else f.wetT += dt;
    const fade = Math.max(0, 1 - f.wetT / 40);
    if (fade <= 0.01 || f.wetTop - level < 0.002) { if (f.wet) f.wet.visible = false; if (fade <= 0.01) f.wetTop = level; return; }
    if (!f.wet) {
      const pts = L.inner.slice(1).map(([x, y]) => new THREE.Vector2(Math.max(x - 0.05, 0) * MM, y * MM));
      f.wetLo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      f.wetHi = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
      f.wet = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.02, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [f.wetLo, f.wetHi] }));
      f.wet.renderOrder = 3;
      it.group.add(f.wet);
    }
    f.wet.visible = true;
    f.wetLo.constant = -level;
    f.wetHi.constant = f.wetTop;
    f.wet.material.opacity = 0.14 * fade;
    f.wet.material.color.copy(L.material.color).lerp(new THREE.Color(1, 1, 1), 0.5);
  }

  #condensate(it, f) {
    const want = Math.round(f.cond * 40 * Math.max(this.k, 0.5));
    if (want <= 0) { if (f.drops) f.drops.count = 0; return; }
    if (!f.drops) {
      const inner = it.model.vessel.inner;
      const rim = it.model.vessel.rimY;
      f.drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0007, 6, 4), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.02, depthWrite: false }), 40);
      const m4 = new THREE.Matrix4();
      const y0 = inner[0][1];
      for (let i = 0; i < 40; i++) {
        const y = rnd(y0 + (rim - y0) * 0.45, rim * 0.98), a = rnd(0, Math.PI * 2), r = radiusAt(inner, y) - 0.4;
        m4.compose(new THREE.Vector3(Math.cos(a) * r * MM, y * MM, Math.sin(a) * r * MM), new THREE.Quaternion(), new THREE.Vector3(1, rnd(1, 1.6), 0.6).multiplyScalar(rnd(0.6, 1.4)));
        f.drops.setMatrixAt(i, m4);
      }
      f.drops.renderOrder = 3;
      it.group.add(f.drops);
    }
    f.drops.count = Math.min(want, 40);
  }

  #coatings(it, f) {
    // kumush ko'zgu / mis qoplami (shisha devorida)
    if ((f.levels.mirror || 0) > 0.01) f.mirror = Math.min(1, f.mirror + 0.004 * f.levels.mirror);
    if (f.mirror > 0.01) {
      if (!f.mirrorMesh) {
        const L = it.liquid;
        const pts = L.inner.map(([x, y]) => new THREE.Vector2(Math.max(x + 0.1, 0) * MM, y * MM));
        f.mirrorPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        f.mirrorMesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 36), new THREE.MeshStandardMaterial({ color: hexColor(f.mirrorColor || '#d8d8dc'), metalness: 1, roughness: 0.12, transparent: true, opacity: 0, side: THREE.DoubleSide, clippingPlanes: [f.mirrorPlane] }));
        f.mirrorMesh.renderOrder = 2;
        it.group.add(f.mirrorMesh);
        f.mirrorTop = it.liquid.level;
      }
      f.mirrorTop = Math.max(f.mirrorTop, it.liquid.level);
      f.mirrorPlane.constant = f.mirrorTop + 0.001;
      f.mirrorMesh.material.opacity = Math.min(0.95, f.mirror);
    }
    // qurum (og'iz atrofida)
    if ((f.levels.soot || 0) > 0.01) f.soot = Math.min(1, f.soot + 0.003 * f.levels.soot);
    if (f.soot > 0.02) {
      if (!f.sootMesh) {
        const v = it.model.vessel;
        const r = (v.mouthR || radiusAt(v.inner, v.rimY - 1)) + 0.6;
        f.sootMesh = new THREE.Mesh(new THREE.CylinderGeometry(r * MM, r * MM, 18 * MM, 28, 1, true), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
        f.sootMesh.position.y = (v.rimY - 9) * MM;
        it.group.add(f.sootMesh);
      }
      f.sootMesh.material.opacity = f.soot * 0.6;
    }
  }

  #emitLevels(it, f, dt) {
    const L = f.levels;
    const k = this.k;
    const mouth = () => this.mouth(it, new THREE.Vector3());
    const solidPos = () => {
      const p = this.bottom(it, new THREE.Vector3());
      if (it.liquid && it.liquid.volume_mL < 0.05) return p.add(_w.set(0, 0.004, 0));
      return p;
    };
    const emit = (key, rate, fn) => {
      f.acc[key] = (f.acc[key] || 0) + rate * k * dt;
      while (f.acc[key] >= 1) { f.acc[key] -= 1; fn(); }
    };
    if (L.smoke > 0.02) emit('smoke', 30 * L.smoke, () => this.soft.spawn({ p: mouth().add(_w.set(rnd(-0.004, 0.004), 0, rnd(-0.004, 0.004))), v: [rnd(-0.01, 0.01), rnd(0.03, 0.07), rnd(-0.01, 0.01)], color: [0.96, 0.96, 0.96], alpha: 0.4, size: 0.014, grow: 4, life: rnd(3, 5), drag: 0.8, fadeIn: 0.3 }));
    if (L.fog > 0.02) emit('fog', 20 * L.fog, () => this.soft.spawn({ p: mouth(), v: [rnd(-0.02, 0.02), rnd(-0.01, 0.01), rnd(-0.02, 0.02)], color: [0.95, 0.97, 1], alpha: 0.3, size: 0.016, grow: 3, life: rnd(3, 6), drag: 0.6, gravity: 0.006, floor: BENCH.y + 0.005, fadeIn: 0.4 }));
    if (L['heat-haze'] > 0.02 || L.heat > 0.02) emit('haze', 8 * Math.max(L['heat-haze'] || 0, L.heat || 0), () => this.soft.spawn({ p: mouth(), v: [0, rnd(0.05, 0.1), 0], color: [1, 1, 1], alpha: 0.05, size: 0.02, grow: 2, life: 1.5, drag: 0.5 }));
    if (L.sparks > 0.02 || L.volcano > 0.02) {
      emit('sparks', 120 * Math.max(L.sparks || 0, L.volcano || 0), () => this.add.spawn({ p: solidPos(), v: [rnd(-0.4, 0.4), rnd(0.4, 1.1), rnd(-0.4, 0.4)], color: [1, rnd(0.55, 0.8), 0.2], alpha: 1, size: rnd(0.002, 0.004), life: rnd(0.3, 0.8), gravity: 3, floor: BENCH.y + 0.001 }));
      if (Math.random() < dt * 8) audio.play('spark');
    }
    if (L.volcano > 0.02) emit('ash', 40 * L.volcano, () => this.soft.spawn({ p: solidPos(), v: [rnd(-0.12, 0.12), rnd(0.15, 0.4), rnd(-0.12, 0.12)], color: [0.22, 0.36, 0.16], alpha: 0.95, size: rnd(0.002, 0.004), life: 4, gravity: 2, floor: BENCH.y + 0.001, fadeIn: 0.02 }));
    if (L.light > 0.02) {
      const p = solidPos();
      this.#flashLight(p, new THREE.Color(0xffffff), 6 * L.light);
      emit('lightcore', 40 * L.light, () => this.add.spawn({ p: p.clone().add(_w.set(rnd(-0.003, 0.003), rnd(0, 0.006), rnd(-0.003, 0.003))), v: [0, rnd(0.01, 0.04), 0], color: [1, 1, 1], alpha: 1, size: rnd(0.02, 0.05), life: 0.25 }));
      emit('mgo', 15 * L.light, () => this.soft.spawn({ p: p.clone(), v: [rnd(-0.01, 0.01), rnd(0.04, 0.08), rnd(-0.01, 0.01)], color: [0.98, 0.98, 0.98], alpha: 0.5, size: 0.012, grow: 3, life: 3, drag: 0.8 }));
    }
    if (L.glow > 0.05) emit('glow', 10 * L.glow, () => this.add.spawn({ p: solidPos(), v: [0, 0.005, 0], color: [1, 0.45, 0.1], alpha: 0.6, size: 0.02, life: 0.4 }));
    if (L.flame > 0.03) {
      if (!f.flame) { f.flame = new Flame('reaksiya', this.q.maxLights > 1); this.root.add(f.flame.group); }
      f.flame.group.visible = true;
      const p = it.liquid && it.liquid.volume_mL > 0.05 ? _v.copy(this.mouth(it)).setY(it.liquid.level) : this.mouth(it, _v);
      if (it.model.vessel && (!it.liquid || it.liquid.volume_mL < 0.05)) p.copy(this.mouth(it));
      f.flame.group.position.copy(p);
      f.flame.setScale(0.4 + L.flame * 0.8);
      if (f.flameColor && !f.flame.tint) f.flame.setTint(f.flameColor, 0.5);
      if (f.flame.tint) f.flame.tintT = Math.max(f.flame.tintT, 0.5);
      f.flame.update(dt, this.time);
    } else if (f.flame) f.flame.group.visible = false;
    // elektrod pufakchalari
    if (f.gasAt > 0.5 && f.gasHost?.liquid) {
      const box = new THREE.Box3().setFromObject(it.group);
      const tip = box.getCenter(new THREE.Vector3()).setY(box.min.y + 0.004);
      const n = Math.min(f.gasAt, 40 * k * dt + 1);
      f.gasAt -= n;
      for (let i = 0; i < n; i++) this.bub.spawn({ p: tip.clone().add(_w.set(rnd(-0.002, 0.002), rnd(0, 0.02), rnd(-0.002, 0.002))), v: [0, rnd(0.03, 0.06), 0], color: [0.95, 0.97, 1], alpha: 0.8, size: rnd(0.0007, 0.0015), life: 5, ceil: f.gasHost.liquid.level - 0.0004 });
    }
    f.gasAt = (f.gasAt || 0) * 0.98;
    for (const key of Object.keys(L)) L[key] *= Math.exp(-dt / 0.6);
  }

  // ----------------------------------------------------------------- jihoz holatlari: alangalar, plitkalar
  #heaters(dt) {
    let burnerOn = 0;
    for (const it of this.bench.items.values()) {
      const m = it.model;
      if (m.flame) {
        const lit = it.def.builder === 'chop' ? true : it.heaterOn;
        let fl = this.flames.get(it.id);
        if (lit && !fl) {
          const kind = it.def.builder === 'spirtovka' ? 'spirtovka' : it.def.builder === 'chop' ? 'chop' : 'bunzen';
          fl = new Flame(kind, this.q.maxLights > 1 && kind !== 'chop');
          m.flame.add(fl.group);
          this.flames.set(it.id, fl);
        }
        if (fl) {
          fl.group.visible = lit;
          if (lit) { fl.update(dt, this.time); burnerOn++; }
        }
      }
      if (m.indicator) {
        const mat = m.indicator.material;
        if (mat?.color) mat.color.set(it.heaterOn ? (it.def.builder === 'mufel' ? 0xff6a1a : 0xef4444) : (it.def.builder === 'mufel' ? 0x331a0a : 0x334155));
      }
      if (m.plate) {
        if (!m.plate.userData._own) { m.plate.material = m.plate.material.clone(); m.plate.userData._own = true; }
        const target = it.heaterOn ? 1 : 0;
        const cur = (m.plate.userData.heat ?? 0);
        const nh = cur + (target - cur) * Math.min(1, dt / 8);
        m.plate.userData.heat = nh;
        m.plate.material.emissive?.setRGB(0.9, 0.18, 0.05);
        m.plate.material.emissiveIntensity = nh * 0.8;
      }
      if (m.glowing && m.tip?.material) m.tip.material.emissiveIntensity = 1.2 + Math.sin(this.time * 7 + it.group.id) * 0.4;
    }
    for (const [id, fl] of this.flames) if (!this.bench.items.has(id)) { fl.dispose(); this.flames.delete(id); }
    audio.level('burner', burnerOn ? 0.6 : 0);
  }

  // ----------------------------------------------------------------- kadr
  update(dt) {
    this.time += dt;
    const cam = this.scene.camera;
    const h = this.scene.renderer.domElement.height;
    const scale = h / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    this.#heaters(dt);
    for (const it of this.bench.items.values()) if (it._vfx) this.#emitLevels(it, it._vfx, dt);
    this.soft.update(dt, scale, this.time);
    this.bub.update(dt, scale, this.time);
    this.add.update(dt, scale, this.time);
    this.anims = this.anims.filter((a) => a(dt) !== false);
    for (const p of this.puddles) {
      p.t += dt;
      if (p.t > 25) p.mesh.material.opacity = Math.max(0, 0.55 * (1 - (p.t - 25) / 10));
    }
    this.puddles = this.puddles.filter((p) => { if (p.t > 35) { p.mesh.parent?.remove(p.mesh); p.mesh.geometry.dispose(); return false; } return true; });
    this.flashLevel *= Math.exp(-dt / 0.15);
    this.flashLight.intensity = this.flashLevel;
  }

  /** Stol tozalanganda */
  reset() {
    this.soft.clear(); this.bub.clear(); this.add.clear();
    for (const p of this.puddles) p.mesh.parent?.remove(p.mesh);
    this.puddles = [];
    this.anims = [];
  }

  /** Idish yuvilganda: qoplamalar, kondensat, qurum va darzdan tashqari hammasi tozalanadi */
  cleanVessel(it) {
    const f = it._vfx;
    if (!f) return;
    for (const m of [f.mirrorMesh, f.sootMesh, f.drops, f.wet, f.gasMesh]) if (m) it.group.remove(m);
    for (const [, obj] of f.solids) this.#disposeSolid(it, obj);
    it._vfx = null;
    it._fx = null;
    it._seenPpt = null; it._ruleSeen = null; it._crys = false;
  }
}

export { audio };
