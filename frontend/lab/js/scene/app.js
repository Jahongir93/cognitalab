// 3D sahna: renderer, kamera, boshqaruv, yoritish, atrof-muhit xaritasi va render sikli.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildRoom, BENCH } from './room.js';
import * as M from './materials.js';
import { FpsMonitor } from './quality.js';

export class LabScene {
  /**
   * @param {HTMLElement} container
   * @param {object} quality QUALITY darajasi
   */
  constructor(container, quality) {
    this.container = container;
    this.quality = quality;
    M.setQuality(quality);
    const renderer = new THREE.WebGLRenderer({ antialias: quality.antialias, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = quality.shadows;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Laboratoriya sahnasi');
    renderer.domElement.style.touchAction = 'none';
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd9dee5);
    this.scene = scene;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.85;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 30);
    camera.position.set(0.05, 1.42, 0.05);
    this.camera = camera;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, BENCH.y + 0.08, BENCH.zc);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.18;
    controls.maxDistance = 2.6;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minPolarAngle = 0.15;
    controls.screenSpacePanning = true;
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    controls.update();
    this.controls = controls;

    // yorug'lik
    const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa3ad, 0.55);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff6ea, 1.6);
    sun.position.set(-1.6, 3.2, 1.2);
    sun.castShadow = quality.shadows;
    sun.shadow.mapSize.set(quality.id === 'yuqori' ? 2048 : 1024, quality.id === 'yuqori' ? 2048 : 1024);
    sun.shadow.camera.left = -1.6; sun.shadow.camera.right = 1.6; sun.shadow.camera.top = 1.4; sun.shadow.camera.bottom = -1.4;
    sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 7;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.01;
    sun.target.position.set(0, BENCH.y, BENCH.zc);
    scene.add(sun, sun.target);
    if (quality.maxLights > 1) {
      const fill = new THREE.PointLight(0xe8f0ff, 0.6, 4, 2);
      fill.position.set(0.8, 1.9, 0.2);
      scene.add(fill);
    }

    this.roomParts = buildRoom(scene, quality);
    // ish maydoni ildizi (jihozlar shu yerga qo'yiladi)
    this.world = new THREE.Group();
    this.world.name = 'stol';
    scene.add(this.world);

    this.clock = new THREE.Timer();
    this.fps = new FpsMonitor();
    this.onFrame = [];
    this.running = false;
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    new ResizeObserver(this.resize).observe(container);
    this.resize();
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / Math.max(h, 1);
    // tor ekranda (telefon) kamerani biroz uzoqroqqa
    this.camera.fov = this.camera.aspect < 0.8 ? 52 : 38;
    this.camera.updateProjectionMatrix();
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      requestAnimationFrame(loop);
      this.frame();
    };
    loop();
  }
  stop() { this.running = false; }

  frame() {
    this.clock.update();
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.fps.tick();
    this.controls.update();
    for (const f of this.onFrame) f(dt);
    this.renderer.render(this.scene, this.camera);
  }

  /** Kamerani nuqtaga silliq fokuslash */
  focusOn(point, dist = 0.45) {
    const from = this.controls.target.clone();
    const camFrom = this.camera.position.clone();
    const dir = camFrom.clone().sub(from).normalize();
    const to = point.clone();
    const camTo = to.clone().addScaledVector(dir, dist);
    let t = 0;
    const step = (dt) => {
      t = Math.min(t + dt * 2.2, 1);
      const k = t * t * (3 - 2 * t);
      this.controls.target.lerpVectors(from, to, k);
      this.camera.position.lerpVectors(camFrom, camTo, k);
      if (t >= 1) this.onFrame.splice(this.onFrame.indexOf(step), 1);
    };
    this.onFrame.push(step);
  }

  /** Standart ko'rinish */
  resetView() {
    this.focusOn(new THREE.Vector3(0, BENCH.y + 0.08, BENCH.zc), 1.05);
  }
}
