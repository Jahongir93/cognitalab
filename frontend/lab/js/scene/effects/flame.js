// Alanga: gorelka (ko'k ichki konus), spirt lampasi (sariq-to'q sariq), yonayotgan cho'p, reaksiya alangasi.
// Protsedura shader: shovqin bilan miltillovchi konus, qo'shiluvchi aralashtirish.
import * as THREE from 'three';

const VERT = /* glsl */`
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
uniform float uTime;
uniform float uFlicker;
void main() {
  vUv = uv;
  vec3 p = position;
  float h = uv.y;
  float w = sin(uTime * 13.0 + h * 9.0) * 0.12 + sin(uTime * 7.3 + h * 4.0) * 0.08;
  p.x += w * h * h * uFlicker * 0.012;
  p.z += cos(uTime * 11.0 + h * 6.0) * h * h * uFlicker * 0.006;
  p.y *= 1.0 + sin(uTime * 17.0) * 0.04 * uFlicker;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
varying vec2 vUv;
varying vec3 vN;
varying vec3 vV;
uniform vec3 uColor;
uniform vec3 uTip;
uniform float uIntensity;
void main() {
  float edge = pow(abs(dot(vN, vV)), 1.6);
  float h = vUv.y;
  float a = edge * (1.0 - smoothstep(0.55, 1.0, h)) * smoothstep(0.0, 0.08, h);
  vec3 c = mix(uColor, uTip, smoothstep(0.2, 0.9, h));
  // oldindan ko'paytirilgan alfa: qorong'i fonda nur sochadi, yorug' fonda ham rangi ko'rinadi
  gl_FragColor = vec4(c * a * uIntensity, clamp(a * 0.75, 0.0, 1.0));
}`;

function flameGeometry(r, h) {
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const x = r * Math.sin(Math.min(t * 1.25, 1) * Math.PI * 0.5) * Math.pow(1 - t, 0.85) + r * 0.25 * (1 - t);
    pts.push(new THREE.Vector2(Math.max(x, 0.0001), t * h));
  }
  pts[pts.length - 1].x = 0.0001;
  return new THREE.LatheGeometry(pts, 20);
}

function flameMaterial(color, tip, intensity = 1) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { uTime: { value: 0 }, uFlicker: { value: 1 }, uColor: { value: new THREE.Color(color) }, uTip: { value: new THREE.Color(tip) }, uIntensity: { value: intensity } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
  });
}

export const FLAME_KINDS = {
  bunzen: { outer: [0x3b6cff, 0x8a5cff], inner: [0x55d0ff, 0x2a6dff], r: 0.0075, h: 0.055, light: 0x6c8cff, li: 0.15 },
  spirtovka: { outer: [0xffa21a, 0xff5a08], inner: [0x3c7bff, 0xffb347], r: 0.006, h: 0.045, light: 0xffa040, li: 0.35 },
  chop: { outer: [0xffb020, 0xff5a00], inner: [0xfff0a0, 0xffa020], r: 0.003, h: 0.018, light: 0xffa040, li: 0.3 },
  reaksiya: { outer: [0xffb020, 0xff5a00], inner: [0xfff6c0, 0xffa020], r: 0.009, h: 0.05, light: 0xffa040, li: 1.2 },
};

export class Flame {
  /**
   * @param {keyof FLAME_KINDS} kind
   * @param {boolean} withLight
   */
  constructor(kind = 'bunzen', withLight = true) {
    const k = FLAME_KINDS[kind] || FLAME_KINDS.bunzen;
    this.kind = kind;
    this.group = new THREE.Group();
    this.outerMat = flameMaterial(k.outer[0], k.outer[1], 0.9);
    this.innerMat = flameMaterial(k.inner[0], k.inner[1], 1.1);
    this.outer = new THREE.Mesh(flameGeometry(k.r, k.h), this.outerMat);
    this.inner = new THREE.Mesh(flameGeometry(k.r * 0.55, k.h * 0.42), this.innerMat);
    this.outer.renderOrder = 6; this.inner.renderOrder = 7;
    this.group.add(this.outer, this.inner);
    this.baseOuter = this.outerMat.uniforms.uColor.value.clone();
    this.baseTip = this.outerMat.uniforms.uTip.value.clone();
    this.tint = null;
    this.tintT = 0;
    if (withLight) {
      this.light = new THREE.PointLight(k.light, k.li, 0.8, 2);
      this.light.position.y = k.h * 0.5;
      this.group.add(this.light);
      this.baseLight = new THREE.Color(k.light);
      this.baseLi = k.li;
    }
    this.height = k.h;
  }

  /** Alanga rangini vaqtincha bo'yash (alanga sinovi) */
  setTint(hex, seconds = 4) {
    this.tint = new THREE.Color(hex);
    this.tintT = seconds;
  }

  setScale(s) { this.group.scale.setScalar(s); }

  update(dt, time) {
    for (const m of [this.outerMat, this.innerMat]) m.uniforms.uTime.value = time + this.group.id;
    if (this.tintT > 0) {
      this.tintT -= dt;
      const k = Math.min(1, this.tintT / 0.6);
      this.outerMat.uniforms.uColor.value.copy(this.baseOuter).lerp(this.tint, 0.92 * k);
      this.outerMat.uniforms.uTip.value.copy(this.baseTip).lerp(this.tint, 0.85 * k);
      this.outerMat.uniforms.uIntensity.value = 0.9 + 0.8 * k;
      if (this.light) { this.light.color.copy(this.baseLight).lerp(this.tint, k); this.light.intensity = this.baseLi * (1 + k); }
    } else if (this.tint) {
      this.tint = null;
      this.outerMat.uniforms.uColor.value.copy(this.baseOuter);
      this.outerMat.uniforms.uTip.value.copy(this.baseTip);
      this.outerMat.uniforms.uIntensity.value = 0.9;
      if (this.light) { this.light.color.copy(this.baseLight); }
    }
    if (this.light) this.light.intensity = (this.tintT > 0 ? this.light.intensity : this.baseLi) * (0.9 + Math.sin(time * 23 + this.group.id) * 0.06 + Math.sin(time * 9) * 0.04);
  }

  dispose() {
    this.group.parent?.remove(this.group);
    this.outer.geometry.dispose(); this.inner.geometry.dispose();
    this.outerMat.dispose(); this.innerMat.dispose();
  }
}
