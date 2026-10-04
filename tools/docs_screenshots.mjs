// docs/screenshots/ uchun skrinshotlar (SwiftShader dasturiy render). Server: python3 -m http.server 8765 -d frontend/lab
//   NODE_PATH=$(npm root) node tools/docs_screenshots.mjs [faqat-nom-qismi]
import { chromium } from 'playwright';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'screenshots');
const PORT = process.env.PORT || 8765;
const only = process.argv[2] || '';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function shot(name, url, fn, { w = 1280, h = 800, wait = 2500, colorScheme = 'light' } = {}) {
  if (only && !(only.startsWith('>') ? name > only.slice(1) : name.includes(only))) return;
  const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme });
  page.on('pageerror', (e) => console.log(`[${name}] pageerror: ${e.message}`));
  await page.goto(`http://127.0.0.1:${PORT}${url}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  if (fn) await fn(page);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log('ok', name);
  await page.close();
}

const cam = (page, t, c) => page.evaluate(([t, c]) => { const L = window.__lab; L.scene.controls.target.set(...t); L.scene.camera.position.set(...c); L.scene.controls.update(); }, [t, c]);
const proj = (page, id, port = null, dy = 0) => page.evaluate(([id, port, dy]) => {
  const L = window.__lab; const it = L.bench.items.get(id);
  const p = port ? L.bench.portPose(it, port).pos : it.group.getWorldPosition(new (it.group.position.constructor)());
  p.y += dy; p.project(L.scene.camera); const r = L.scene.renderer.domElement.getBoundingClientRect();
  return { x: (p.x * 0.5 + 0.5) * r.width + r.left, y: (-p.y * 0.5 + 0.5) * r.height + r.top };
}, [id, port, dy]);

// 1. umumiy ko'rinish: stol, javon, shkaf, rakovina, mo'rili shkaf
await shot('01-umumiy-korinish', '/index.html?q=orta', async (page) => {
  await cam(page, [0.0, 1.0, -0.95], [0.25, 1.75, 0.95]);
});

// 2. reaksiyalar: cho'kma, rangli gaz, pufakchalar
await shot('02-reaksiyalar-effektlar', '/index.html?q=orta&empty=1', async (page) => {
  await page.evaluate(() => {
    const L = window.__lab;
    const add = (def, x, z, reagent, sizeId) => L.bench.add(def, { x, z, reagent, sizeId });
    const cuso4 = add('tomizgichli-sklyanka', -0.32, -1.02, { id: 'CuSO4', conc_M: 0.5, as: 'solution', volume_mL: 100 });
    const naoh = add('tomizgichli-sklyanka', -0.24, -1.02, { id: 'NaOH', conc_M: 1, as: 'solution', volume_mL: 100 });
    const fecl3 = add('tomizgichli-sklyanka', -0.16, -1.02, { id: 'FeCl3', conc_M: 0.5, as: 'solution', volume_mL: 100 });
    const hno3 = add('tomizgichli-sklyanka', 0.12, -1.02, { id: 'HNO3', conc_M: 15.8, as: 'solution', volume_mL: 100 });
    const cu = add('reaktiv-sklyankasi', 0.2, -1.02, { id: 'Cu', as: 'solid', mass_g: 20, form: 'qirindi' });
    const hcl = add('tomizgichli-sklyanka', 0.28, -1.02, { id: 'HCl', conc_M: 2, as: 'solution', volume_mL: 100 });
    const zn = add('reaktiv-sklyankasi', 0.36, -1.02, { id: 'Zn', as: 'solid', mass_g: 20, form: 'granula' });
    const t1 = add('probirka', -0.2, -0.86); const t2 = add('probirka', -0.15, -0.86);
    const f = add('konussimon-kolba', 0.0, -0.86, null, '250');
    const b = add('kimyoviy-stakan', 0.16, -0.84, null, '100');
    L.ix.dose(cuso4, t1, 'pipette', 4); L.ix.dose(naoh, t1, 'pipette', 3);
    L.ix.dose(fecl3, t2, 'pipette', 4); L.ix.dose(naoh, t2, 'pipette', 4);
    L.ix.dose(hno3, f, 'pipette', 10); L.ix.dose(cu, f, 'spatula', 1);
    L.ix.dose(hcl, b, 'pipette', 40); L.ix.dose(zn, b, 'spatula', 3);
  });
  await cam(page, [-0.02, 0.97, -0.88], [-0.02, 1.13, -0.5]);
}, { wait: 5000 });

// 3. yo'riqnomali tajriba
await shot('03-yoriqnomali-tajriba', '/index.html?q=orta&exp=chokma-0002', async (page) => {
  await page.waitForTimeout(500);
  for (const box of await page.$$('.modal input[type=checkbox]')) await box.check();
  await page.click('.modal .btn.primary');
  await page.click('.guided .btn.primary');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const L = window.__lab;
    const items = [...L.bench.items.values()];
    const main = items.find((i) => i.vessel && !i.vessel.isReagentBottle);
    for (const b of items.filter((i) => i.vessel?.isReagentBottle)) L.ix.dose(b, main, 'pipette', 2.5);
    L.ix.select(main);
  });
  await page.waitForSelector('.guided .result', { timeout: 60000 });
  await cam(page, [0.0, 0.97, -0.86], [-0.05, 1.08, -0.6]);
}, { wait: 1500 });

// 4. alanga sinovi va magniy yonishi
await shot('04-alanga-sinovi', '/index.html?q=orta&empty=1', async (page) => {
  await page.evaluate(() => {
    const L = window.__lab;
    const mk = (id, x) => { const b = L.bench.add('tomizgichli-sklyanka', { x, z: -1.0, reagent: { id, conc_M: 0.5, as: 'solution', volume_mL: 100 } }); const t = L.bench.add('probirka', { x, z: -0.9 }); L.ix.dose(b, t, 'pipette', 3); return t; };
    const tSr = mk('SrCl2', -0.2); mk('NaCl', -0.12); mk('KCl', -0.04);
    const burner = L.bench.add('bunzen-gorelkasi', { x: 0.08, z: -0.86 });
    L.ix.toggleHeater(burner);
    L.ix.flameTest(tSr);
  });
  await cam(page, [0.0, 1.03, -0.9], [0.02, 1.1, -0.55]);
}, { wait: 1200 });

// 5. tayyor asbob: oddiy haydash
await shot('05-haydash-asbobi', '/index.html?q=orta&empty=1', async (page) => {
  await page.evaluate(async () => {
    const L = window.__lab;
    const mod = await import('./js/lab/templates.js');
    mod.assembleTemplate(L.bench, L.templates.find((t) => t.id === 'oddiy-haydash'), { anchor: { x: -0.15, z: -0.9 } });
  });
  await cam(page, [0.05, 1.05, -0.9], [0.15, 1.28, -0.2]);
});

// 6. sudrab ulash: yarim shaffof oldindan ko'rinish
await shot('06-ulash-oldindan-korinish', '/index.html?q=orta&empty=1', async (page) => {
  const ids = await page.evaluate(() => {
    const L = window.__lab;
    return { f: L.bench.add('konussimon-kolba', { sizeId: '250', x: 0, z: -0.88 }).id, st: L.bench.add('rezina-tiqin-1-teshikli-orta', { x: 0.15, z: -0.8 }).id };
  });
  await cam(page, [0.05, 0.98, -0.85], [0.05, 1.2, -0.45]);
  await page.waitForTimeout(400);
  const a = await proj(page, ids.st), b = await proj(page, ids.f, 'ogiz');
  await page.mouse.move(a.x, a.y - 4); await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(a.x + (b.x - a.x) * i / 12 + 30, a.y - 4 + (b.y - a.y + 4) * i / 12);
}, { wait: 800 });

// 7. quyish
await shot('07-quyish', '/index.html?q=orta&empty=1', async (page) => {
  const ids = await page.evaluate(() => {
    const L = window.__lab;
    const src = L.bench.add('tomizgichli-sklyanka', { x: -0.1, z: -0.9, reagent: { id: 'KMnO4', conc_M: 0.02, as: 'solution', volume_mL: 100 } });
    const dst = L.bench.add('kimyoviy-stakan', { sizeId: '250', x: 0.05, z: -0.85 });
    return { src: src.id, dst: dst.id };
  });
  await cam(page, [0.02, 1.0, -0.86], [0.02, 1.14, -0.5]);
  await page.evaluate(({ src, dst }) => {
    const L = window.__lab;
    const s = L.bench.items.get(src), d = L.bench.items.get(dst);
    L.ix.startPour(s, d);
    L.ix.setPourAngle(105);
    const r = document.querySelector('.pourbar input[type=range]');
    if (r) { r.value = '105'; r.dispatchEvent(new Event('input')); }
  }, ids);
}, { wait: 3500 });

// 8. katalog
await shot('08-katalog', '/index.html?q=past', async (page) => {
  await page.getByRole('button', { name: 'Tajribalar' }).click();
  await page.locator('.drawer select').first().selectOption('oksidlanish-qaytarilish');
}, { wait: 800 });

// 9. reaktivlar javoni (qorong'i mavzu)
await shot('09-reaktivlar-qorongi', '/index.html?q=past', async (page) => {
  await page.evaluate(() => { const ui = window.__lab.ui; ui.prefs.theme = 'dark'; ui.applyPrefs(); });
  await page.getByRole('button', { name: 'Reaktivlar' }).click();
  await page.locator('.drawer input[type=search]').fill('kaliy');
}, { wait: 800 });

// 10. mexanizm paneli (organik)
await shot('10-mexanizm-paneli', '/index.html?q=past&empty=1', async (page) => {
  await page.evaluate(() => window.__lab.ui.openMechanismById('uglevod-0001'));
  await page.waitForSelector('.modal');
}, { wait: 2500 });

// 11. jurnal
await shot('11-laboratoriya-jurnali', '/index.html?q=past&empty=1', async (page) => {
  await page.evaluate(() => {
    const L = window.__lab;
    const b1 = L.bench.add('tomizgichli-sklyanka', { reagent: { id: 'BaCl2', conc_M: 0.5, as: 'solution', volume_mL: 100 } });
    const b2 = L.bench.add('tomizgichli-sklyanka', { reagent: { id: 'Na2SO4', conc_M: 0.5, as: 'solution', volume_mL: 100 } });
    const t = L.bench.add('probirka');
    L.ix.dose(b1, t, 'pipette', 2); L.ix.dose(b2, t, 'pipette', 2);
    L.ix.indicatorPaper(t);
  });
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Jurnal' }).click();
}, { wait: 600 });

// 12. telefon
await shot('12-telefon', '/index.html?q=past', async (page) => {
  await page.evaluate(() => { const L = window.__lab; L.ix.select([...L.bench.items.values()][2]); });
}, { w: 390, h: 800, wait: 1200 });

await browser.close();
