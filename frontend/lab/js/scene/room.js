// Laboratoriya xonasi: pol, devorlar, deraza, ish stoli, reaktivlar javoni, jihozlar shkafi,
// rakovina va jo'mrak, mo'rili shkaf, chiqindi idishi. Barchasi primitivlardan protsedura bilan.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as M from './materials.js';

export const BENCH = { y: 0.9, w: 2.6, d: 0.9, x0: -1.3, x1: 1.3, z0: -0.45, z1: 0.45, zc: -0.95 };
// ish maydoni zonalari (stol ustida, x bo'yicha)
export const ZONES = {
  sink: { x: -1.05, z: -0.12, r: 0.17 },
  hood: { x0: 0.78, x1: 1.28, z0: -0.42, z1: 0.2 },
  waste: { x: -1.55, z: 0.55 },
};

function box(w, h, d, mat, r = 0.01) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function floorTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#c9cdd2';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#b4b9bf';
  g.lineWidth = 3;
  for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Ish stoli usti — kimyoviy chidamli qoramtir qoplama (yengil donador tekstura) */
function benchTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#2d3138';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
    const v = 40 + Math.floor(Math.random() * 18);
    g.fillStyle = `rgb(${v},${v + 3},${v + 8})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildRoom(scene, quality) {
  const room = new THREE.Group();
  room.name = 'xona';

  // pol va devorlar
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.95 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), wallMat);
  back.position.set(0, 2, -1.4);
  back.receiveShadow = true;
  room.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(12, 4), wallMat);
  left.position.set(-3.5, 2, 2);
  left.rotation.y = Math.PI / 2;
  room.add(left);
  // devordagi kafel (stol orqasi)
  const tileMat = new THREE.MeshStandardMaterial({ color: 0xf6f8fa, roughness: 0.3 });
  const splash = new THREE.Mesh(new THREE.PlaneGeometry(BENCH.w, 0.55), tileMat);
  splash.position.set(0, BENCH.y + 0.275, -1.399 + 0.001);
  room.add(splash);

  // deraza (yorug' panel)
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), new THREE.MeshBasicMaterial({ color: 0xdfefff }));
  win.position.set(-1.9, 2.0, -1.39);
  room.add(win);
  const frameMat = M.solid(0xf2f2f2, { rough: 0.6 });
  for (const [w, h, x, y] of [[1.7, 0.05, -1.9, 2.57], [1.7, 0.05, -1.9, 1.43], [0.05, 1.2, -2.75, 2.0], [0.05, 1.2, -1.05, 2.0], [0.04, 1.1, -1.9, 2.0]]) {
    const f = box(w, h, 0.04, frameMat, 0);
    f.position.set(x, y, -1.38);
    room.add(f);
  }

  // ish stoli: tumbalar va qoplama
  const cabMat = M.solid(0xdfe3e8, { rough: 0.6 });
  const handleMat = M.steel();
  const benchZ = -0.95;
  const body = box(BENCH.w, BENCH.y - 0.04, BENCH.d - 0.04, cabMat, 0.01);
  body.position.set(0, (BENCH.y - 0.04) / 2, benchZ);
  room.add(body);
  for (let i = 0; i < 5; i++) {
    const x = BENCH.x0 + 0.26 + i * 0.52;
    const door = box(0.48, BENCH.y - 0.2, 0.01, M.solid(0xe9ecf0, { rough: 0.5 }), 0.004);
    door.position.set(x, (BENCH.y - 0.04) / 2 + 0.02, benchZ + BENCH.d / 2 - 0.015);
    room.add(door);
    const handle = box(0.12, 0.012, 0.02, handleMat, 0.004);
    handle.position.set(x, BENCH.y - 0.16, benchZ + BENCH.d / 2 + 0.005);
    room.add(handle);
  }
  const topMat = new THREE.MeshStandardMaterial({ map: benchTexture(), roughness: 0.55, metalness: 0.05 });
  const top = box(BENCH.w + 0.04, 0.04, BENCH.d + 0.02, topMat, 0.008);
  top.position.set(0, BENCH.y - 0.02, benchZ);
  top.name = 'stol-usti';
  room.add(top);

  // reaktivlar javoni (stol orqasida)
  const shelfMat = M.solid(0xc9ad84, { rough: 0.7 });
  for (const y of [BENCH.y + 0.35, BENCH.y + 0.62]) {
    const shelf = box(1.5, 0.025, 0.2, shelfMat, 0.004);
    shelf.position.set(-0.25, y, -1.3);
    room.add(shelf);
  }
  for (const x of [-1.0, 0.5]) {
    const post = box(0.02, 0.68, 0.2, shelfMat, 0.002);
    post.position.set(x, BENCH.y + 0.34, -1.3);
    room.add(post);
  }
  // javondagi sklyankalar (bezak; reaktivlar interfeys orqali olinadi)
  const bottleColors = [0xffffff, 0x7a3d0c, 0xffffff, 0xffffff, 0x7a3d0c, 0xffffff, 0xffffff, 0x7a3d0c];
  const shelfBottles = new THREE.Group();
  shelfBottles.name = 'reaktiv-javoni';
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 9; i++) {
      const amber = bottleColors[(i + row * 3) % bottleColors.length] !== 0xffffff;
      const r = 0.026 + ((i * 7 + row) % 3) * 0.004;
      const h = 0.11 + ((i + row) % 3) * 0.015;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), amber ? M.glass({ amber: true }) : M.glass());
      b.position.set(-0.92 + i * 0.165, (row ? BENCH.y + 0.62 : BENCH.y + 0.35) + 0.0125 + h / 2, -1.3);
      shelfBottles.add(b);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.5, 0.025, 16), M.plastic(0x30343c));
      cap.position.set(b.position.x, b.position.y + h / 2 + 0.012, b.position.z);
      shelfBottles.add(cap);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.3, h * 0.4), M.solid(0xf7f3e6, { rough: 0.9 }));
      lab.position.set(b.position.x, b.position.y, b.position.z + r + 0.001);
      shelfBottles.add(lab);
    }
  }
  room.add(shelfBottles);

  // rakovina va jo'mrak (stolning chap qismida)
  const sink = new THREE.Group();
  sink.name = 'rakovina';
  const basinMat = M.steel();
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.12, 32, 1, true), basinMat);
  basin.position.set(ZONES.sink.x, BENCH.y - 0.06, benchZ + ZONES.sink.z + 0.95 - 0.95);
  basin.material.side = THREE.DoubleSide;
  sink.add(basin);
  const basinBottom = new THREE.Mesh(new THREE.CircleGeometry(0.13, 32), M.solid(0x6f7780, { rough: 0.4, metal: 0.8 }));
  basinBottom.rotation.x = -Math.PI / 2;
  basinBottom.position.set(ZONES.sink.x, BENCH.y - 0.119, basin.position.z);
  sink.add(basinBottom);
  const tapPipe = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 10, 24, Math.PI), M.steel());
  tapPipe.position.set(ZONES.sink.x, BENCH.y + 0.12, basin.position.z - 0.11);
  tapPipe.rotation.y = Math.PI / 2;
  sink.add(tapPipe);
  const tapStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.12, 12), M.steel());
  tapStem.position.set(ZONES.sink.x, BENCH.y + 0.06, basin.position.z - 0.2);
  sink.add(tapStem);
  sink.userData.zone = 'sink';
  room.add(sink);
  // rakovina teshigi stol ustida qora halqa ko'rinishida
  const hole = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.158, 40), M.solid(0x1a1c20));
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(ZONES.sink.x, BENCH.y + 0.0005, basin.position.z);
  room.add(hole);

  // mo'rili shkaf (o'ng tomonda)
  const hood = new THREE.Group();
  hood.name = 'morili-shkaf';
  const hoodMat = M.solid(0xe4e8ec, { rough: 0.5 });
  const hx = (ZONES.hood.x0 + ZONES.hood.x1) / 2, hw = ZONES.hood.x1 - ZONES.hood.x0;
  const sideL = box(0.03, 0.75, 0.62, hoodMat, 0.004);
  sideL.position.set(ZONES.hood.x0 - 0.015, BENCH.y + 0.375, benchZ - 0.11);
  const sideR = sideL.clone();
  sideR.position.x = ZONES.hood.x1 + 0.015;
  const roof = box(hw + 0.06, 0.06, 0.62, hoodMat, 0.006);
  roof.position.set(hx, BENCH.y + 0.78, benchZ - 0.11);
  const backP = box(hw, 0.75, 0.02, hoodMat, 0);
  backP.position.set(hx, BENCH.y + 0.375, benchZ - 0.42);
  const sash = new THREE.Mesh(new THREE.PlaneGeometry(hw, 0.36), M.glass());
  sash.position.set(hx, BENCH.y + 0.58, benchZ + 0.2);
  const sashFrame = box(hw + 0.02, 0.025, 0.025, M.steel(), 0.004);
  sashFrame.position.set(hx, BENCH.y + 0.4, benchZ + 0.2);
  const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 20), M.steel());
  duct.position.set(hx, BENCH.y + 1.15, benchZ - 0.2);
  hood.add(sideL, sideR, roof, backP, sash, sashFrame, duct);
  const lamp = new THREE.Mesh(new THREE.PlaneGeometry(hw * 0.8, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  lamp.rotation.x = Math.PI / 2;
  lamp.position.set(hx, BENCH.y + 0.745, benchZ - 0.12);
  hood.add(lamp);
  hood.userData.zone = 'hood';
  room.add(hood);

  // chiqindi idishi (polda)
  const bin = new THREE.Group();
  bin.name = 'chiqindi-idishi';
  const binBody = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.5, 28), M.plastic(0x3d7d4a));
  binBody.position.set(ZONES.waste.x, 0.25, ZONES.waste.z - 0.95 + 0.55);
  binBody.castShadow = true;
  const binLid = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.03, 28), M.plastic(0x2f6a3b));
  binLid.position.set(binBody.position.x, 0.515, binBody.position.z);
  const binSign = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.1), new THREE.MeshStandardMaterial({ map: M.labelTexture(['Chiqindi', 'kimyoviy'], { w: 256, h: 180, accent: '#d97706' }) }));
  binSign.position.set(binBody.position.x, 0.3, binBody.position.z + 0.16);
  bin.add(binBody, binLid, binSign);
  bin.userData.zone = 'waste';
  room.add(bin);

  // jihozlar shkafi (chap devor yonida)
  const cab = new THREE.Group();
  cab.name = 'jihozlar-shkafi';
  const cabinet = box(0.9, 1.9, 0.45, M.solid(0xd7dce2, { rough: 0.55 }), 0.01);
  cabinet.position.set(-2.6, 0.95, -1.15);
  const glassDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.05), M.glass());
  glassDoor.position.set(-2.6, 1.35, -0.925);
  cab.add(cabinet, glassDoor);
  for (const y of [1.0, 1.35, 1.7]) {
    const sh = box(0.82, 0.015, 0.4, M.solid(0xf2f4f6), 0.003);
    sh.position.set(-2.6, y, -1.15);
    cab.add(sh);
    for (let i = 0; i < 5; i++) {
      const r = 0.025 + (i % 3) * 0.01;
      const fl = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.2, 0.12, 16), M.glass());
      fl.position.set(-2.92 + i * 0.16, y + 0.07, -1.12);
      cab.add(fl);
    }
  }
  cab.userData.zone = 'cabinet';
  room.add(cab);

  scene.add(room);
  return { room, benchTop: top, benchZ, sink, hood, bin, cabinet: cab, shelf: shelfBottles };
}
