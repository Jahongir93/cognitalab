// Jihozlar katalogining protsedura 3D modellari. Har bir builder data/equipment.json dagi `builder` nomiga mos.
// Natija: { group, vessel?: {inner, rimY, mouthR}, ports: {id: Object3D}, flame?: Object3D, parts }
import * as THREE from 'three';
import { buildLatheVessel, latheShell, tubeAlong, stopper, bottleLabel, MM } from './glassware.js';
import { PROFILES, innerProfile } from './profiles.js';
import * as M from '../materials.js';

const V = (x, y, z) => new THREE.Vector3(x * MM, y * MM, z * MM);

function mesh(geo, mat, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, mat, seg = 24, open = false) { return mesh(new THREE.CylinderGeometry(rt * MM, rb * MM, h * MM, seg, 1, open), mat); }
function boxm(w, h, d, mat) { return mesh(new THREE.BoxGeometry(w * MM, h * MM, d * MM), mat); }
function sph(r, mat, seg = 24) { return mesh(new THREE.SphereGeometry(r * MM, seg, Math.round(seg * 0.7)), mat); }
function torus(R, r, mat, arc = Math.PI * 2) { return mesh(new THREE.TorusGeometry(R * MM, r * MM, 8, 32, arc), mat); }
function at(obj, x, y, z) { obj.position.set(x * MM, y * MM, z * MM); return obj; }

/** Shisha jo'mrak (byuretka, ajratgich voronka) */
function stopcock(group, y, r = 4) {
  const body = at(cyl(r + 2, r + 2, 14, M.glass({ thick: true }), 16), 0, y, 0);
  body.rotation.z = Math.PI / 2;
  const key = at(boxm(4, 16, 3, M.plastic(0x2d6cdf)), 9, y, 0);
  group.add(body, key);
  return key;
}

/** Alanga (gorelka, spirt lampasi) — effektlar moduli boshqaradi, bu yerda faqat langar nuqta */
function flameAnchor(group, y) {
  const a = new THREE.Object3D();
  a.position.y = y * MM;
  a.name = 'alanga';
  group.add(a);
  return a;
}

const B = {};

// ----------------------------------------------------------------- aylanish jismi idishlari
const latheVessel = (kind, extra = {}) => (p, def) => {
  const porcelain = def.category === 'chinni' || ['kosacha', 'tigel', 'hovoncha'].includes(kind);
  const v = buildLatheVessel(kind, p, { graduated: !!def.vessel?.graduated, porcelain, thick: def.vessel?.thick });
  const prof = PROFILES[kind](p);
  const mouthR = v.inner[v.inner.length - 1][0];
  return { group: v.group, vessel: { inner: v.inner, rimY: v.rimY, mouthR }, ...extra.after?.(v.group, p, prof) };
};

B.probirka = (p, def) => {
  const r = latheVessel('probirka')(p, def);
  if (p.sideArm) r.group.add(tubeAlong([[p.R, p.H * 0.82, 0], [p.R + 14, p.H * 0.8, 0], [p.R + 28, p.H * 0.82, 0]], 2.5));
  return r;
};
B.stakan = latheVessel('stakan');
B.erlenmeyer = (p, def) => {
  const r = latheVessel('erlenmeyer')(p, def);
  if (p.sideBarb) r.group.add(tubeAlong([[p.neckR, p.H - 22, 0], [p.neckR + 22, p.H - 22, 0]], 3.2, M.glass({ thick: true })));
  return r;
};
B.kolba = (p, def) => {
  const r = latheVessel('kolba')(p, def);
  if (p.sideArm) r.group.add(tubeAlong([[p.neckR, p.H - 40, 0], [p.neckR + 25, p.H - 46, 0], [72, p.H - 52, 0]], 3));
  const necks = p.necks || 1;
  for (let i = 1; i < necks; i++) {
    const s = i === 1 ? 1 : -1;
    const neck = cyl(9, 9, 46, M.glass(), 20, true);
    neck.position.set(s * 30 * MM, (p.H - 38) * MM, 0);
    neck.rotation.z = -s * 0.42;
    r.group.add(neck);
  }
  return r;
};
B['olchov-kolba'] = (p, def) => {
  const r = latheVessel('olchov-kolba')(p, def);
  const mark = torus(p.neckR + 0.2, 0.25, new THREE.MeshBasicMaterial({ color: 0xffffff }));
  mark.rotation.x = Math.PI / 2;
  mark.position.y = (p.H * 0.78) * MM;
  r.group.add(mark);
  return r;
};
B.silindr = latheVessel('silindr');
B.menzurka = latheVessel('menzurka');
B.sklyanka = (p, def) => {
  const r = latheVessel('sklyanka')(p, def);
  const capMat = p.dropper ? M.rubber(0x2a2a2a) : M.glass({ thick: true, amber: p.amber });
  const cap = at(cyl(p.neckR + 1.5, p.neckR + 1.5, p.dropper ? 22 : 16, capMat, 20), 0, p.H + (p.dropper ? 11 : 8), 0);
  cap.userData.part = 'qopqoq';
  r.group.add(cap);
  r.labelR = p.R;
  r.labelY = p.H * 0.38;
  return r;
};
B.kosacha = latheVessel('kosacha');
B.tigel = latheVessel('tigel');
B.petri = latheVessel('petri');
B['soat-oynasi'] = latheVessel('soat-oynasi');
B.hovoncha = (p, def) => {
  const r = latheVessel('hovoncha')(p, def);
  const pestle = cyl(5, 8, 90, M.porcelain(), 16);
  pestle.position.set(18 * MM, 50 * MM, 0);
  pestle.rotation.z = -0.4;
  r.group.add(pestle);
  return r;
};

// ----------------------------------------------------------------- maxsus shisha idishlar
B.retorta = () => {
  const g = new THREE.Group();
  const bulb = sph(40, M.glass(), 28);
  bulb.position.y = 40 * MM;
  g.add(bulb);
  g.add(tubeAlong([[0, 70, 0], [20, 88, 0], [70, 80, 0], [120, 55, 0], [165, 30, 0]], 7));
  const inner = innerProfile(PROFILES.kolba({ R: 40, H: 82, neckR: 9, neckH: 10 }).outer, 1.3);
  return { group: g, vessel: { inner, rimY: 82, mouthR: 9 } };
};
B.byuretka = (p) => {
  const g = new THREE.Group();
  const outer = [[0, 30], [p.R, 30], [p.R, p.H - 1], [p.R + 1, p.H]];
  const inner = innerProfile(outer, 1);
  g.add(mesh(latheShell(outer, inner, 20), M.glass()));
  stopcock(g, 22);
  g.add(tubeAlong([[0, 22, 0], [0, 4, 0], [0, 0, 0]], 1.6));
  // darajalar
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x1b2433 });
  for (let i = 0; i <= 50; i++) {
    const y = p.H - 20 - i * ((p.H - 60) / 50);
    const l = boxm(i % 5 === 0 ? 4 : 2, 0.35, 0.3, lineMat);
    l.position.set(0, y * MM, (p.R + 0.2) * MM);
    g.add(l);
  }
  return { group: g, vessel: { inner, rimY: p.H, mouthR: p.R - 1 } };
};
B.pipetka = (p) => {
  const g = new THREE.Group();
  if (p.bulb) {
    g.add(tubeAlong([[0, 0, 0], [0, 120, 0]], 3));
    const bulb = sph(9, M.glass(), 18); bulb.scale.y = 2.2; bulb.position.y = 160 * MM; g.add(bulb);
    g.add(tubeAlong([[0, 200, 0], [0, p.H, 0]], 3));
  } else g.add(tubeAlong([[0, 0, 0], [0, p.H, 0]], 3.5));
  return { group: g };
};
B.tomizgich = (p) => {
  const g = new THREE.Group();
  g.add(tubeAlong([[0, 0, 0], [0, 10, 0], [0, 85, 0]], 3));
  const bulb = sph(8, M.rubber(0xb83a2a), 16); bulb.scale.y = 1.8; bulb.position.y = 100 * MM; g.add(bulb);
  return { group: g, vessel: { inner: [[0, 2], [2, 4], [2.5, 85]], rimY: 85, mouthR: 1 } };
};
B.voronka = (p) => {
  const g = new THREE.Group();
  const outer = [[2.5, 0], [2.5, 75], [p.R, p.H - 1], [p.R + 1.5, p.H]];
  const inner = innerProfile(outer, 1.2);
  g.add(mesh(latheShell(outer, inner, 32), M.glass()));
  return { group: g, funnel: { R: p.R, H: p.H } };
};
B.ajratgich = (p) => {
  const g = new THREE.Group();
  const outer = p.cyl
    ? [[0, 40], [8, 44], [p.R, 70], [p.R, p.H - 30], [9, p.H - 10], [9, p.H]]
    : [[0, 40], [10, 50], [p.R, 120], [p.R * 0.8, p.H - 60], [10, p.H - 22], [10, p.H]];
  const inner = innerProfile(outer, 1.3);
  g.add(mesh(latheShell(outer, inner, 32), M.glass()));
  stopcock(g, 32);
  g.add(tubeAlong([[0, 30, 0], [0, 0, 0]], 2.5));
  return { group: g, vessel: { inner, rimY: p.H, mouthR: 8 } };
};
B.eksikator = (p) => {
  const g = new THREE.Group();
  const v = buildLatheVessel('stakan', { R: p.R, H: p.H * 0.6, wall: 4 }, { thick: true });
  g.add(v.group);
  const lid = mesh(new THREE.SphereGeometry(p.R * 1.05 * MM, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2.6), M.glass({ thick: true }));
  lid.position.y = p.H * 0.55 * MM;
  lid.scale.y = 0.6;
  g.add(lid);
  const knob = at(sph(10, M.glass({ thick: true })), 0, p.H * 0.92, 0);
  g.add(knob);
  return { group: g, vessel: { inner: v.inner, rimY: v.rimY, mouthR: p.R - 4 } };
};
B.tayoqcha = (p) => {
  const g = new THREE.Group();
  const rod = cyl(p.r, p.r, p.L, M.glass({ thick: true }), 12);
  rod.position.y = (p.L / 2) * MM;
  g.add(rod);
  return { group: g };
};
B.naycha = (p) => {
  const g = new THREE.Group();
  g.add(tubeAlong(p.path, 3.5, M.glass(), 64));
  if (p.taper) { const tip = at(cyl(1, 3.5, 12, M.glass(), 12), 0, 146, 0); g.add(tip); }
  return { group: g };
};
B['u-naycha'] = (p) => {
  const g = new THREE.Group();
  const w = p.W / 2;
  g.add(tubeAlong([[-w, p.H, 0], [-w, 30, 0], [-w * 0.7, 8, 0], [0, 0, 0], [w * 0.7, 8, 0], [w, 30, 0], [w, p.H, 0]], p.r, M.glass(), 64));
  return { group: g, utube: { W: p.W, H: p.H, r: p.r } };
};
B.xlorkalsiy = (p) => {
  const g = new THREE.Group();
  const outer = [[3, 0], [3, 20], [14, 35], [14, 120], [10, 130], [10, p.H]];
  g.add(mesh(latheShell(outer, innerProfile(outer, 1.2), 24), M.glass()));
  const fill = cyl(12, 12, 80, M.solid(0xf4f4ee, { rough: 1 }), 16);
  fill.position.y = 78 * MM;
  g.add(fill);
  return { group: g };
};
B.sovutgich = (p) => {
  const g = new THREE.Group();
  const L = p.L;
  // ichki naycha (x o'qi bo'ylab)
  const inner = cyl(5, 5, L, M.glass(), 16, true);
  inner.rotation.z = Math.PI / 2; inner.position.x = (L / 2) * MM;
  g.add(inner);
  if (p.kind === 'sharikli') for (let i = 0; i < 6; i++) { const b = sph(12, M.glass(), 16); b.position.x = (60 + i * 42) * MM; b.scale.x = 0.8; g.add(b); }
  if (p.kind !== 'deflegmator') {
    const jacket = cyl(17, 17, L - 60, M.glass(), 24, true);
    jacket.rotation.z = Math.PI / 2; jacket.position.x = (L / 2) * MM;
    g.add(jacket);
    // suv (havorang)
    const water = cyl(16, 16, L - 62, new THREE.MeshPhysicalMaterial({ color: 0xbfe3f7, transparent: true, opacity: 0.25, depthWrite: false }), 20);
    water.rotation.z = Math.PI / 2; water.position.x = (L / 2) * MM;
    water.userData.part = 'sovutish-suvi';
    water.visible = false;
    g.add(water);
    g.add(tubeAlong([[360, -17, 0], [360, -28, 0]], 3.5, M.glass()), tubeAlong([[40, 17, 0], [40, 28, 0]], 3.5, M.glass()));
  } else {
    for (let i = 0; i < 8; i++) { const d = torus(5, 1.2, M.glass()); d.rotation.y = Math.PI / 2; d.position.x = (40 + i * 30) * MM; g.add(d); }
    g.add(tubeAlong([[270, 5, 0], [270, 30, 0]], 3));
  }
  // kirish: shlif konusi yoki (Vyurs kolbasi uchun) teshikli rezina tiqin
  const joint = p.stopperInlet ? cyl(9, 7.5, 16, M.rubber(0xb23a28), 16) : cyl(9, 7.5, 24, M.glass({ thick: true }), 16);
  joint.rotation.z = Math.PI / 2; joint.position.x = (p.stopperInlet ? -4 : -8) * MM;
  g.add(joint);
  return { group: g, condenser: { L, kind: p.kind } };
};
B.alonj = () => {
  const g = new THREE.Group();
  g.add(tubeAlong([[0, 0, 0], [40, -5, 0], [75, -25, 0], [90, -60, 0]], 7));
  return { group: g };
};
B.dreksel = (p) => {
  const r = latheVessel('sklyanka')({ R: p.R, H: p.H, neckR: 16 }, { category: 'shisha', vessel: {} });
  r.group.add(tubeAlong([[-14, 230, 0], [-14, 195, 0], [-14, 15, 0]], 3), tubeAlong([[14, 230, 0], [14, 160, 0]], 3));
  const stop = at(cyl(17, 15, 18, M.glass({ thick: true }), 20), 0, p.H + 9, 0);
  r.group.add(stop);
  return r;
};
B.kipp = () => {
  const g = new THREE.Group();
  const glassT = M.glass({ thick: true });
  const low = sph(85, glassT, 28); low.position.y = 85 * MM; low.scale.y = 0.75;
  const mid = sph(70, glassT, 28); mid.position.y = 200 * MM; mid.scale.y = 0.7;
  const funnel = sph(60, glassT, 24); funnel.position.y = 330 * MM; funnel.scale.y = 0.85;
  const stem = cyl(8, 8, 300, glassT, 16); stem.position.y = 210 * MM;
  const out = tubeAlong([[0, 200, 60], [60, 220, 60], [95, 230, 0]], 5, glassT);
  const base = cyl(60, 70, 12, M.plastic(0x1f2937)); base.position.y = 6 * MM;
  // ichidagi rux bo'laklari (o'rta sharda)
  const zinc = new THREE.Group();
  for (let i = 0; i < 18; i++) { const z = sph(8, M.solid(0xa9adb1, { rough: 0.5, metal: 0.7 }), 8); z.position.set((Math.random() - 0.5) * 80 * MM, (175 + Math.random() * 20) * MM, (Math.random() - 0.5) * 80 * MM); zinc.add(z); }
  g.add(base, low, mid, funnel, stem, out, zinc);
  return { group: g, vessel: { inner: [[0, 10], [80, 40], [80, 140], [0, 160]], rimY: 160, mouthR: 5 }, kipp: true };
};
B.gazometr = () => {
  const g = new THREE.Group();
  const body = buildLatheVessel('stakan', { R: 110, H: 260, wall: 3 }, { thick: true });
  g.add(body.group);
  const top = at(cyl(60, 110, 50, M.glass({ thick: true }), 32), 0, 285, 0);
  g.add(top, tubeAlong([[0, 310, 0], [0, 330, 0]], 5), tubeAlong([[-110, 60, 0], [-130, 60, 0]], 5));
  return { group: g, vessel: { inner: body.inner, rimY: body.rimY, mouthR: 10 } };
};
B.yuvgich = (p) => {
  const g = new THREE.Group();
  const plast = new THREE.MeshPhysicalMaterial({ color: 0xf4f6f8, roughness: 0.35, transparent: true, opacity: 0.72 });
  const body = mesh(latheShell(PROFILES.sklyanka({ R: p.R, H: p.H, neckR: 12 }).outer, innerProfile(PROFILES.sklyanka({ R: p.R, H: p.H, neckR: 12 }).outer, 1.5), 32), plast);
  g.add(body);
  const cap = at(cyl(14, 14, 18, M.plastic(0x2563eb), 20), 0, p.H + 9, 0);
  g.add(cap, tubeAlong([[0, p.H + 18, 0], [0, p.H + 40, 0], [30, p.H + 50, 0], [60, p.H + 40, 0]], 2.2, M.plastic(0xe8eef4)));
  return { group: g, vessel: { inner: innerProfile(PROFILES.sklyanka({ R: p.R, H: p.H, neckR: 12 }).outer, 1.5), rimY: p.H, mouthR: 10 } };
};
B.qopqoq = (p) => {
  const g = new THREE.Group();
  const lid = cyl(p.R, p.R, 4, M.porcelain(), 24); lid.position.y = 2 * MM;
  const knob = at(cyl(4, 5, 5, M.porcelain(), 12), 0, 6, 0);
  g.add(lid, knob);
  return { group: g };
};
B.uchburchak = (p) => {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const wire = cyl(1, 1, p.R * 1.9, M.steel(), 6);
    wire.rotation.z = Math.PI / 2;
    wire.rotation.y = a;
    wire.position.set(Math.cos(a + Math.PI / 2) * p.R * 0.5 * MM, 0, Math.sin(a + Math.PI / 2) * p.R * 0.5 * MM);
    const tubeC = cyl(3, 3, p.R * 0.8, M.porcelain(), 10);
    tubeC.rotation.copy(wire.rotation);
    tubeC.position.copy(wire.position);
    g.add(wire, tubeC);
  }
  return { group: g };
};
B.qayiqcha = (p) => {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(-p.L / 2, 0); s.quadraticCurveTo(-p.L / 2, -8, -p.L / 2 + 8, -8); s.lineTo(p.L / 2 - 8, -8); s.quadraticCurveTo(p.L / 2, -8, p.L / 2, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 14, bevelEnabled: false });
  geo.scale(MM, MM, MM); geo.translate(0, 8 * MM, -7 * MM);
  g.add(mesh(geo, M.porcelain()));
  return { group: g, vessel: { inner: [[0, 2], [5, 4], [6, 8]], rimY: 8, mouthR: 6 } };
};
B['tomchi-plastinka'] = (p) => {
  const g = new THREE.Group();
  const plate = boxm(p.W, 10, p.D, M.porcelain()); plate.position.y = 5 * MM; g.add(plate);
  const wellMat = M.solid(0xe8e6e0, { rough: 0.3 });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const w = mesh(new THREE.CircleGeometry(8 * MM, 20), wellMat);
    w.rotation.x = -Math.PI / 2;
    w.position.set((-36 + i * 24) * MM, 10.2 * MM, (-22 + j * 22) * MM);
    g.add(w);
  }
  return { group: g, vessel: { inner: [[0, 7], [7, 9], [8, 10]], rimY: 10, mouthR: 8 } };
};
B.byuxner = (p) => {
  const g = new THREE.Group();
  const outer = [[4, 0], [4, 35], [p.R * 0.5, 45], [p.R, 55], [p.R, p.H - 1], [p.R + 2, p.H]];
  g.add(mesh(latheShell(outer, innerProfile(outer, 3), 32), M.porcelain()));
  return { group: g, funnel: { R: p.R, H: p.H } };
};
B.filtr = () => {
  const g = new THREE.Group();
  const cone = mesh(new THREE.ConeGeometry(30 * MM, 50 * MM, 24, 1, true), M.solid(0xfaf8f2, { rough: 1 }));
  cone.rotation.x = Math.PI; cone.position.y = 25 * MM;
  cone.material.side = THREE.DoubleSide;
  g.add(cone);
  return { group: g };
};

// ----------------------------------------------------------------- qizdirish asboblari
B['spirt-lampa'] = () => {
  const g = new THREE.Group();
  const body = buildLatheVessel('sklyanka', { R: 35, H: 70, neckR: 10 }, {});
  g.add(body.group);
  const wick = at(cyl(4, 4, 16, M.solid(0xe8e0c8, { rough: 1 }), 10), 0, 92, 0);
  const holder = at(cyl(8, 9, 10, M.steel(), 16), 0, 82, 0);
  g.add(wick, holder);
  const cap = at(cyl(13, 13, 26, M.glass({ thick: true }), 18), 50, 13, 0);
  cap.userData.part = 'qopqoq';
  g.add(cap);
  // spirt (ichida)
  const alc = at(cyl(32, 32, 30, new THREE.MeshPhysicalMaterial({ color: 0xeef7ff, transparent: true, opacity: 0.35, depthWrite: false }), 24), 0, 18, 0);
  g.add(alc);
  return { group: g, flame: flameAnchor(g, 100), heater: true };
};
B.bunzen = () => {
  const g = new THREE.Group();
  const base = at(cyl(38, 42, 14, M.darkMetal(), 28), 0, 7, 0);
  const tube = at(cyl(6.5, 6.5, 150, M.brass(), 16), 0, 85, 0);
  const collar = at(cyl(8.5, 8.5, 16, M.steel(), 16), 0, 30, 0);
  const inlet = at(cyl(4, 4, 30, M.brass(), 10), 22, 15, 0); inlet.rotation.z = Math.PI / 2;
  g.add(base, tube, collar, inlet);
  return { group: g, flame: flameAnchor(g, 162), heater: true };
};
B.plitka = () => {
  const g = new THREE.Group();
  const body = boxm(170, 60, 170, M.solid(0xf0f2f4, { rough: 0.5 })); body.position.y = 30 * MM;
  const plate = at(cyl(70, 70, 8, M.darkMetal(), 32), 0, 64, 0);
  plate.userData.part = 'plita';
  const knob = at(cyl(10, 10, 8, M.plastic(0x1f2937), 16), 60, 30, 86); knob.rotation.x = Math.PI / 2;
  const led = at(sph(3, new THREE.MeshBasicMaterial({ color: 0x334155 })), -60, 40, 86);
  led.userData.part = 'chiroq';
  g.add(body, plate, knob, led);
  return { group: g, plate, heater: true, indicator: led };
};
B.hammom = (p) => {
  const g = new THREE.Group();
  const pot = buildLatheVessel('stakan', { R: p.R, H: p.H, wall: 2 }, { porcelain: false });
  pot.glassMesh.material = M.steel();
  g.add(pot.group);
  const fill = at(cyl(p.R - 3, p.R - 3, p.H * 0.6, p.sand ? M.solid(0xd9c49a, { rough: 1 }) : new THREE.MeshPhysicalMaterial({ color: 0xb8dff0, transparent: true, opacity: 0.55, depthWrite: false }), 32), 0, p.H * 0.3 + 2, 0);
  g.add(fill);
  return { group: g, heater: true };
};
B.isitgich = (p) => {
  const g = new THREE.Group();
  const outer = mesh(new THREE.SphereGeometry(p.R * 1.25 * MM, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.solid(0x7c8794, { rough: 0.6 }));
  outer.position.y = 70 * MM; outer.material.side = THREE.DoubleSide;
  const base = at(cyl(70, 75, 30, M.solid(0x4b5563, { rough: 0.5 }), 32), 0, 15, 0);
  g.add(base, outer);
  return { group: g, heater: true };
};
B.mufel = () => {
  const g = new THREE.Group();
  const body = boxm(300, 280, 300, M.solid(0xe5e7eb, { rough: 0.5 })); body.position.y = 140 * MM;
  const door = boxm(180, 140, 10, M.solid(0x9ca3af, { rough: 0.5 })); door.position.set(0, 150 * MM, 152 * MM);
  const glow = boxm(120, 80, 2, new THREE.MeshBasicMaterial({ color: 0x331a0a })); glow.position.set(0, 150 * MM, 158 * MM); glow.userData.part = 'chiroq';
  g.add(body, door, glow);
  return { group: g, heater: true, indicator: glow };
};

// ----------------------------------------------------------------- mahkamlash
B.shtativ = (p) => {
  const g = new THREE.Group();
  const base = boxm(180, 12, 120, M.darkMetal()); base.position.set(0, 6 * MM, 0);
  const rod = at(cyl(6, 6, p.H, M.steel(), 16), 0, p.H / 2, -60);
  g.add(base, rod);
  return { group: g, rod: { x: 0, z: -60, h: p.H } };
};
B.mufta = () => {
  const g = new THREE.Group();
  g.add(boxm(22, 22, 22, M.darkMetal()), at(cyl(3, 3, 14, M.steel(), 8), 0, 0, 14));
  return { group: g };
};
B.lapka = () => {
  const g = new THREE.Group();
  const arm = at(cyl(4, 4, 130, M.steel(), 10), 65, 0, 0); arm.rotation.z = Math.PI / 2;
  const j1 = at(boxm(30, 6, 14, M.solid(0xb8a174, { rough: 0.9 })), 145, 8, 0);
  const j2 = j1.clone(); j2.position.y = -8 * MM;
  g.add(arm, j1, j2);
  return { group: g };
};
B.halqa = (p) => {
  const g = new THREE.Group();
  const arm = at(cyl(3, 3, 60, M.steel(), 8), 30, 0, 0); arm.rotation.z = Math.PI / 2;
  const ring = torus(p.R, 3, M.steel()); ring.rotation.x = Math.PI / 2; ring.position.x = 110 * MM;
  g.add(arm, ring);
  return { group: g };
};
B.uchoyoq = (p) => {
  const g = new THREE.Group();
  const ring = torus(p.R, 4, M.darkMetal()); ring.rotation.x = Math.PI / 2; ring.position.y = p.H * MM;
  g.add(ring);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = cyl(3.5, 3.5, p.H + 6, M.darkMetal(), 8);
    leg.position.set(Math.cos(a) * p.R * 1.1 * MM, (p.H / 2) * MM, Math.sin(a) * p.R * 1.1 * MM);
    leg.rotation.set(Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08);
    g.add(leg);
  }
  return { group: g };
};
B.tor = (p) => {
  const g = new THREE.Group();
  const mesh1 = boxm(p.W, 2, p.W, M.solid(0x8a8f96, { rough: 0.6, metal: 0.6 })); mesh1.position.y = 1 * MM;
  const center = at(cyl(p.W * 0.32, p.W * 0.32, 3, M.solid(0xf2efe6, { rough: 1 }), 24), 0, 1.5, 0);
  g.add(mesh1, center);
  return { group: g };
};
B['probirka-shtativ'] = () => {
  const g = new THREE.Group();
  const wood = M.wood();
  const top = boxm(200, 10, 50, wood); top.position.y = 70 * MM;
  const mid = boxm(200, 8, 50, wood); mid.position.y = 30 * MM;
  const base = boxm(210, 10, 60, wood); base.position.y = 5 * MM;
  const s1 = boxm(10, 75, 50, wood); s1.position.set(-100 * MM, 37 * MM, 0);
  const s2 = s1.clone(); s2.position.x = 100 * MM;
  g.add(top, mid, base, s1, s2);
  return { group: g };
};
B['probirka-qisqich'] = () => {
  const g = new THREE.Group();
  const w = M.wood();
  const a = boxm(160, 10, 14, w); a.position.y = 6 * MM;
  const b = boxm(140, 8, 12, w); b.position.set(10 * MM, 16 * MM, 0);
  const spring = at(cyl(5, 5, 14, M.steel(), 8), -40, 11, 0);
  g.add(a, b, spring);
  return { group: g };
};
B['tigel-qisqich'] = () => {
  const g = new THREE.Group();
  const s = M.steel();
  const a = cyl(2.5, 2.5, 220, s, 8); a.rotation.z = Math.PI / 2 + 0.06; a.position.y = 8 * MM;
  const b = a.clone(); b.rotation.z = Math.PI / 2 - 0.06;
  g.add(a, b);
  return { group: g };
};
B.pinset = () => {
  const g = new THREE.Group();
  const s = M.steel();
  const a = boxm(130, 2, 8, s); a.rotation.z = 0.04; a.position.y = 6 * MM;
  const b = a.clone(); b.rotation.z = -0.04; b.position.y = 2 * MM;
  g.add(a, b);
  return { group: g };
};

// ----------------------------------------------------------------- o'lchash
B.tarozi = () => {
  const g = new THREE.Group();
  const body = boxm(200, 40, 250, M.solid(0xeef0f3, { rough: 0.4 })); body.position.y = 20 * MM;
  const pan = at(cyl(70, 70, 4, M.steel(), 32), 0, 44, 15);
  const screen = boxm(90, 22, 2, new THREE.MeshBasicMaterial({ color: 0x0f172a })); screen.position.set(0, 26 * MM, 126 * MM);
  screen.userData.part = 'displey';
  g.add(body, pan, screen);
  return { group: g, display: screen };
};
B.termometr = (p) => {
  const g = new THREE.Group();
  const rod = cyl(3.5, 3.5, p.L, M.glass({ thick: true }), 10); rod.position.y = (p.L / 2) * MM;
  const bulb = at(sph(4.5, M.solid(0xc0262d, { rough: 0.3 }), 10), 0, 4, 0);
  const col = cyl(0.9, 0.9, p.L * 0.3, M.solid(0xd03a3a, { rough: 0.3 }), 6); col.position.y = (p.L * 0.15 + 6) * MM;
  col.userData.part = 'ustun';
  g.add(rod, bulb, col);
  return { group: g, column: col, L: p.L };
};
B['ph-metr'] = () => {
  const g = new THREE.Group();
  const body = boxm(90, 40, 140, M.solid(0xf3f4f6, { rough: 0.4 })); body.position.y = 20 * MM;
  const screen = boxm(60, 2, 30, new THREE.MeshBasicMaterial({ color: 0x0f172a })); screen.position.set(0, 41 * MM, 30 * MM);
  const probe = at(cyl(5, 5, 140, M.glass({ thick: true }), 12), 80, 70, 0);
  g.add(body, screen, probe);
  return { group: g, display: screen };
};
B.qogoz = () => {
  const g = new THREE.Group();
  const strip = boxm(10, 0.5, 70, M.solid(0xf2d067, { rough: 1 })); strip.position.y = 0.3 * MM;
  strip.userData.part = 'qogoz';
  g.add(strip);
  return { group: g, paper: strip };
};
B.areometr = () => {
  const g = new THREE.Group();
  const bulb = sph(10, M.glass(), 16); bulb.scale.y = 3; bulb.position.y = 30 * MM;
  const stem = at(cyl(3, 3, 120, M.glass(), 10), 0, 120, 0);
  g.add(bulb, stem);
  return { group: g };
};
B.sekundomer = () => {
  const g = new THREE.Group();
  const body = cyl(30, 30, 14, M.solid(0x1f2937, { rough: 0.4 }), 32); body.rotation.x = Math.PI / 2; body.position.y = 32 * MM;
  const face = at(cyl(26, 26, 1, M.solid(0xffffff, { rough: 0.6 }), 32), 0, 32, 8); face.rotation.x = Math.PI / 2;
  g.add(body, face);
  return { group: g };
};
B.konduktometr = () => B['ph-metr']();

// ----------------------------------------------------------------- elektrokimyo
B['tok-manbai'] = () => {
  const g = new THREE.Group();
  const body = boxm(180, 110, 140, M.solid(0x334155, { rough: 0.5 })); body.position.y = 55 * MM;
  const panel = boxm(150, 70, 2, M.solid(0x1e293b, { rough: 0.5 })); panel.position.set(0, 65 * MM, 71 * MM);
  const knob = at(cyl(12, 12, 10, M.plastic(0x9ca3af), 20), 40, 70, 74); knob.rotation.x = Math.PI / 2;
  const plus = at(cyl(6, 6, 14, M.plastic(0xdc2626), 12), -30, 66, 40);
  const minus = at(cyl(6, 6, 14, M.plastic(0x111827), 12), 30, 66, 40);
  const disp = boxm(50, 20, 2, new THREE.MeshBasicMaterial({ color: 0x0b3a1a })); disp.position.set(-30 * MM, 80 * MM, 72 * MM); disp.userData.part = 'displey';
  g.add(body, panel, knob, plus, minus, disp);
  return { group: g, display: disp };
};
B.elektrod = (p) => {
  const g = new THREE.Group();
  const col = { grafit: 0x2b2d31, mis: 0xc27a4a, rux: 0xa9adb1, temir: 0x8a8d90, platina: 0xd4d4d0 }[p.material] || 0x888888;
  const plate = boxm(18, 100, 2, M.solid(col, { rough: p.material === 'grafit' ? 0.8 : 0.35, metal: p.material === 'grafit' ? 0 : 0.85 }));
  plate.position.y = 50 * MM;
  plate.userData.part = 'plastinka';
  const clip = at(boxm(10, 12, 8, M.plastic(0xdc2626)), 0, 106, 0);
  g.add(plate, clip);
  return { group: g, plate };
};
B.gofman = () => {
  const g = new THREE.Group();
  const glassT = M.glass();
  for (const x of [-40, 40]) g.add(tubeAlong([[x, 20, 0], [x, 260, 0]], 9, glassT));
  g.add(tubeAlong([[0, 40, 0], [0, 320, 0]], 6, glassT), tubeAlong([[-40, 30, 0], [0, 30, 0], [40, 30, 0]], 7, glassT));
  const bulb = at(sph(25, glassT, 20), 0, 330, 0);
  const stand = boxm(140, 10, 60, M.darkMetal()); stand.position.y = 5 * MM;
  g.add(bulb, stand);
  return { group: g, vessel: { inner: [[0, 20], [40, 22], [40, 260]], rimY: 260, mouthR: 5 } };
};
B['tuz-koprigi'] = () => {
  const g = new THREE.Group();
  g.add(tubeAlong([[-50, 0, 0], [-50, 60, 0], [-30, 80, 0], [30, 80, 0], [50, 60, 0], [50, 0, 0]], 5, M.glass(), 48));
  return { group: g };
};
B.voltmetr = () => {
  const g = new THREE.Group();
  const body = boxm(140, 100, 70, M.solid(0xe5e7eb, { rough: 0.5 })); body.position.y = 50 * MM;
  const face = boxm(110, 60, 2, M.solid(0xffffff, { rough: 0.7 })); face.position.set(0, 60 * MM, 36 * MM);
  const needle = boxm(2, 45, 1, M.solid(0x111827)); needle.position.set(0, 52 * MM, 38 * MM);
  needle.geometry.translate(0, 22 * MM, 0); needle.position.y = 38 * MM; needle.userData.part = 'strelka';
  const plus = at(cyl(5, 5, 10, M.plastic(0xdc2626), 10), -25, 55, 40);
  g.add(body, face, needle, plus);
  return { group: g, needle, display: face };
};
B.sim = () => {
  const g = new THREE.Group();
  g.add(tubeAlong([[0, 0, 0], [60, 20, 20], [140, 10, -20], [200, 0, 0]], 1.5, M.plastic(0xdc2626)));
  return { group: g };
};
B.lampochka = () => {
  const g = new THREE.Group();
  const stand = boxm(80, 20, 60, M.solid(0x1f2937)); stand.position.y = 10 * MM;
  const bulb = at(sph(18, new THREE.MeshPhysicalMaterial({ color: 0xfff7d6, transparent: true, opacity: 0.6, emissive: 0x000000, roughness: 0.1 }), 20), 0, 62, 0);
  bulb.userData.part = 'lampa';
  const sock = at(cyl(10, 10, 20, M.steel(), 16), 0, 36, 0);
  const e1 = at(boxm(6, 90, 2, M.solid(0x2b2d31)), -20, -20, 40), e2 = at(boxm(6, 90, 2, M.solid(0x2b2d31)), 20, -20, 40);
  g.add(stand, sock, bulb, e1, e2);
  return { group: g, bulb };
};

// ----------------------------------------------------------------- yordamchi
B.tiqin = (p) => ({ group: stopper({ d1: p.d1, d2: p.d2, holes: p.holes }) });
B['shlif-tiqin'] = (p) => {
  const d = { '14/23': 14.5, '19/26': 18.8, '29/32': 29.2 }[p.size] || 19;
  const g = stopper({ d1: d * 0.85, d2: d, ground: true });
  const head = at(cyl(d * 0.7, d * 0.7, 8, M.glass({ thick: true }), 16), 0, 26, 0);
  g.add(head);
  return { group: g };
};
B.shlang = (p) => {
  const g = new THREE.Group();
  g.add(tubeAlong([[0, 0, 0], [p.L * 0.3, -40, 0], [p.L * 0.7, -40, 0], [p.L, 0, 0]], 4, M.rubber(0xb23a28), 40));
  return { group: g, flexible: true };
};
B['mor-qisqich'] = () => {
  const g = new THREE.Group();
  g.add(at(torus(10, 1.2, M.steel(), Math.PI * 1.6), 0, 10, 0));
  return { group: g };
};
B['gofman-qisqich'] = () => {
  const g = new THREE.Group();
  g.add(at(boxm(30, 6, 12, M.steel()), 0, 3, 0), at(cyl(2, 2, 30, M.steel(), 8), 0, 18, 0));
  return { group: g };
};
B.shpatel = () => {
  const g = new THREE.Group();
  const s = boxm(150, 1.5, 8, M.steel()); s.position.y = 1 * MM;
  const blade = boxm(25, 1.5, 14, M.steel()); blade.position.set(70 * MM, 1 * MM, 0);
  g.add(s, blade);
  return { group: g };
};
B.qoshiqcha = () => {
  const g = new THREE.Group();
  const v = buildLatheVessel('qoshiqcha', {}, { porcelain: false });
  v.glassMesh.material = M.steel();
  g.add(v.group);
  const rod = at(cyl(1.5, 1.5, 250, M.steel(), 8), 0, 132, 0);
  const disk = at(cyl(25, 25, 2, M.steel(), 24), 0, 160, 0);
  g.add(rod, disk);
  return { group: g, vessel: { inner: v.inner, rimY: v.rimY, mouthR: 8 } };
};
B.nixrom = () => {
  const g = new THREE.Group();
  const handle = at(cyl(4, 4, 90, M.glass({ thick: true }), 10), 0, 45, 0);
  const wire = at(cyl(0.6, 0.6, 60, M.solid(0x9a9a9a, { metal: 0.9, rough: 0.4 }), 6), 0, 120, 0);
  const loop = at(torus(3, 0.6, M.solid(0x9a9a9a, { metal: 0.9, rough: 0.4 })), 0, 152, 0);
  g.add(handle, wire, loop);
  return { group: g, tip: loop };
};
B.chop = (p) => {
  const g = new THREE.Group();
  const stick = boxm(3, 150, 3, M.solid(0xd9b98a, { rough: 0.9 })); stick.position.y = 75 * MM;
  const tip = at(sph(2.5, new THREE.MeshStandardMaterial({ color: 0x2b1a10, emissive: p.glowing ? 0xff5a10 : 0x000000, emissiveIntensity: 1.6 })), 0, 151, 0);
  g.add(stick, tip);
  return { group: g, tip, flame: p.burning ? flameAnchor(g, 158) : null, glowing: !!p.glowing };
};
B.gugurt = () => {
  const g = new THREE.Group();
  g.add(at(boxm(50, 14, 35, M.solid(0xe8c23a, { rough: 0.8 })), 0, 7, 0));
  return { group: g };
};
B.vanna = (p) => {
  const g = new THREE.Group();
  const glassT = M.glass({ thick: true });
  const body = boxm(p.W, p.H, p.D, glassT); body.position.y = (p.H / 2) * MM;
  const water = boxm(p.W - 8, p.H * 0.7, p.D - 8, new THREE.MeshPhysicalMaterial({ color: 0xb9def0, transparent: true, opacity: 0.45, depthWrite: false })); water.position.y = (p.H * 0.35 + 2) * MM;
  water.userData.part = 'suv';
  const shelf = boxm(60, 6, 50, M.plastic(0x64748b)); shelf.position.set(40 * MM, 55 * MM, 0);
  g.add(body, water, shelf);
  return { group: g, water };
};
B.nasos = () => {
  const g = new THREE.Group();
  g.add(at(cyl(10, 6, 120, M.brass(), 14), 0, 60, 0), at(cyl(4, 4, 30, M.brass(), 8), 20, 40, 0));
  return { group: g };
};
B.yoritgich = () => {
  const g = new THREE.Group();
  const base = at(cyl(40, 45, 12, M.solid(0x1f2937), 24), 0, 6, 0);
  const arm = at(cyl(4, 4, 200, M.steel(), 10), 0, 106, 0);
  const head = at(cyl(18, 40, 50, M.solid(0x334155), 24), 30, 205, 0); head.rotation.z = -0.6;
  const lens = at(cyl(36, 36, 2, new THREE.MeshBasicMaterial({ color: 0x6b5bd6 }), 24), 44, 186, 0); lens.rotation.z = -0.6;
  lens.userData.part = 'lampa';
  g.add(base, arm, head, lens);
  return { group: g, lamp: lens };
};
const iconItem = (color) => () => {
  const g = new THREE.Group();
  g.add(at(boxm(80, 20, 60, M.solid(color, { rough: 0.7 })), 0, 10, 0));
  return { group: g };
};
B.kozoynak = iconItem(0x93c5fd);
B.qolqop = iconItem(0x60a5fa);
B.xalat = iconItem(0xf8fafc);

/**
 * Jihozni yasash.
 * @param {object} def equipment.json elementi
 * @param {object} size tanlangan o'lcham varianti
 */
export function buildEquipment(def, size) {
  const fn = B[def.builder];
  const p = size?.params || def.sizes?.[0]?.params || {};
  let res;
  try { res = fn ? fn(p, def) : null; } catch (e) { console.warn('model xatosi', def.id, e); res = null; }
  if (!res) res = iconItem(0x94a3b8)();
  const group = res.group;
  group.name = def.id;
  group.userData.equipmentId = def.id;
  // portlar
  res.ports = {};
  for (const port of size?.ports || def.sizes?.[0]?.ports || []) {
    const o = new THREE.Object3D();
    o.position.set(port.pos[0] * MM, port.pos[1] * MM, port.pos[2] * MM);
    o.userData.port = port;
    o.name = `port:${port.id}`;
    group.add(o);
    res.ports[port.id] = o;
  }
  group.traverse((o) => { if (o.isMesh) { o.userData.equipment = true; } });
  return res;
}

export const BUILDERS = B;
export { bottleLabel };
