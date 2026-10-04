// Kirish nuqtasi: WebGL tekshiruvi, sifat darajasi, ma'lumotlarni yuklash, sahna, stol, simulyatsiya, effektlar,
// o'zaro ta'sir va interfeysni bog'lash.
import { LabScene } from './scene/app.js';
import { pickQuality, QUALITY, saveQuality } from './scene/quality.js';
import { Chemistry } from './engine/chemistry.js';
import { loadCore, loadReaction } from './data/loader.js';
import { Bench } from './lab/bench.js';
import { Simulation } from './lab/simulation.js';
import { Interaction } from './lab/interaction.js';
import { Effects } from './scene/effects/index.js';
import { LabUI } from './ui/app.js';
import { api } from './platform/api.js';
import { t } from './i18n/uz.js';

const bootText = document.getElementById('boot-text');
const boot = document.getElementById('boot');
const say = (s) => { if (bootText) bootText.textContent = s; };

function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

async function main() {
  if (!webglOk()) { say(t('app.webglMissing')); boot.classList.add('error'); return; }
  const params = new URLSearchParams(location.search);
  const q = QUALITY[params.get('q')] || pickQuality();
  say(t('app.loadingData'));
  const core = await loadCore((f) => say(`${t('app.loadingData')} ${Math.round(f * 100)}%`));
  const scene = new LabScene(document.getElementById('stage'), q);
  const chem = new Chemistry(core.db);
  const bench = new Bench({ scene, db: core.db, chem, equipment: core.equipment, ports: core.ports });
  const effects = new Effects({ scene, bench, chem });
  const sim = new Simulation({ bench, chem, effects, scene });
  scene.onFrame.unshift((dt, raw) => sim.update(raw));
  const ix = new Interaction({ scene, bench, chem, sim, effects });
  const ctx = {
    scene, bench, chem, db: core.db, sim, ix, effects, api,
    catalog: core.catalog, equipment: core.equipment, templates: core.templates, mechanisms: core.mechanisms,
    loadReaction: (id) => loadReaction(core.catalog, id),
  };
  const ui = new LabUI(document.getElementById('ui'), ctx);
  window.__lab = { ...ctx, ui };

  // kamera: stolning o'rta qismi
  scene.camera.position.set(0.08, 1.46, 0.3);
  scene.controls.target.set(0.0, 0.97, -0.92);
  scene.controls.update();

  if (params.get('gallery')) {
    const { gallery } = await import('./dev/gallery.js');
    await gallery(scene, params.get('cat'));
  } else if (params.get('exp')) {
    ui.setModeSilently('guided');
    await ui.guided.start(params.get('exp'));
  } else if (!params.get('empty')) {
    // boshlang'ich stol: probirkalar shtativi yonida bir nechta idish
    bench.add('probirka', { x: -0.12, z: -0.85 });
    bench.add('probirka', { x: -0.08, z: -0.85 });
    bench.add('kimyoviy-stakan', { sizeId: '100', x: 0.04, z: -0.86 });
    bench.add('spirt-lampasi', { x: 0.18, z: -0.84 });
  }
  scene.start();
  boot.classList.add('hidden');
  window.__ready = true;

  // juda past kadr tezligida sifatni pasaytirishni taklif qilish
  setTimeout(() => {
    if (scene.fps.fps < 22 && q.id !== 'past') {
      ui.toast('warn', `Kadr tezligi past (${scene.fps.fps.toFixed(0)} FPS). Grafika sifatini pasaytirish tavsiya etiladi.`, { action: { label: 'Past sifat', fn: () => { saveQuality('past'); location.reload(); } }, long: true });
    }
  }, 8000);
}

main().catch((e) => {
  console.error(e);
  say(`${t('app.error')}: ${e.message}`);
  boot?.classList.add('error');
});
