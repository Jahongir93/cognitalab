// Ma'lumotlar testi: barcha tajriba yozuvlari validatordan o'tadi va dvigatel natijasi yozuvdagi bilan mos keladi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDB, loadReactions } from '../engine/load.mjs';
import { Chemistry } from '../../frontend/lab/js/engine/chemistry.js';
import { validateAll, CATEGORIES } from '../../tools/lib/validate.mjs';
import { checkReaction } from '../../tools/lib/consistency.mjs';

const db = loadDB({ withReactions: true });
const reactions = loadReactions();

test('katalog: kamida 1000 ta yozuv va har bir toifa maqsadga yetgan', () => {
  assert.ok(reactions.length >= 1000, `yozuvlar soni: ${reactions.length}`);
  const by = {};
  for (const r of reactions) by[r.category] = (by[r.category] || 0) + 1;
  for (const c of CATEGORIES) assert.ok((by[c.id] || 0) >= c.target, `${c.id}: ${by[c.id] || 0} / ${c.target}`);
});

test('validator: xatosiz', () => {
  const { results } = validateAll(db, reactions, {});
  const bad = results.filter((r) => r.errors.length).map((r) => `${r.id}: ${r.errors[0]}`);
  assert.deepEqual(bad, []);
});

test('moddalar bazasi: kamida 350 ta modda', () => {
  assert.ok(Object.keys(db.substances).length >= 350);
});

test('muvofiqlik: dvigatel har bir tajribani yozuvdagidek bajaradi', () => {
  const fails = [];
  for (const r of reactions) {
    const res = checkReaction(new Chemistry(db), r);
    if (!res.ok) fails.push(`${r.id}: ${res.problems.join('; ')}`);
  }
  assert.deepEqual(fails, []);
});
