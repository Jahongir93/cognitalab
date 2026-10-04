// Idish ichidagi suyuqlik: istalgan shakldagi aylanish jismi uchun.
// Sath dunyo koordinatalarida gorizontal tekislik (idish og'ganda ham gorizontal qoladi).
// Sath balandligi idish ichidagi oldindan tanlangan nuqtalar to'plamining kvantili orqali topiladi.
import * as THREE from 'three';
import { latheShell, MM } from './models/glassware.js';
import { radiusAt, volumeTo } from './models/profiles.js';
import * as M from './materials.js';

const N_SAMPLES = 900;
const _v = new THREE.Vector3();
const _o = new THREE.Vector3();
const _u = new THREE.Vector3();

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export class LiquidBody {
  /**
   * @param {number[][]} inner ichki profil (mm)
   * @param {number} rimY og'iz balandligi (mm)
   * @param {THREE.Object3D} vesselGroup idish guruhi (suyuqlik unga bog'lanadi)
   * @param {THREE.Object3D} worldRoot sahna ildizi (sirt diski uchun)
   */
  constructor(inner, rimY, vesselGroup, worldRoot) {
    this.inner = inner.map(([x, y]) => [Math.max(x - 0.25, 0), y]);
    this.rimY = rimY;
    this.vessel = vesselGroup;
    this.capacity_mL = volumeTo(this.inner, rimY);
    this.volume_mL = 0;
    this.orgVolume_mL = 0;
    this.color = new THREE.Color(0xdfeff7);
    this.orgColor = new THREE.Color(0xf2e6a0);
    this.turbidity = 0;
    this.plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    this.planeLow = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.planeOrgTop = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

    // suyuqlik tanasi: ichki profil bo'yicha yopiq aylanish jismi
    const prof = [[0, this.inner[0][1]], ...this.inner.slice(1)];
    const capped = [...prof, [0, rimY]];
    const pts = capped.map(([x, y]) => new THREE.Vector2(x * MM, y * MM));
    const geo = new THREE.LatheGeometry(pts, 36);
    geo.computeVertexNormals();
    this.material = M.liquid();
    this.material.clippingPlanes = [this.plane];
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.renderOrder = 1;
    this.mesh.userData.part = 'liquid';
    vesselGroup.add(this.mesh);

    // organik (yuqori) qatlam
    this.orgMaterial = M.liquid();
    this.orgMaterial.color.set(this.orgColor);
    this.orgMaterial.clippingPlanes = [this.planeOrgTop, this.planeLow];
    this.orgMesh = new THREE.Mesh(geo, this.orgMaterial);
    this.orgMesh.renderOrder = 1;
    this.orgMesh.visible = false;
    vesselGroup.add(this.orgMesh);

    // sirt (ellips disk) — dunyo koordinatalarida
    this.surfaceMat = new THREE.MeshPhysicalMaterial({ color: 0xdfeff7, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.6, envMapIntensity: 1.4, side: THREE.DoubleSide, depthWrite: false });
    this.surface = new THREE.Mesh(new THREE.CircleGeometry(1, 40), this.surfaceMat);
    this.surface.rotation.x = -Math.PI / 2;
    this.surface.renderOrder = 3;
    this.surface.visible = false;
    this.surfaceHolder = new THREE.Group();
    this.surfaceHolder.add(this.surface);
    worldRoot.add(this.surfaceHolder);
    // menisk (devor yonida biroz ko'tarilgan halqa)
    this.meniscus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 6, 40), this.surfaceMat);
    this.meniscus.rotation.x = Math.PI / 2;
    this.surfaceHolder.add(this.meniscus);

    // hajm bo'yicha tanlangan nuqtalar (mahalliy, m)
    const rnd = seededRandom(Math.round(rimY * 97 + this.capacity_mL * 13));
    const rMax = Math.max(...this.inner.map((p) => p[0]));
    const y0 = this.inner[0][1];
    this.samples = new Float32Array(N_SAMPLES * 3);
    let k = 0, guard = 0;
    while (k < N_SAMPLES && guard < N_SAMPLES * 200) {
      guard++;
      const y = y0 + rnd() * (rimY - y0);
      const r = radiusAt(this.inner, y);
      const x = (rnd() * 2 - 1) * rMax, z = (rnd() * 2 - 1) * rMax;
      if (x * x + z * z > r * r) continue;
      this.samples[k * 3] = x * MM; this.samples[k * 3 + 1] = y * MM; this.samples[k * 3 + 2] = z * MM;
      k++;
    }
    this.nSamples = k;
    this.ys = new Float32Array(k);
    // og'iz gardishi nuqtalari (to'kilish nuqtasini topish uchun)
    const rimR = radiusAt(this.inner, rimY - 0.5);
    this.rimPts = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      this.rimPts.push(new THREE.Vector3(Math.cos(a) * (rimR + 1) * MM, rimY * MM, Math.sin(a) * (rimR + 1) * MM));
    }
    this.level = 0; // dunyo y
    this.overflow = null;
  }

  dispose() {
    this.surfaceHolder.parent?.remove(this.surfaceHolder);
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.orgMaterial.dispose();
  }

  /** Hajm ulushiga mos dunyo balandligi (kvantil) */
  #levelForFraction(f) {
    const e = this.vessel.matrixWorld.elements;
    const n = this.nSamples;
    for (let i = 0; i < n; i++) {
      const x = this.samples[i * 3], y = this.samples[i * 3 + 1], z = this.samples[i * 3 + 2];
      this.ys[i] = e[1] * x + e[5] * y + e[9] * z + e[13];
    }
    this.ys.sort();
    if (f <= 0) return this.ys[0] - 1;
    if (f >= 1) return this.ys[n - 1] + 0.001;
    const idx = Math.min(n - 1, Math.max(0, Math.floor(f * n)));
    return this.ys[idx];
  }

  /**
   * Har kadrda chaqiriladi.
   * @returns {{overflow: null | {point: THREE.Vector3, excess: number}}}
   */
  update() {
    this.vessel.updateMatrixWorld(true);
    const total = this.volume_mL + this.orgVolume_mL;
    const f = Math.min(total / this.capacity_mL, 1.02);
    const visible = total > 0.005;
    this.mesh.visible = visible;
    this.surfaceHolder.visible = visible;
    if (!visible) { this.overflow = null; return this; }
    const h = this.#levelForFraction(Math.min(f, 1));
    this.level = h;
    const orgFrac = this.orgVolume_mL > 0.01 ? this.volume_mL / Math.max(total, 1e-9) : 1;
    const hAq = this.orgVolume_mL > 0.01 ? this.#levelForFraction(Math.min(f * orgFrac, 1)) : h;
    this.plane.constant = hAq;
    this.planeOrgTop.constant = h;
    this.planeLow.constant = -hAq;
    this.orgMesh.visible = this.orgVolume_mL > 0.01;

    // sirt: idish o'qi bilan tekislik kesishgan nuqta
    const e = this.vessel.matrixWorld;
    _o.setFromMatrixPosition(e);
    _u.set(0, 1, 0).transformDirection(e);
    const scale = new THREE.Vector3().setFromMatrixScale(e).x;
    if (_u.y > 0.12) {
      const t = (h - _o.y) / _u.y;
      const yLocal = t / scale / MM;
      const r = radiusAt(this.inner, Math.min(yLocal, this.rimY)) * MM * scale;
      if (r > 0.0004 && yLocal < this.rimY + 0.5) {
        this.surface.visible = false; // sirt suyuqlik tanasining orqa yuzalari orqali chiziladi
        _v.copy(_o).addScaledVector(_u, t);
        this.surfaceHolder.position.copy(_v);
        // og'ish yo'nalishida cho'zilgan ellips
        const tiltDir = new THREE.Vector2(_u.x, _u.z);
        const ang = Math.atan2(tiltDir.y, tiltDir.x);
        this.surfaceHolder.rotation.set(0, -ang, 0);
        this.surface.scale.set(r / _u.y, r, 1);
        const tilt = Math.acos(Math.min(_u.y, 1));
        this.meniscus.visible = tilt < 0.15;
        this.meniscus.scale.set(r * 0.995, r * 0.995, r * 0.995);
        this.meniscus.position.y = 0.0006;
      } else this.surface.visible = false;
    } else {
      this.surface.visible = false;
      this.meniscus.visible = false;
    }

    // to'kilish: sath eng past gardish nuqtasidan yuqorida
    let minY = Infinity, minP = null;
    for (const p of this.rimPts) {
      _v.copy(p).applyMatrix4(e);
      if (_v.y < minY) { minY = _v.y; minP = _v.clone(); }
    }
    this.overflow = h > minY + 0.0003 && f > 0.001 ? { point: minP, excess: h - minY } : null;
    return this;
  }

  /** Rang va loyqalik */
  setAppearance({ rgb, intensity = 0, turbidity = 0, turbidColor = null, org = null }) {
    const base = new THREE.Color(0xe4f1f6);
    // o'tgan yorug'lik rangi -> ko'rinadigan rang (qalin qatlamda to'yinganroq)
    const c = rgb ? new THREE.Color(Math.pow(rgb[0], 1.6), Math.pow(rgb[1], 1.6), Math.pow(rgb[2], 1.6)) : base;
    // juda quyuq eritma (masalan, 0,02 M KMnO4) qora emas, to'q rangli ko'rinsin: tusni saqlab yorqinlikni cheklaymiz
    const mx = Math.max(c.r, c.g, c.b);
    if (rgb && mx > 1e-6 && mx < 0.18) c.multiplyScalar(0.18 / mx);
    // rangsiz eritma: ozgina havorang shisha ko'rinishi
    if (intensity < 0.02) c.lerp(base, 0.6);
    if (turbidColor && turbidity > 0) c.lerp(new THREE.Color(turbidColor).multiplyScalar(0.8), Math.min(turbidity, 1) * 0.9);
    this.material.envMapIntensity = 0.8 * (1 - 0.7 * Math.min(turbidity, 1));
    this.material.color.copy(c);
    this.surfaceMat.color.copy(c);
    const op = Math.min(0.28 + intensity * 0.6 + turbidity * 0.6, 0.97);
    this.material.opacity = op;
    this.surfaceMat.opacity = Math.min(op + 0.1, 0.98);
    if (this.material.transmission !== undefined) this.material.transmission = M.quality()?.transmission ? Math.max(0, 0.7 - turbidity - intensity * 0.5) : 0;
    this.material.roughness = 0.08 + turbidity * 0.6;
    if (org) {
      this.orgMaterial.color.setRGB(org.rgb[0], org.rgb[1], org.rgb[2]);
      this.orgMaterial.opacity = Math.min(0.4 + org.intensity * 0.5, 0.95);
    }
  }
}
