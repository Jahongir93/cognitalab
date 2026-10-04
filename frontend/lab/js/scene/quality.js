// Sifat darajasini aniqlash: past / o'rta / yuqori.
// Birinchi ishga tushishda WebGL renderer nomi, ekran o'lchami va protsessor yadrolari bo'yicha taxmin qilinadi,
// keyin birinchi soniyalardagi kadr tezligi bo'yicha pasaytirilishi mumkin. Foydalanuvchi sozlamada o'zgartira oladi.

const KEY = 'cognita-lab-quality';

export const QUALITY = {
  past: { id: 'past', pixelRatio: 1, shadows: false, transmission: false, particles: 0.35, envSize: 64, antialias: false, maxLights: 1 },
  orta: { id: 'orta', pixelRatio: 1.25, shadows: true, transmission: false, particles: 0.7, envSize: 128, antialias: true, maxLights: 2 },
  yuqori: { id: 'yuqori', pixelRatio: 2, shadows: true, transmission: true, particles: 1, envSize: 256, antialias: true, maxLights: 3 },
};

/** Saqlangan yoki avtomatik tanlangan daraja */
export function pickQuality() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && QUALITY[saved]) return QUALITY[saved];
  } catch { /* localStorage yopiq bo'lishi mumkin */ }
  return QUALITY[guessTier()];
}

export function saveQuality(id) {
  try { localStorage.setItem(KEY, id); } catch { /* e'tiborsiz */ }
}

export function guessTier() {
  let renderer = '';
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'past';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).toLowerCase();
  } catch { return 'past'; }
  const cores = navigator.hardwareConcurrency || 2;
  const mobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 600;
  if (/swiftshader|llvmpipe|software|microsoft basic/.test(renderer)) return 'past';
  if (mobile) return cores >= 8 ? 'orta' : 'past';
  if (/nvidia|geforce|rtx|radeon rx|apple m\d|apple gpu/.test(renderer)) return 'yuqori';
  if (/intel|uhd|iris|mali|adreno|powervr/.test(renderer)) return cores >= 8 ? 'orta' : 'past';
  return 'orta';
}

/** Kadr tezligini kuzatib, juda past bo'lsa darajani pasaytirishni tavsiya qiladi */
export class FpsMonitor {
  constructor() { this.samples = []; this.last = performance.now(); }
  tick() {
    const now = performance.now();
    this.samples.push(now - this.last);
    this.last = now;
    if (this.samples.length > 120) this.samples.shift();
  }
  get fps() {
    if (this.samples.length < 30) return 60;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    return 1000 / avg;
  }
}
