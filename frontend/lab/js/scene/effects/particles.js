// Zarrachalar tizimi: bitta THREE.Points, oldindan ajratilgan buferlar (pool), har zarrachaga rang, shaffoflik, o'lcham.
// Rejimlar: 'soft' (tutun, bug', gaz), 'bubble' (pufakcha — halqali), 'add' (uchqun, alanga, yorug'lik — qo'shiluvchi).
import * as THREE from 'three';

const VERT = /* glsl */`
attribute vec3 aColor;
attribute float aAlpha;
attribute float aSize;
uniform float uScale;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(aSize * uScale / max(-mv.z, 0.01), 1.0);
}`;

const FRAG = {
  soft: /* glsl */`
varying vec3 vColor; varying float vAlpha;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float a = (1.0 - d); a *= a;
  gl_FragColor = vec4(vColor, vAlpha * a);
}`,
  bubble: /* glsl */`
varying vec3 vColor; varying float vAlpha;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = length(p);
  if (d > 1.0) discard;
  float rim = smoothstep(0.55, 0.95, d) * (1.0 - smoothstep(0.95, 1.0, d));
  float hi = 1.0 - smoothstep(0.0, 0.28, length(p - vec2(-0.35, 0.35)));
  float a = rim * 0.85 + hi * 0.9 + 0.08;
  gl_FragColor = vec4(mix(vColor, vec3(1.0), hi), vAlpha * a);
}`,
  add: /* glsl */`
varying vec3 vColor; varying float vAlpha;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float a = exp(-d * 3.5);
  gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
}`,
};

export class ParticlePool {
  /**
   * @param {THREE.Object3D} parent
   * @param {'soft'|'bubble'|'add'} mode
   * @param {number} max
   */
  constructor(parent, mode, max = 2000) {
    this.max = max;
    this.n = 0;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.alpha = new Float32Array(max);
    this.a0 = new Float32Array(max);
    this.size = new Float32Array(max);
    this.grow = new Float32Array(max);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.gravity = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.ceil = new Float32Array(max); // dunyo y — shundan yuqorida o'ladi (pufakcha suyuqlik sathida)
    this.floor = new Float32Array(max);
    this.fadeIn = new Float32Array(max);
    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.colAttr = new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage);
    this.alphaAttr = new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr = new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.posAttr);
    geo.setAttribute('aColor', this.colAttr);
    geo.setAttribute('aAlpha', this.alphaAttr);
    geo.setAttribute('aSize', this.sizeAttr);
    geo.setDrawRange(0, 0);
    this.uniforms = { uScale: { value: 600 } };
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG[mode], uniforms: this.uniforms,
      transparent: true, depthWrite: false,
      blending: mode === 'add' ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = mode === 'bubble' ? 2 : 5;
    parent.add(this.points);
  }

  /**
   * @param {{p:THREE.Vector3, v?:number[], color?:THREE.Color|number[], alpha?:number, size?:number, grow?:number,
   *          life?:number, gravity?:number, drag?:number, ceil?:number, floor?:number, fadeIn?:number}} o size — metrda
   */
  spawn(o) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.pos[i * 3] = o.p.x; this.pos[i * 3 + 1] = o.p.y; this.pos[i * 3 + 2] = o.p.z;
    const v = o.v || [0, 0, 0];
    this.vel[i * 3] = v[0]; this.vel[i * 3 + 1] = v[1]; this.vel[i * 3 + 2] = v[2];
    const c = o.color;
    if (Array.isArray(c)) { this.col[i * 3] = c[0]; this.col[i * 3 + 1] = c[1]; this.col[i * 3 + 2] = c[2]; } else if (c) { this.col[i * 3] = c.r; this.col[i * 3 + 1] = c.g; this.col[i * 3 + 2] = c.b; } else { this.col[i * 3] = 1; this.col[i * 3 + 1] = 1; this.col[i * 3 + 2] = 1; }
    this.a0[i] = o.alpha ?? 1;
    this.size[i] = o.size ?? 0.002;
    this.grow[i] = o.grow ?? 0;
    this.life[i] = 0;
    this.maxLife[i] = o.life ?? 2;
    this.gravity[i] = o.gravity ?? 0;
    this.drag[i] = o.drag ?? 0;
    this.ceil[i] = o.ceil ?? 1e9;
    this.floor[i] = o.floor ?? -1e9;
    this.fadeIn[i] = o.fadeIn ?? 0.1;
  }

  #kill(i) {
    const j = --this.n;
    if (i === j) return;
    for (const arr of [this.pos, this.vel, this.col]) { arr[i * 3] = arr[j * 3]; arr[i * 3 + 1] = arr[j * 3 + 1]; arr[i * 3 + 2] = arr[j * 3 + 2]; }
    for (const arr of [this.a0, this.size, this.grow, this.life, this.maxLife, this.gravity, this.drag, this.ceil, this.floor, this.fadeIn]) arr[i] = arr[j];
  }

  update(dt, scale, time) {
    this.uniforms.uScale.value = scale;
    const al = this.alphaAttr.array, sz = this.sizeAttr.array;
    for (let i = 0; i < this.n; i++) {
      this.life[i] += dt;
      const y = this.pos[i * 3 + 1];
      if (this.life[i] >= this.maxLife[i] || y > this.ceil[i]) { this.#kill(i); i--; continue; }
      const k = Math.max(0, 1 - this.drag[i] * dt);
      this.vel[i * 3] *= k; this.vel[i * 3 + 2] *= k;
      this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * k - this.gravity[i] * dt;
      // yengil turbulentlik (tutun)
      if (this.drag[i] > 0.5) {
        this.vel[i * 3] += Math.sin(time * 2.3 + i * 1.7) * 0.004 * dt;
        this.vel[i * 3 + 2] += Math.cos(time * 1.9 + i * 2.1) * 0.004 * dt;
      }
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      if (this.pos[i * 3 + 1] < this.floor[i]) { this.pos[i * 3 + 1] = this.floor[i]; this.vel[i * 3 + 1] *= -0.2; this.vel[i * 3] *= 0.5; this.vel[i * 3 + 2] *= 0.5; }
      const t = this.life[i] / this.maxLife[i];
      const fin = Math.min(1, this.life[i] / Math.max(this.fadeIn[i], 1e-3));
      al[i] = this.a0[i] * fin * (1 - t * t);
      sz[i] = this.size[i] * (1 + this.grow[i] * t);
    }
    this.points.geometry.setDrawRange(0, this.n);
    this.posAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
    this.alphaAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
  }

  clear() { this.n = 0; }
}
