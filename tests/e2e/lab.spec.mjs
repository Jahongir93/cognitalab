// Asosiy foydalanuvchi ssenariylari: yuklanish, erkin rejimda reaksiya, quyish, sudrab ulash,
// yo'riqnomali tajriba, jurnal, saqlash/tiklash, andoza yig'ish, mobil ko'rinish.
import { test, expect } from '@playwright/test';

const ready = (page) => page.waitForFunction(() => window.__ready === true, null, { timeout: 120_000 });
const errors = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
});
test.afterEach(() => { expect(errors, errors.join('\n')).toEqual([]); });

/** 3D nuqtaning ekran koordinatasi */
async function screenOf(page, itemId, port = null, dy = 0) {
  return page.evaluate(([id, port, dy]) => {
    const L = window.__lab; const it = L.bench.items.get(id);
    const p = port ? L.bench.portPose(it, port).pos : it.group.getWorldPosition(new (it.group.position.constructor)());
    p.y += dy;
    p.project(L.scene.camera);
    const r = L.scene.renderer.domElement.getBoundingClientRect();
    return { x: (p.x * 0.5 + 0.5) * r.width + r.left, y: (-p.y * 0.5 + 0.5) * r.height + r.top };
  }, [itemId, port, dy]);
}

test('laboratoriya yuklanadi: sahna, asboblar paneli, katalog', async ({ page }) => {
  await page.goto('/index.html?q=past');
  await ready(page);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('.toolbar')).toBeVisible();
  await page.getByRole('button', { name: 'Tajribalar' }).click();
  await expect(page.locator('.drawer')).toBeVisible();
  const n = await page.locator('.cat-item').count();
  expect(n).toBeGreaterThan(100);
  await page.locator('.drawer input[type=search]').fill('bariy');
  await expect(page.locator('.cat-item').first()).toContainText(/[Bb]ariy/);
});

test('erkin rejim: reaktivlar javonidan olib, pipetka bilan aralashtirish — cho\'kma', async ({ page }) => {
  await page.goto('/index.html?q=past&empty=1');
  await ready(page);
  await page.getByRole('button', { name: 'Reaktivlar' }).click();
  await page.locator('.drawer input[type=search]').fill('bariy xlorid');
  await page.locator('.reagent').first().getByRole('button', { name: /Eritma/ }).first().click();
  await page.locator('.drawer input[type=search]').fill('natriy sulfat');
  await page.locator('.reagent', { hasText: 'natriy sulfat' }).first().getByRole('button', { name: /Eritma/ }).first().click();
  const res = await page.evaluate(() => {
    const L = window.__lab;
    const items = [...L.bench.items.values()];
    const bottles = items.filter((i) => i.vessel?.isReagentBottle);
    const tube = L.bench.add('probirka');
    for (const b of bottles) L.ix.dose(b, tube, 'pipette', 2);
    return { tube: tube.id, n: bottles.length };
  });
  expect(res.n).toBe(2);
  await expect.poll(() => page.evaluate((id) => window.__lab.chem.get(window.__lab.bench.items.get(id).vessel, 'BaSO4', 's'), res.tube), { timeout: 30_000 }).toBeGreaterThan(1e-5);
  await expect(page.locator('.toast').filter({ hasText: /cho'kmasi tushdi/ }).first()).toBeVisible();
});

test('quyish: og\'ish burchagi bilan suyuqlik nishon idishga o\'tadi', async ({ page }) => {
  await page.goto('/index.html?q=past&empty=1');
  await ready(page);
  const ids = await page.evaluate(() => {
    const L = window.__lab;
    const src = L.bench.add('kimyoviy-stakan', { sizeId: '100', x: -0.1, z: -0.85 });
    L.chem.addSubstance(src.vessel, 'H2O', { as: 'liquid', volume_mL: 60 });
    const dst = L.bench.add('kimyoviy-stakan', { sizeId: '250', x: 0.08, z: -0.85 });
    L.scene.controls.target.set(0, 0.97, -0.85); L.scene.camera.position.set(0, 1.2, -0.4); L.scene.controls.update();
    L.ix.select(src);
    return { src: src.id, dst: dst.id };
  });
  await page.locator('.inspector').getByRole('button', { name: 'Quyish' }).click();
  await expect(page.locator('.banner')).toBeVisible();
  const p = await screenOf(page, ids.dst, null, 0.03);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('.pourbar')).toBeVisible();
  await page.locator('.pourbar input[type=range]').fill('110');
  await expect.poll(() => page.evaluate((id) => window.__lab.chem.liquidVolume(window.__lab.bench.items.get(id).vessel), ids.dst), { timeout: 60_000 }).toBeGreaterThan(5);
  await page.locator('.pourbar').getByRole('button', { name: 'Bajarildi' }).click();
  await expect(page.locator('.pourbar')).toBeHidden();
});

test('sudrab ulash: tiqin kolba og\'ziga "yopishadi"', async ({ page }) => {
  await page.goto('/index.html?q=past&empty=1');
  await ready(page);
  const ids = await page.evaluate(() => {
    const L = window.__lab;
    const f = L.bench.add('konussimon-kolba', { sizeId: '250', x: 0, z: -0.88 });
    const st = L.bench.add('rezina-tiqin-1-teshikli-orta', { x: 0.15, z: -0.8 });
    L.scene.controls.target.set(0.05, 0.98, -0.85); L.scene.camera.position.set(0.05, 1.2, -0.45); L.scene.controls.update();
    return { f: f.id, st: st.id };
  });
  await page.waitForTimeout(300);
  const a = await screenOf(page, ids.st);
  const b = await screenOf(page, ids.f, 'ogiz');
  await page.mouse.move(a.x, a.y - 4);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(a.x + (b.x - a.x) * i / 10, a.y - 4 + (b.y - a.y + 4) * i / 10);
  await page.mouse.up();
  const con = await page.evaluate((id) => window.__lab.bench.graph.connectionsOf(id).map((c) => c.other.node), ids.f);
  expect(con).toContain(ids.st);
});

test("yo'riqnomali tajriba: tayyorlash, bosqichlar, natija", async ({ page }) => {
  await page.goto('/index.html?q=past&exp=chokma-0001');
  await ready(page);
  for (const box of await page.locator('.modal input[type=checkbox]').all()) await box.check();
  await page.locator('.modal .btn.primary').click();
  await page.getByRole('button', { name: "Jihoz va reaktivlarni stolga qo'yish" }).click();
  await page.evaluate(() => {
    const L = window.__lab;
    const items = [...L.bench.items.values()];
    const main = items.find((i) => i.vessel && !i.vessel.isReagentBottle);
    for (const b of items.filter((i) => i.vessel?.isReagentBottle)) L.ix.dose(b, main, 'pipette', 2);
  });
  await expect(page.locator('.guided .result')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.guided .steps li.done')).toHaveCount(3);
  await page.getByRole('button', { name: 'Mexanizm' }).click();
  await expect(page.locator('.modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Jurnal' }).click();
  await expect(page.locator('.journal-list li').first()).toBeVisible();
  await expect(page.locator('.journal-list')).toContainText('Tajriba yakunlandi');
});

test('reaksiya bormasa sababi tushuntiriladi (Cu + suyult. H2SO4)', async ({ page }) => {
  await page.goto('/index.html?q=past&empty=1');
  await ready(page);
  await page.evaluate(() => {
    const L = window.__lab;
    const cu = L.bench.add('reaktiv-sklyankasi', { reagent: { id: 'Cu', as: 'solid', mass_g: 10, form: 'qirindi' } });
    const acid = L.bench.add('tomizgichli-sklyanka', { reagent: { id: 'H2SO4', conc_M: 1, as: 'solution', volume_mL: 100 } });
    const tube = L.bench.add('probirka');
    L.ix.dose(acid, tube, 'pipette', 3);
    L.ix.dose(cu, tube, 'spatula', 0.5);
  });
  await expect(page.locator('.toast').filter({ hasText: 'Reaksiya bormadi' }).first()).toBeVisible({ timeout: 30_000 });
});

test("saqlash va tiklash (localStorage)", async ({ page }) => {
  await page.goto('/index.html?q=past&empty=1');
  await ready(page);
  const before = await page.evaluate(async () => {
    const L = window.__lab;
    const b = L.bench.add('kimyoviy-stakan', { sizeId: '100' });
    L.chem.addSubstance(b.vessel, 'NaCl', { as: 'solution', conc_M: 1, volume_mL: 20 });
    await L.api.saveState('e2e', 'e2e', L.bench.serialize());
    L.bench.clear();
    const st = await L.api.getState('e2e');
    L.ui.loadState(st.state);
    return [...L.bench.items.values()].map((i) => i.def.id);
  });
  expect(before).toContain('kimyoviy-stakan');
  const vol = await page.evaluate(() => { const L = window.__lab; const b = [...L.bench.items.values()].find((i) => i.def.id === 'kimyoviy-stakan'); return L.chem.liquidVolume(b.vessel); });
  expect(vol).toBeGreaterThan(19);
});

test('asbob andozasi avtomatik yig\'iladi (oddiy haydash)', async ({ page }) => {
  await page.goto('/index.html?q=past&empty=1');
  await ready(page);
  await page.getByRole('button', { name: 'Asboblar' }).click();
  await page.locator('.tpl', { hasText: /haydash/i }).first().getByRole('button', { name: "Avtomatik yig'ish" }).click();
  const n = await page.evaluate(() => window.__lab.bench.items.size);
  expect(n).toBeGreaterThan(6);
  const edges = await page.evaluate(() => window.__lab.bench.graph.edges.length);
  expect(edges).toBeGreaterThan(5);
});

test('telefon o\'lchamida interfeys sig\'adi', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto('/index.html?q=past');
  await ready(page);
  await expect(page.locator('.toolbar')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  await page.getByRole('button', { name: 'Reaktivlar' }).click();
  const box = await page.locator('.drawer').boundingBox();
  expect(box.width).toBeLessThanOrEqual(390);
});
