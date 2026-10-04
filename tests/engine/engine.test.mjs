// Dvigatel birlik testlari: stexiometriya, cheklovchi reagent, pH, eruvchanlik, faollik qatori, issiqlik.
// Ishga tushirish: node --test tests/engine/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeChem, run } from './load.mjs';
import { checkBalance, parseFormula, molarMass, prettyFormula } from '../../frontend/lab/js/engine/formula.js';

const chem = makeChem({ withReactions: false });
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} kutilgan ${b}, olingan ${a}`);

test('formula: atomlar, zaryad, molyar massa', () => {
  assert.deepEqual(parseFormula('Ca(OH)2').atoms, { Ca: 1, O: 2, H: 2 });
  assert.equal(parseFormula('SO4²⁻').charge, -2);
  assert.equal(parseFormula('[Fe(CN)6]⁴⁻').charge, -4);
  assert.deepEqual(parseFormula('CuSO4·5H2O').atoms, { Cu: 1, S: 1, O: 9, H: 10 });
  near(molarMass('H2SO4'), 98.07, 0.01);
  near(molarMass('CuSO4·5H2O'), 249.68, 0.02);
  assert.equal(prettyFormula('Al2(SO4)3'), 'Al₂(SO₄)₃');
});

test('tenglama balansi: atomlar va zaryad', () => {
  assert.ok(checkBalance('2KMnO4 + 16HCl = 2KCl + 2MnCl2 + 5Cl2↑ + 8H2O').ok);
  assert.ok(checkBalance('2MnO4⁻ + 5SO3²⁻ + 6H⁺ = 2Mn²⁺ + 5SO4²⁻ + 3H2O').ok);
  assert.ok(!checkBalance('2MnO4⁻ + 5SO3²⁻ + 4H⁺ = 2Mn²⁺ + 5SO4²⁻ + 3H2O').ok);
  assert.ok(checkBalance('n CH2=CH2 → (–CH2–CH2–)n').ok);
  assert.ok(checkBalance('Mn⁺⁷ + 5e⁻ = Mn⁺²').ok);
});

test("cho'kma: BaCl2 + Na2SO4 -> BaSO4 (stexiometriya)", () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'BaCl2', { conc_M: 0.1, volume_mL: 2 });
  chem.addSubstance(v, 'Na2SO4', { conc_M: 0.1, volume_mL: 2 });
  run(chem, v, 1);
  near(chem.get(v, 'BaSO4', 's'), 2e-4, 1e-8);
  near(chem.get(v, 'Ba^2+', 'aq'), 0, 1e-9);
  near(chem.get(v, 'Na^+', 'aq'), 4e-4, 1e-9);
});

test('cheklovchi reagent: ortiqcha BaCl2', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'BaCl2', { conc_M: 0.1, volume_mL: 5 });
  chem.addSubstance(v, 'Na2SO4', { conc_M: 0.1, volume_mL: 2 });
  run(chem, v, 1);
  near(chem.get(v, 'BaSO4', 's'), 2e-4, 1e-8);
  near(chem.get(v, 'Ba^2+', 'aq'), 3e-4, 1e-8);
  near(chem.get(v, 'SO4^2-', 'aq'), 0, 1e-9);
});

test('neytrallanish va pH', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'HCl', { conc_M: 0.1, volume_mL: 5 });
  near(chem.pH(v), 1.0, 0.05);
  chem.addSubstance(v, 'NaOH', { conc_M: 0.1, volume_mL: 5 });
  run(chem, v, 0.5);
  near(chem.pH(v), 7.0, 0.05);
  const w = chem.createVessel();
  chem.addSubstance(w, 'NaOH', { conc_M: 0.01, volume_mL: 5 });
  near(chem.pH(w), 12.0, 0.05);
});

test('kuchsiz kislota va gidroliz pH', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'CH3COOH', { conc_M: 0.1, volume_mL: 5 });
  near(chem.pH(v), 2.88, 0.05, 'sirka kislota 0,1 M');
  const a = chem.createVessel();
  chem.addSubstance(a, 'NH4Cl', { conc_M: 0.1, volume_mL: 5 });
  run(chem, a, 1);
  near(chem.pH(a), 5.13, 0.06, 'NH4Cl 0,1 M');
  const b = chem.createVessel();
  chem.addSubstance(b, 'Na2CO3', { conc_M: 0.1, volume_mL: 5 });
  near(chem.pH(b), 11.66, 0.06, 'Na2CO3 0,1 M');
  const c = chem.createVessel();
  chem.addSubstance(c, 'NaCl', { conc_M: 0.1, volume_mL: 5 });
  near(chem.pH(c), 7.0, 0.05, 'NaCl');
  const buf = chem.createVessel();
  chem.addSubstance(buf, 'CH3COOH', { conc_M: 0.1, volume_mL: 5 });
  chem.addSubstance(buf, 'CH3COONa', { conc_M: 0.1, volume_mL: 5 });
  run(chem, buf, 1);
  near(chem.pH(buf), 4.76, 0.05, 'atsetat bufer');
});

test('nordon tuz: H3PO4 + NaOH (1:1) -> NaH2PO4', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'H3PO4', { conc_M: 0.1, volume_mL: 5 });
  chem.addSubstance(v, 'NaOH', { conc_M: 0.1, volume_mL: 5 });
  run(chem, v, 1);
  near(chem.get(v, 'H2PO4^-', 'aq'), 5e-4, 1e-8);
  assert.ok(chem.pH(v) > 4 && chem.pH(v) < 5.2);
});

test('gaz ajralishi: Na2CO3 + HCl -> CO2', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'Na2CO3', { conc_M: 0.5, volume_mL: 2 });
  chem.addSubstance(v, 'HCl', { conc_M: 2, volume_mL: 1 });
  const ev = run(chem, v, 5);
  const co2 = ev.filter((e) => e.type === 'gas' && e.species === 'CO2').reduce((a, e) => a + e.mol, 0);
  assert.ok(co2 > 0.0008, `CO2: ${co2}`);
});

test("eruvchanlik: KNO3 + NaCl — reaksiya ketmaydi", () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'KNO3', { conc_M: 0.1, volume_mL: 2 });
  chem.addSubstance(v, 'NaCl', { conc_M: 0.1, volume_mL: 2 });
  const ev = run(chem, v, 2);
  assert.equal(ev.filter((e) => e.type === 'precipitate' || e.type === 'gas').length, 0);
});

test('faollik qatori: Fe + CuSO4 -> Cu; Cu + ZnSO4 -> reaksiya yo\'q; Cu + HCl -> yo\'q', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'Fe', { mass_g: 1, form: 'kukun' });
  chem.addSubstance(v, 'CuSO4', { conc_M: 0.5, volume_mL: 2 });
  run(chem, v, 120);
  assert.ok(chem.get(v, 'Cu', 's') > 9e-4, 'mis ajralishi kerak');
  assert.ok(chem.get(v, 'Fe^2+', 'aq') > 9e-4);
  const w = chem.createVessel();
  chem.addSubstance(w, 'Cu', { mass_g: 0.5 });
  chem.addSubstance(w, 'ZnSO4', { conc_M: 0.5, volume_mL: 2 });
  run(chem, w, 60);
  near(chem.get(w, 'Zn', 's'), 0, 1e-12);
  const h = chem.createVessel();
  chem.addSubstance(h, 'Cu', { mass_g: 0.5 });
  chem.addSubstance(h, 'HCl', { conc_M: 2, volume_mL: 3 });
  const ev = run(chem, h, 60);
  assert.equal(ev.filter((e) => e.type === 'gas').length, 0);
});

test('metall + kislota: Zn + HCl -> H2 (stexiometriya, kislota yetishmaydi)', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'Zn', { mass_g: 1, form: 'kukun' });
  chem.addSubstance(v, 'HCl', { conc_M: 1, volume_mL: 2 });
  const ev = run(chem, v, 300);
  const h2 = ev.filter((e) => e.type === 'gas' && e.species === 'H2').reduce((a, e) => a + e.mol, 0);
  near(h2, 0.001, 5e-5, 'H2 = HCl/2');
});

test('faol metall + suv: Na -> NaOH + H2, issiqlik ajraladi', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'H2O', { volume_mL: 5 });
  chem.addSubstance(v, 'Na', { mass_g: 0.046 });
  run(chem, v, 20);
  near(chem.get(v, 'Na^+', 'aq'), 0.002, 1e-5);
  assert.ok(chem.pH(v) > 12);
  assert.ok(v.T > 25, `harorat ko'tarilishi kerak: ${v.T}`);
});

test('amfoterlik: AlCl3 + NaOH (oz) -> Al(OH)3; ortiqcha -> [Al(OH)4]-', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'AlCl3', { conc_M: 0.1, volume_mL: 2 });
  chem.addSubstance(v, 'NaOH', { conc_M: 1, volume_mL: 0.6 });
  run(chem, v, 1);
  near(chem.get(v, 'Al(OH)3', 's'), 2e-4, 1e-8);
  chem.addSubstance(v, 'NaOH', { conc_M: 1, volume_mL: 1 });
  run(chem, v, 1);
  near(chem.get(v, 'Al(OH)3', 's'), 0, 1e-9);
  near(chem.get(v, '[Al(OH)4]^-', 'aq'), 2e-4, 1e-8);
});

test("kompleks: Cu2+ + NH3 (ortiqcha) -> [Cu(NH3)4]2+ to'q ko'k", () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'CuSO4', { conc_M: 0.1, volume_mL: 2 });
  chem.addSubstance(v, 'NH3·H2O', { conc_M: 2, volume_mL: 0.1 });
  run(chem, v, 1);
  assert.ok(chem.get(v, 'Cu(OH)2', 's') > 0, "avval cho'kma");
  chem.addSubstance(v, 'NH3·H2O', { conc_M: 2, volume_mL: 2 });
  run(chem, v, 1);
  near(chem.get(v, '[Cu(NH3)4]^2+', 'aq'), 2e-4, 1e-8);
  const col = chem.color(v);
  assert.ok(col.rgb[2] > col.rgb[0] + 0.3, `ko'k rang: ${col.hex}`);
});

test("kislotada eriydigan va erimaydigan cho'kmalar", () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'CaCO3', { mass_g: 0.1 });
  chem.addSubstance(v, 'HCl', { conc_M: 2, volume_mL: 3 });
  run(chem, v, 30);
  near(chem.get(v, 'CaCO3', 's'), 0, 1e-6);
  const w = chem.createVessel();
  chem.addSubstance(w, 'BaSO4', { mass_g: 0.1 });
  chem.addSubstance(w, 'HCl', { conc_M: 2, volume_mL: 3 });
  run(chem, w, 30);
  near(chem.get(w, 'BaSO4', 's'), 0.1 / 233.39, 1e-6);
  // kalsiy oksalat sirka kislotada erimaydi, xlorid kislotada eriydi
  const x = chem.createVessel();
  chem.addSubstance(x, 'CaC2O4', { mass_g: 0.05 });
  chem.addSubstance(x, 'CH3COOH', { conc_M: 1, volume_mL: 3 });
  run(chem, x, 30);
  near(chem.get(x, 'CaC2O4', 's'), 0.05 / 128.1, 1e-6);
});

test('birgalikdagi gidroliz: AlCl3 + Na2CO3 -> Al(OH)3 + CO2', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'AlCl3', { conc_M: 0.1, volume_mL: 2 });
  chem.addSubstance(v, 'Na2CO3', { conc_M: 0.1, volume_mL: 3 });
  const ev = run(chem, v, 3);
  near(chem.get(v, 'Al(OH)3', 's'), 2e-4, 1e-8);
  assert.ok(ev.some((e) => e.type === 'gas' && e.species === 'CO2'));
});

test('issiqlik: neytrallanish harorati (57 kJ/mol)', () => {
  const v = chem.createVessel({ glass_g: 0 });
  chem.addSubstance(v, 'HCl', { conc_M: 1, volume_mL: 10 });
  chem.addSubstance(v, 'NaOH', { conc_M: 1, volume_mL: 10 });
  run(chem, v, 0.1);
  // 0,01 mol * 57,3 kJ = 573 J; ~20 g eritma * 4,18 -> ~6,8 °C
  near(v.T - 20, 6.6, 1.2);
});

test('suvni konsentrlangan sulfat kislotaga quyish — sachrash ogohlantirishi', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'H2SO4', { conc_M: 18, volume_mL: 2 });
  const ev = chem.addSubstance(v, 'H2O', { volume_mL: 1 });
  assert.ok(ev.some((e) => e.type === 'splash'));
  const w = chem.createVessel();
  chem.addSubstance(w, 'H2O', { volume_mL: 5 });
  const ev2 = chem.addSubstance(w, 'H2SO4', { conc_M: 18, volume_mL: 0.5 });
  assert.ok(!ev2.some((e) => e.type === 'splash'), "kislotani suvga quyish — to'g'ri tartib");
  assert.ok(w.T > 30);
});

test('qaynash va bug\'latish: NaCl eritmasidan kristall', () => {
  const v = chem.createVessel({ capacity_mL: 60 });
  chem.addSubstance(v, 'NaCl', { conc_M: 1, volume_mL: 5 });
  const ev = run(chem, v, 900, { heater: { power_W: 60, maxT: 300 } }, 0.5);
  assert.ok(ev.some((e) => e.type === 'boil'));
  assert.ok(chem.get(v, 'NaCl', 's') > 0.004, 'NaCl kristallari');
});

test('indikator rangi: fenolftalein ishqorda pushti, kislotada rangsiz', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'NaOH', { conc_M: 0.1, volume_mL: 3 });
  chem.addSubstance(v, 'C20H14O4', { conc_M: 0.003, volume_mL: 0.1 });
  const c1 = chem.color(v);
  assert.ok(c1.rgb[1] < 0.7, `pushti: ${c1.hex}`);
  chem.addSubstance(v, 'HCl', { conc_M: 0.1, volume_mL: 4 });
  run(chem, v, 0.5);
  const c2 = chem.color(v);
  assert.ok(c2.intensity < 0.05, `rangsiz: ${c2.hex}`);
});

test('elektroliz: CuCl2 eritmasi (inert elektrodlar) — katodda Cu, anodda Cl2', () => {
  const v = chem.createVessel({ capacity_mL: 50 });
  chem.addSubstance(v, 'CuCl2', { conc_M: 0.5, volume_mL: 20 });
  const ev = run(chem, v, 20, { electrolysis: { current_A: 1, anode: 'C', cathode: 'C', speed: 50 } });
  assert.ok(chem.get(v, 'Cu', 's') > 0);
  assert.ok(ev.some((e) => e.type === 'gas' && e.species === 'Cl2'));
});

test('saqlash/tiklash (serialize)', () => {
  const v = chem.createVessel();
  chem.addSubstance(v, 'CuSO4', { conc_M: 0.1, volume_mL: 2 });
  const s = JSON.parse(JSON.stringify(chem.serialize(v)));
  const w = chem.deserialize(s);
  near(chem.get(w, 'Cu^2+', 'aq'), 2e-4, 1e-12);
});
