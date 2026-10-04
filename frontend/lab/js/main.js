// Kirish nuqtasi (vaqtinchalik: sahna skeleti sinovi)
import * as THREE from 'three';
import { LabScene } from './scene/app.js';
import { pickQuality, QUALITY } from './scene/quality.js';
import { buildLatheVessel } from './scene/models/glassware.js';
import { LiquidBody } from './scene/liquid.js';
import { BENCH } from './scene/room.js';

const params = new URLSearchParams(location.search);
const q = QUALITY[params.get('q')] || pickQuality();
const lab = new LabScene(document.getElementById('stage'), q);
window.__lab = lab;

const beaker = buildLatheVessel('stakan', { R: 34, H: 95, wall: 1.4 }, { graduated: true });
beaker.group.position.set(-0.08, BENCH.y, BENCH.zc + 0.05);
lab.world.add(beaker.group);
const liq = new LiquidBody(beaker.inner, beaker.rimY, beaker.group, lab.world);
liq.volume_mL = 150;
liq.setAppearance({ rgb: [0.29, 0.64, 0.86], intensity: 0.45 });

const flask = buildLatheVessel('erlenmeyer', { R: 42, H: 140, neckR: 14, neckH: 30, wall: 1.4 }, { graduated: true });
flask.group.position.set(0.12, BENCH.y, BENCH.zc + 0.02);
flask.group.rotation.z = Number(params.get('tilt') || 0);
lab.world.add(flask.group);
const liq2 = new LiquidBody(flask.inner, flask.rimY, flask.group, lab.world);
liq2.volume_mL = 120;
liq2.setAppearance({ rgb: [0.95, 0.75, 0.85], intensity: 0.2 });

const tube = buildLatheVessel('probirka', { R: 8, H: 150, wall: 0.8 });
tube.group.position.set(0.0, BENCH.y, BENCH.zc + 0.12);
lab.world.add(tube.group);
const liq3 = new LiquidBody(tube.inner, tube.rimY, tube.group, lab.world);
liq3.volume_mL = 8;
liq3.setAppearance({ rgb: [0.55, 0.1, 0.55], intensity: 0.8 });

lab.camera.position.set(0.05, BENCH.y + 0.32, BENCH.zc + 0.55);
lab.controls.target.set(0.02, BENCH.y + 0.06, BENCH.zc + 0.05);
lab.onFrame.push(() => { liq.update(); liq2.update(); liq3.update(); });
if (params.get('gallery')) { for (const o of [beaker.group, flask.group, tube.group]) o.visible = false; const { gallery } = await import('./dev/gallery.js'); await gallery(lab, params.get('cat')); }
lab.start();
document.getElementById('boot').classList.add('hidden');
window.__ready = true;
