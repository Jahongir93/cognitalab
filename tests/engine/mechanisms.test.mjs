// mechanisms.json andozalarini tekshirish: 16 ta andoza, strelkalar mavjud atomlarga ishora qiladi,
// har bir organik yozuvdagi andoza id'si mavjud.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA, loadReactions } from './load.mjs';

const mech = JSON.parse(readFileSync(join(DATA, 'mechanisms.json'), 'utf8'));
const REQUIRED = ['SR', 'AdE', 'AdR', 'SN1', 'SN2', 'E1', 'E2', 'SEAr', 'AdN', 'atsil', 'aldol', 'oksidlanish', 'qaytarilish',
  'polimer-radikal', 'polimer-ion', 'polikondensatlanish'];

/** Andoza va uning variantlaridagi barcha bosqichlar */
function allSteps(tpl) {
  const out = (tpl.steps || []).map((s, i) => ({ where: `steps[${i}]`, s }));
  for (const [vid, v] of Object.entries(tpl.variants || {})) (v.steps || []).forEach((s, i) => out.push({ where: `variants.${vid}.steps[${i}]`, s }));
  return out;
}

test('mechanisms.json: barcha 16 andoza mavjud va to\'liq', () => {
  for (const id of REQUIRED) {
    const t = mech.templates[id];
    assert.ok(t, `andoza yo'q: ${id}`);
    assert.ok(t.name_uz && t.summary_uz, `${id}: name_uz/summary_uz`);
    assert.ok(Array.isArray(t.steps) && t.steps.length >= 2, `${id}: kamida 2 bosqich`);
    for (const { where, s } of allSteps(t)) {
      assert.ok(s.title_uz && s.text_uz, `${id}.${where}: title_uz/text_uz`);
      assert.ok(Array.isArray(s.atoms) && s.atoms.length, `${id}.${where}: atoms`);
    }
  }
});

test("mechanisms.json: strelkalar va bog'lar mavjud atomlarga ishora qiladi", () => {
  const errs = [];
  for (const [id, t] of Object.entries(mech.templates)) {
    for (const { where, s } of allSteps(t)) {
      const ids = new Set();
      for (const a of s.atoms) {
        if (ids.has(a.id)) errs.push(`${id}.${where}: takroriy atom id ${a.id}`);
        if (String(a.id).includes('-')) errs.push(`${id}.${where}: atom id'da "-" bo'lmasin (${a.id})`);
        if (typeof a.x !== 'number' || typeof a.y !== 'number') errs.push(`${id}.${where}: ${a.id} koordinatasiz`);
        ids.add(a.id);
      }
      for (const b of s.bonds || []) for (const k of [b.a, b.b]) if (!ids.has(k)) errs.push(`${id}.${where}: bog' noma'lum atomga: ${k}`);
      for (const ar of s.arrows || []) {
        for (const ref of [ar.from, ar.to]) {
          assert.ok(typeof ref === 'string' && ref, `${id}.${where}: strelka uchi bo'sh`);
          for (const part of ref.split('-')) if (!ids.has(part)) errs.push(`${id}.${where}: strelka noma'lum atomga: ${ref}`);
        }
      }
      // atomlarda ishlatilgan tokenlar andozada e'lon qilingan
      const toks = { ...(t.tokens || {}) };
      for (const v of Object.values(t.variants || {})) Object.assign(toks, v.tokens || {});
      const text = JSON.stringify([s.atoms, s.text || [], s.rxn || [], s.title_uz, s.text_uz, s.shapes || []]);
      for (const m of text.matchAll(/\{([A-Za-z][A-Za-z0-9]*)(?::[a-z0-9])?(?:\|[^{}]*)?\}/g)) {
        if (!toks[m[1]]) errs.push(`${id}.${where}: e'lon qilinmagan token {${m[1]}}`);
      }
    }
  }
  assert.deepEqual(errs, []);
});

test('reaksiya yozuvlari: organik andoza id\'lari mechanisms.json da bor', () => {
  const bad = [];
  for (const r of loadReactions()) {
    const o = r.mechanism?.organic;
    if (o && !mech.templates[o.template]) bad.push(`${r.id}: ${o.template}`);
  }
  assert.deepEqual(bad, []);
});

test('mechanism.js: formula va token yordamchilari (DOMsiz)', async () => {
  const m = await import('../../frontend/lab/js/ui/mechanism.js');
  assert.equal(m.formulaHTML('SO4^2-'), 'SO<sub>4</sub><sup>2−</sup>');
  assert.equal(m.formulaHTML('SO₄²⁻'), 'SO<sub>4</sub><sup>2−</sup>');
  assert.equal(m.formulaHTML('2KMnO4'), '2KMnO<sub>4</sub>');
  assert.equal(m.formulaHTML('<b>'), '&lt;b&gt;');
  assert.equal(m.cleanParam('OH⁻ (KOH, spirtda)'), 'OH⁻');
  assert.equal(m.cleanParam('(CH3)3C⁺'), '(CH3)3C⁺');
  const r = m.resolveTemplate(mech, { mechanism: { organic: { template: 'SN2', params: { nucleophile: 'Br⁻', leaving_group: 'H2O', substrate: 'CH3–CH2–OH2⁺' } } } });
  const val = (s) => m.substitute(s, r.tokens).map((x) => x.t).join('');
  assert.equal(val('{Nu:b}{Nu:c}'), 'Br−');
  assert.equal(val('{S:c|δ−}'), '+');
  assert.equal(val('{Xa}'), 'OH2');
  const d = m.resolveTemplate(mech, { mechanism: { organic: { template: 'SN2', params: {} } } });
  assert.equal(m.substitute('{Nu:b}', d.tokens)[0].t, 'Nu');
  const bal = m.deriveElectronBalance('Zn + CuSO4 = ZnSO4 + Cu');
  assert.deepEqual(bal.map((x) => x.kind), ['ox', 'red']);
  assert.equal(m.deriveElectronBalance('NaOH + HCl = NaCl + H2O'), null);
});
