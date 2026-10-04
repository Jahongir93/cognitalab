// Asbob grafi testlari: portlar mosligi, germetiklik, gaz yo'li, yig'ish usuli
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ApparatusGraph, collectionCheck } from '../../frontend/lab/js/engine/apparatus.js';
import { DATA } from './load.mjs';

const eq = JSON.parse(readFileSync(join(DATA, 'equipment.json'), 'utf8'));
const ports = JSON.parse(readFileSync(join(DATA, 'ports.json'), 'utf8'));
const subs = JSON.parse(readFileSync(join(DATA, 'substances.json'), 'utf8'));
const def = (id) => eq.items.find((i) => i.id === id);
function graph() { return new ApparatusGraph(ports); }
function add(g, id, defId, sizeIdx = 0) { const d = def(defId); g.addNode(id, d, d.sizes[sizeIdx]); }

test("tiqin og'izga o'lchami bo'yicha mos keladi", () => {
  const g = graph();
  add(g, 'p', 'probirka');
  add(g, 't1', 'rezina-tiqin-1-teshikli-kichik');
  add(g, 't2', 'rezina-tiqin-1-teshikli-katta');
  assert.equal(g.canConnect('p', 'ogiz', 't1', 'tiqin').ok, true);
  const bad = g.canConnect('p', 'ogiz', 't2', 'tiqin');
  assert.equal(bad.ok, false);
  assert.match(bad.reason, /o'lchami/);
});

test('shlif o\'lchamlari teng bo\'lishi kerak', () => {
  const g = graph();
  add(g, 'k', 'dumaloq-tubli-kolba');
  add(g, 's', 'libix-sovutgichi');
  add(g, 'st', 'shlif-tiqin-19-26');
  assert.equal(g.canConnect('k', 'bogiz', 's', 'kirish').ok, true);
  assert.equal(g.canConnect('k', 'bogiz', 'st', 'tiqin').ok, false);
});

test("gaz olish asbobi: probirka + tiqin + egilgan naycha -> boshqa idish", () => {
  const g = graph();
  add(g, 'p', 'probirka');
  add(g, 't', 'rezina-tiqin-1-teshikli-kichik');
  add(g, 'n', 'gaz-naycha-egilgan');
  add(g, 'q', 'probirka');
  g.connect('p', 'ogiz', 't', 'tiqin');
  g.connect('t', 'teshik1', 'n', 'a');
  let r = g.gasRoute('p');
  assert.equal(r.sealed, false);
  assert.equal(r.exits[0].type, 'havo');
  g.connect('n', 'b', 'q', 'ogiz');
  r = g.gasRoute('p');
  assert.equal(r.exits[0].type, 'idish');
  assert.equal(r.exits[0].node, 'q');
});

test("yaxlit tiqin bilan berk idish germetik (qizdirilsa bosim oshadi)", () => {
  const g = graph();
  add(g, 'p', 'probirka');
  add(g, 't', 'rezina-tiqin-yaxlit-kichik');
  g.connect('p', 'ogiz', 't', 'tiqin');
  const r = g.gasRoute('p');
  assert.equal(r.sealed, true);
});

test("suv ostida yig'ish: pnevmatik vanna va ag'darilgan silindr", () => {
  const g = graph();
  add(g, 'p', 'probirka-yon-naychali');
  add(g, 't', 'rezina-tiqin-yaxlit-orta');
  add(g, 'sh', 'rezina-shlang');
  add(g, 'n', 'gaz-naycha-egilgan');
  add(g, 'v', 'pnevmatik-vanna');
  add(g, 's', 'gaz-silindri');
  assert.equal(g.connect('p', 'ogiz', 't', 'tiqin').ok, true);
  assert.equal(g.connect('p', 'yon', 'sh', 'a').ok, true);
  g.connect('sh', 'b', 'n', 'a');
  g.connect('n', 'b', 'v', 'suv-osti');
  g.connect('s', 'ogiz', 'v', 'yiggich-joyi');
  const r = g.gasRoute('p');
  const open = r.exits.filter((e) => e.type !== 'yopiq');
  assert.equal(open.length, 1);
  assert.equal(open[0].type, 'yiggich');
  assert.equal(open[0].node, 's');
});

test("yig'ish usuli: ammiakni suv ostida yig'ib bo'lmaydi; vodorod og'zi pastga", () => {
  const nh3 = subs.NH3.gas, h2 = subs.H2.gas, co2 = subs.CO2.gas, o2 = subs.O2.gas;
  assert.equal(collectionCheck(nh3, 'suv-osti').ok, false);
  assert.equal(collectionCheck(o2, 'suv-osti').ok, true);
  assert.equal(collectionCheck(h2, 'havo-yuqoriga').ok, false);
  assert.equal(collectionCheck(h2, 'havo-pastga').ok, true);
  assert.equal(collectionCheck(co2, 'havo-yuqoriga').ok, true);
  assert.equal(collectionCheck(co2, 'havo-pastga').ok, false);
});

test('mos kelmaydigan portlar ulanmaydi', () => {
  const g = graph();
  add(g, 'a', 'kimyoviy-stakan');
  add(g, 'b', 'libix-sovutgichi');
  assert.equal(g.canConnect('a', 'ogiz', 'b', 'suv-kirish').ok, false);
});
