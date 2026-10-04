// Shisha va chinni idishlarning protsedura modellari (aylanish jismlari, devor qalinligi bilan).
import * as THREE from 'three';
import { PROFILES, innerProfile } from './profiles.js';
import * as M from '../materials.js';

export const MM = 0.001; // mm -> m

/** Tashqi va ichki profildan yopiq devorli aylanish jismi */
export function latheShell(outer, inner, segments = 40) {
  const pts = [];
  for (const [x, y] of outer) pts.push(new THREE.Vector2(x * MM, y * MM));
  for (let i = inner.length - 1; i >= 0; i--) pts.push(new THREE.Vector2(inner[i][0] * MM, inner[i][1] * MM));
  const g = new THREE.LatheGeometry(pts, segments);
  g.computeVertexNormals();
  return g;
}

/** Shisha naycha (egri chiziq bo'ylab), mm */
export function tubeAlong(points, r = 3.5, mat = M.glass(), tubular = 48) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x * MM, y * MM, z * MM)), false, 'catmullrom', 0.05);
  const g = new THREE.TubeGeometry(curve, tubular, r * MM, 10, false);
  return new THREE.Mesh(g, mat);
}

function cyl(rTop, rBot, h, mat, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop * MM, rBot * MM, h * MM, seg), mat);
  return m;
}

/** Darajalash chiziqlari (o'lchov idishlari uchun) — yupqa halqalar */
function graduations(group, inner, yFrom, yTo, step, R) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
  const n = Math.floor((yTo - yFrom) / step);
  for (let i = 1; i <= n; i++) {
    const y = yFrom + i * step;
    const long = i % 5 === 0;
    const g = new THREE.RingGeometry((R + 0.05) * MM, (R + 0.25) * MM, 16, 1, 0, long ? 0.9 : 0.45);
    const m = new THREE.Mesh(g, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = y * MM;
    m.rotation.z = Math.PI * 0.3;
    group.add(m);
  }
}

/**
 * Aylanish jismi asosidagi idishni yasaydi.
 * @returns {{group:THREE.Group, inner:number[][], rimY:number, glassMesh:THREE.Mesh}}
 */
export function buildLatheVessel(kind, p, opts = {}) {
  const prof = PROFILES[kind](p);
  const wall = prof.wall ?? p.wall ?? (opts.porcelain ? 3 : 1.2);
  const inner = innerProfile(prof.outer, wall);
  const group = new THREE.Group();
  const mat = opts.porcelain ? M.porcelain() : M.glass({ amber: p.amber, thick: opts.thick });
  const mesh = new THREE.Mesh(latheShell(prof.outer, inner, opts.segments || 40), mat);
  mesh.castShadow = !opts.porcelain ? false : true;
  mesh.receiveShadow = true;
  mesh.userData.part = 'body';
  mesh.renderOrder = 2;
  group.add(mesh);
  if (prof.foot) {
    const foot = cyl(prof.foot.R, prof.foot.R * 1.05, prof.foot.h, M.glass({ thick: true }), 6);
    foot.position.y = (prof.foot.h / 2) * MM;
    group.add(foot);
  }
  if (opts.graduated) {
    const yTop = prof.rim * 0.88;
    graduations(group, inner, inner[0][1], yTop, (yTop - inner[0][1]) / 20, prof.outer[Math.floor(prof.outer.length / 2)][0]);
  }
  return { group, inner, rimY: prof.rim, glassMesh: mesh };
}

/** Rezina tiqin (konus) */
export function stopper({ d1 = 17, d2 = 27, holes = 0, ground = false }) {
  const g = new THREE.Group();
  const h = 22;
  const mat = ground ? M.glass({ thick: true }) : M.rubber();
  const body = cyl(d2 / 2, d1 / 2, h, mat, 28);
  body.position.y = (h / 2) * MM;
  g.add(body);
  if (holes) {
    const holeMat = M.solid(0x2a1410);
    for (let i = 0; i < holes; i++) {
      const hole = cyl(3.2, 3.2, 0.6, holeMat, 12);
      hole.position.set((holes === 2 ? (i ? 1 : -1) * d2 * 0.22 : 0) * MM, (h + 0.2) * MM, 0);
      g.add(hole);
    }
  }
  return g;
}

/** Sklyanka yorlig'i */
export function bottleLabel(group, R, yMid, text) {
  const tex = M.labelTexture(text);
  const geo = new THREE.CylinderGeometry((R + 0.3) * MM, (R + 0.3) * MM, R * 1.0 * MM, 32, 1, true, -Math.PI * 0.42, Math.PI * 0.84);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.FrontSide });
  const lab = new THREE.Mesh(geo, mat);
  lab.position.y = yMid * MM;
  lab.rotation.y = Math.PI / 2;
  lab.userData.part = 'label';
  group.add(lab);
  return lab;
}
