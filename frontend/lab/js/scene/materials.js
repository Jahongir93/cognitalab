// Materiallar: shisha, suyuqlik, chinni, metall, rezina va h.k. Sifat darajasiga qarab tanlanadi.
import * as THREE from 'three';

let Q = null;
const cache = new Map();

export function setQuality(q) { Q = q; cache.clear(); }
export function quality() { return Q; }

/** Shisha: yuqori darajada haqiqiy sinish (transmission), pastda arzon shaffoflik */
export function glass({ tint = 0xffffff, amber = false, thick = false } = {}) {
  const key = `glass-${tint}-${amber}-${thick}-${Q?.id}`;
  if (cache.has(key)) return cache.get(key);
  let m;
  const color = amber ? 0x7a3d0c : tint;
  if (Q?.transmission) {
    m = new THREE.MeshPhysicalMaterial({
      color, metalness: 0, roughness: 0.04, transmission: 1, thickness: thick ? 0.004 : 0.0015, ior: 1.5,
      envMapIntensity: 1.2, specularIntensity: 1, clearcoat: 0.6, clearcoatRoughness: 0.05,
      attenuationColor: new THREE.Color(amber ? 0x8a4a10 : 0xe8f4ee), attenuationDistance: amber ? 0.02 : 0.25,
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
    });
  } else {
    m = new THREE.MeshPhysicalMaterial({
      color: amber ? 0x6a3008 : 0xdfeee8, metalness: 0, roughness: 0.05, transparent: true, opacity: amber ? 0.72 : 0.2,
      envMapIntensity: 1.6, clearcoat: Q?.id === 'past' ? 0 : 0.8, clearcoatRoughness: 0.05, side: THREE.DoubleSide, depthWrite: false,
      specularIntensity: 1,
    });
  }
  m.userData.isGlass = true;
  cache.set(key, m);
  return m;
}

/** Suyuqlik materiali — har bir idish uchun alohida (rangi o'zgaradi) */
export function liquid() {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xdfeff7, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.55,
    transmission: Q?.transmission ? 0.6 : 0, thickness: 0.02, ior: 1.333,
    envMapIntensity: 0.8, side: THREE.DoubleSide, depthWrite: false,
  });
  m.userData.isLiquid = true;
  return m;
}

export function solid(color = 0xffffff, { rough = 0.85, metal = 0 } = {}) {
  const key = `solid-${color}-${rough}-${metal}`;
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  cache.set(key, m);
  return m;
}

export const porcelain = () => solid(0xf4f2ec, { rough: 0.35 });
export const rubber = (c = 0x9a3a2a) => solid(c, { rough: 0.9 });
export const steel = () => solid(0x9aa3ad, { rough: 0.35, metal: 0.85 });
export const darkMetal = () => solid(0x3a3f46, { rough: 0.5, metal: 0.7 });
export const brass = () => solid(0xb8913a, { rough: 0.35, metal: 0.9 });
export const plastic = (c = 0x2b3442) => solid(c, { rough: 0.6 });
export const wood = () => solid(0x8a6a48, { rough: 0.8 });

/** Matnli yorliq (reaktiv sklyankasi uchun) — canvas tekstura */
export function labelTexture(lines, { w = 256, h = 128, bg = '#fbf8ef', fg = '#1b2433', accent = '#2563eb' } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = accent; g.fillRect(0, 0, w, 10);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.font = `bold ${Math.round(h * 0.28)}px Inter, system-ui, sans-serif`;
  g.fillText(lines[0] || '', w / 2, h * 0.45);
  g.font = `${Math.round(h * 0.16)}px Inter, system-ui, sans-serif`;
  if (lines[1]) g.fillText(lines[1], w / 2, h * 0.68);
  if (lines[2]) g.fillText(lines[2], w / 2, h * 0.88);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
