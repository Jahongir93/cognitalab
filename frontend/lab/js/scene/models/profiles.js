// Aylanish jismlari uchun profillar (r, y) — millimetrda. Tashqi profil pastdan yuqoriga,
// devor qalinligi bilan ichki profil hisoblanadi. Barcha qiymatlar data/equipment.json dagi parametrlardan.

/** Doira yoyi nuqtalari */
function arc(cx, cy, r, a0, a1, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/**
 * Tashqi profil (r, y), mm. Har bir funksiya {outer, rim} qaytaradi; rim — og'iz balandligi.
 */
export const PROFILES = {
  probirka({ R = 8, H = 150 }) {
    const pts = [[0, 0], ...arc(0, R, R, -Math.PI / 2, 0, 12).slice(1), [R, H - 1], [R + 0.7, H - 0.4], [R + 0.7, H]];
    return { outer: pts, rim: H };
  },
  stakan({ R = 25, H = 70 }) {
    const c = Math.min(4, R * 0.12);
    const pts = [[0, 0], [R - c, 0], ...arc(R - c, c, c, -Math.PI / 2, 0, 6).slice(1), [R, H - 2], [R + 1.2, H - 0.8], [R + 1.4, H]];
    return { outer: pts, rim: H };
  },
  erlenmeyer({ R = 32, H = 105, neckR = 11, neckH = 25 }) {
    const c = 6;
    const yCone = H - neckH;
    const pts = [[0, 0], [R - c, 0], ...arc(R - c, c, c, -Math.PI / 2, -0.35, 6).slice(1), [neckR + 2, yCone - 4], [neckR, yCone + 2], [neckR, H - 2], [neckR + 1.5, H - 1], [neckR + 1.5, H]];
    return { outer: pts, rim: H };
  },
  kolba({ R = 42, H = 150, neckR = 12, neckH = 50, flat = false }) {
    // shar markazi y = R; bo'yin sharning yuqori qismidan chiqadi
    const cy = R;
    const a1 = Math.PI / 2 - Math.asin(Math.min(neckR / R, 0.99));
    const start = flat ? -Math.asin(0.55) : -Math.PI / 2;
    const ball = arc(0, cy, R, start, a1, 22);
    const pts = flat ? [[0, cy + R * Math.sin(start)], ...ball] : [...ball];
    if (!flat) pts[0] = [0, 0];
    const neckBase = cy + R * Math.sin(a1);
    pts.push([neckR, neckBase + 3], [neckR, H - 3], [neckR + 2, H - 2], [neckR + 2, H]);
    if (flat) { const y0 = pts[0][1]; for (const p of pts) p[1] -= y0; }
    return { outer: pts, rim: pts[pts.length - 1][1] };
  },
  'olchov-kolba'({ R = 30, H = 170, neckR = 7 }) {
    const c = 8;
    const bulbH = R * 1.6;
    const pts = [[0, 0], [R - c, 0], ...arc(R - c, c, c, -Math.PI / 2, 0, 6).slice(1), [R, bulbH * 0.45], ...arc(0, bulbH * 0.45, R, 0, Math.PI / 2 - Math.asin(neckR / R), 12).slice(1), [neckR, bulbH + 8], [neckR, H - 3], [neckR + 2.5, H - 2], [neckR + 2.5, H]];
    return { outer: pts, rim: H };
  },
  silindr({ R = 12, H = 200 }) {
    // asos (oyoq) alohida yasaladi; bu yerda faqat silindr tanasi
    const pts = [[0, 8], [R, 8], [R, H - 2], [R + 1, H - 1], [R + 1.2, H]];
    return { outer: pts, rim: H, foot: { R: R * 2.4, h: 8 } };
  },
  menzurka({ R = 32, r = 14, H = 110 }) {
    const pts = [[0, 0], [R - 4, 0], [R, 3], [r + 2, H - 4], [r, H - 1], [r + 1.5, H]];
    return { outer: pts, rim: H };
  },
  sklyanka({ R = 30, H = 110, neckR = 11 }) {
    const sh = H * 0.68;
    const pts = [[0, 0], [R - 4, 0], [R, 4], [R, sh], ...arc(neckR + 6, sh, R - neckR - 6, 0, Math.PI / 2, 8).slice(1).map(([x, y]) => [x, y]), [neckR, sh + (R - neckR - 6) + 4], [neckR, H - 3], [neckR + 2.5, H - 2], [neckR + 2.5, H]];
    return { outer: pts, rim: H };
  },
  kosacha({ R = 45, H = 30 }) {
    const pts = [[0, 0], ...arc(0, R * 1.6, R * 1.6, -Math.PI / 2, -Math.PI / 2 + Math.asin(R / (R * 1.6)), 14).slice(1)];
    const top = pts[pts.length - 1];
    pts.push([top[0] + 2, top[1] + 1]);
    for (const p of pts) p[1] = Math.min(p[1], H);
    return { outer: pts, rim: Math.min(top[1] + 1, H) };
  },
  tigel({ R = 16, H = 38 }) {
    const pts = [[0, 0], [R * 0.62, 0], [R * 0.66, 1.5], [R, H - 1], [R + 0.8, H]];
    return { outer: pts, rim: H };
  },
  petri({ R = 45, H = 15 }) {
    const pts = [[0, 0], [R - 1, 0], [R, 1], [R, H]];
    return { outer: pts, rim: H };
  },
  'soat-oynasi'({ R = 40 }) {
    const rr = R * 2.2;
    const pts = [[0, 0], ...arc(0, rr, rr, -Math.PI / 2, -Math.PI / 2 + Math.asin(R / rr), 12).slice(1)];
    return { outer: pts, rim: pts[pts.length - 1][1] };
  },
  hovoncha({ R = 45, H = 45 }) {
    const pts = [[0, 0], [R * 0.6, 0], [R * 0.75, 6], ...arc(0, H * 1.1, R, -0.9, 0, 8).slice(1).map(([x, y]) => [x, Math.min(y, H)]), [R + 3, H]];
    return { outer: pts, rim: H, wall: 6 };
  },
  qoshiqcha() {
    return { outer: [[0, 0], [6, 0], [9, 4], [10, 7]], rim: 7 };
  },
};

/**
 * Tashqi profildan ichki profilni (devor qalinligi bilan) hisoblaydi.
 * @param {number[][]} outer
 * @param {number} wall mm
 */
export function innerProfile(outer, wall) {
  const inner = [];
  for (let i = 0; i < outer.length; i++) {
    const [x, y] = outer[i];
    const p = outer[Math.max(i - 1, 0)], n = outer[Math.min(i + 1, outer.length - 1)];
    let tx = n[0] - p[0], ty = n[1] - p[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len; ty /= len;
    // ichkariga normal: (-ty, tx) yo'nalishini r kamayadigan tomonga
    let nx = ty, ny = -tx;
    if (nx > 0) { nx = -nx; ny = -ny; }
    let ix = x + nx * wall, iy = y + ny * wall;
    if (i === 0) { ix = 0; iy = y + wall; }
    inner.push([Math.max(ix, 0), iy]);
  }
  // og'izga yaqin nuqtalar: ichki chegarani rim gacha cho'zamiz
  const rimY = outer[outer.length - 1][1];
  inner[inner.length - 1][1] = rimY;
  // monoton bo'lmagan joylarni tozalash
  for (let i = 1; i < inner.length; i++) if (inner[i][1] < inner[i - 1][1]) inner[i][1] = inner[i - 1][1];
  return inner;
}

/** Ichki profil bo'yicha y balandlikdagi ichki radius (mm) */
export function radiusAt(inner, y) {
  if (y <= inner[0][1]) return 0;
  for (let i = 1; i < inner.length; i++) {
    const [x0, y0] = inner[i - 1], [x1, y1] = inner[i];
    if (y <= y1) {
      const t = y1 > y0 ? (y - y0) / (y1 - y0) : 1;
      return x0 + (x1 - x0) * t;
    }
  }
  return inner[inner.length - 1][0];
}

/** Ichki hajm (mL) y balandlikkacha */
export function volumeTo(inner, y, steps = 120) {
  const y0 = inner[0][1];
  if (y <= y0) return 0;
  let v = 0;
  const dy = (y - y0) / steps;
  for (let i = 0; i < steps; i++) {
    const r = radiusAt(inner, y0 + (i + 0.5) * dy);
    v += Math.PI * r * r * dy;
  }
  return v / 1000; // mm³ -> mL
}
