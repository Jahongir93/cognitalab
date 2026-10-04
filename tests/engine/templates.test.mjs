// Tayyor asbob andozalari: ma'lumot to'g'riligi, avtomatik yig'ish (soxta stol — faqat ApparatusGraph),
// gaz yo'li va qo'lda yig'ish ro'yxatining tekshiruvi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ApparatusGraph } from '../../frontend/lab/js/engine/apparatus.js';
import { assembleTemplate, checkAssembly, missingItems } from '../../frontend/lab/js/lab/templates.js';
import { DATA } from './load.mjs';

const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const eq = read('equipment.json');
const ports = read('ports.json');
const subs = read('substances.json');
const { templates } = read('templates.json');
const defs = new Map(eq.items.map((d) => [d.id, d]));

/** Soxta stol: Bench interfeysining mantiqiy qismi (Three.js'siz) */
class FakeBench {
  constructor() { this.graph = new ApparatusGraph(ports); this.items = new Map(); this.seq = 1; }
  def(id) { return defs.get(id); }
  add(defId, o = {}) {
    const def = this.def(defId);
    if (!def) throw new Error(`Jihoz topilmadi: ${defId}`);
    const size = (o.sizeId && def.sizes.find((s) => s.id === String(o.sizeId))) || def.sizes[0];
    const id = `${defId}#${this.seq++}`;
    const item = { id, def, size, reagent: o.reagent || null, flags: {}, pos: [o.x, o.z] };
    this.graph.addNode(id, def, size);
    this.items.set(id, item);
    return item;
  }
  fillReagent(item, r) { item.reagent = r; }
  connect(a, pa, b, pb) { return this.graph.connect(a.id, pa, b.id, pb); }
}

const reagents = (it) => (Array.isArray(it.reagent) ? it.reagent : it.reagent ? [it.reagent] : []);

test("andozalar soni 16 ta, id'lar takrorlanmaydi", () => {
  assert.equal(templates.length, 16);
  assert.equal(new Set(templates.map((t) => t.id)).size, 16);
});

for (const t of templates) {
  test(`andoza «${t.id}»: jihozlar, o'lchamlar, portlar va reaktivlar mavjud`, () => {
    assert.ok(t.name_uz && t.purpose_uz, 'nom va maqsad');
    assert.ok(t.notes_uz?.length && t.safety_uz?.length, 'izoh va xavfsizlik');
    const keys = new Set();
    for (const it of t.items) {
      assert.ok(!keys.has(it.key), `takroriy kalit ${it.key}`);
      keys.add(it.key);
      const d = defs.get(it.def);
      assert.ok(d, `jihoz yo'q: ${it.def}`);
      assert.ok(d.sizes.some((s) => s.id === it.size), `${it.def}: o'lcham yo'q ${it.size}`);
      assert.equal(it.pos.length, 2);
      for (const r of reagents(it)) {
        const s = subs[r.id];
        assert.ok(s, `modda yo'q: ${r.id}`);
        if (r.conc_M !== undefined && s.solutions) assert.ok(s.solutions.some((x) => x.conc_M === r.conc_M), `${r.id}: ${r.conc_M} M eritma ro'yxatda yo'q`);
      }
    }
    const item = new Map(t.items.map((i) => [i.key, i]));
    const portOf = (key, p) => defs.get(item.get(key).def).sizes.find((s) => s.id === item.get(key).size).ports.find((x) => x.id === p);
    t.connections.forEach((c, i) => {
      assert.ok(item.has(c.a) && item.has(c.b), `ulanish ${i}: kalit yo'q`);
      assert.ok(portOf(c.a, c.pa), `ulanish ${i}: ${c.a}.${c.pa} port yo'q`);
      assert.ok(portOf(c.b, c.pb), `ulanish ${i}: ${c.b}.${c.pb} port yo'q`);
    });
    // har bir ulanish va har bir qadam tekshiruvi bir-biriga bog'langan
    const covered = new Set();
    for (const s of t.steps_uz) {
      assert.ok(s.text_uz, 'qadam matni');
      const conns = [...(s.check.connections || []), ...(s.check.connection !== undefined ? [s.check.connection] : [])];
      const its = [...(s.check.items || []), ...(s.check.item !== undefined ? [s.check.item] : [])];
      assert.ok(conns.length + its.length > 0, `bo'sh tekshiruv: ${s.text_uz}`);
      for (const i of conns) { assert.ok(t.connections[i], `qadamdagi ulanish ${i} yo'q`); covered.add(i); }
      for (const k of its) assert.ok(item.has(k), `qadamdagi kalit ${k} yo'q`);
    }
    t.connections.forEach((_, i) => assert.ok(covered.has(i), `ulanish ${i} hech bir qadamda tekshirilmaydi`));
  });

  test(`andoza «${t.id}»: avtomatik yig'ish xatosiz, gaz yo'li kutilganidek`, () => {
    const bench = new FakeBench();
    const { items, errors } = assembleTemplate(bench, t, { anchor: { x: 0.1, z: -0.2 } });
    assert.deepEqual(errors, []);
    assert.equal(items.size, t.items.length);
    // tartib: b jihozi a ning portiga ko'chadi, shuning uchun b ilgari boshqa jihozga biriktirilmagan bo'lishi kerak
    // (egiluvchan shlang/simlar ko'chmaydi; faqat graf qirrasi kerak bo'lsa — move:false)
    const placed = new Set();
    const flexible = (key) => defs.get(t.items.find((x) => x.key === key).def).flexible;
    t.connections.forEach((c, i) => {
      if (c.move === false || flexible(c.a) || flexible(c.b)) return;
      assert.ok(!placed.has(c.b), `ulanish ${i}: ${c.b} allaqachon boshqa jihozga biriktirilgan (move:false kerak)`);
      placed.add(c.b);
    });
    const exp = t.gas_route_expect;
    if (!exp) return;
    const src = items.get(exp.source);
    const route = bench.graph.gasRoute(src.id);
    assert.equal(route.sealed, exp.sealed ?? false);
    const keyOf = new Map([...items].map(([k, v]) => [v.id, k]));
    const got = route.exits.filter((x) => x.type !== 'yopiq').map((x) => `${x.type}:${keyOf.get(x.node) ?? ''}`).sort();
    const want = exp.exits.map((x) => `${x.type}:${x.node ?? ''}`).sort();
    assert.deepEqual(got, want);
    if (exp.condenser) {
      const ex = route.exits.find((x) => x.type !== 'yopiq');
      assert.ok(bench.graph.hasCondenser(ex.path) || ex.condenser, "yo'lda sovutgich bo'lishi kerak");
    }
  });

  test(`andoza «${t.id}»: qo'lda yig'ish ro'yxati (bo'sh stol — hech biri, to'liq — hammasi)`, () => {
    const empty = new FakeBench();
    const st0 = checkAssembly(empty, t);
    assert.equal(st0.length, t.steps_uz.length);
    assert.ok(st0.every((s) => !s.done && s.hint_uz), "bo'sh stolda hech bir qadam bajarilmagan");
    assert.equal(missingItems(empty, t).length, t.items.length);

    const bench = new FakeBench();
    assembleTemplate(bench, t);
    const st = checkAssembly(bench, t);
    assert.ok(st.every((s) => s.done), st.filter((s) => !s.done).map((s) => s.text_uz).join('; '));
    assert.deepEqual(missingItems(bench, t), []);
  });

  test(`andoza «${t.id}»: qo'lda — boshqa tartibda, teskari yo'nalishda va ortiqcha jihozlar bilan yig'ilsa ham tan olinadi`, () => {
    const bench = new FakeBench();
    // chalg'ituvchi jihozlar (bir xil turdagi, ulanmagan)
    for (const it of t.items.slice(0, 3)) bench.add(it.def, { sizeId: it.size });
    const ids = new Map();
    for (const it of [...t.items].reverse()) {
      const r = reagents(it)[0];
      ids.set(it.key, bench.add(it.def, { sizeId: it.size, reagent: r }).id);
    }
    for (const c of [...t.connections].reverse()) {
      const r = bench.graph.connect(ids.get(c.b), c.pb, ids.get(c.a), c.pa);
      assert.ok(r.ok, r.reason);
    }
    const st = checkAssembly(bench, t);
    assert.ok(st.every((s) => s.done), st.filter((s) => !s.done).map((s) => s.text_uz).join('; '));
  });
}

test("qo'lda: shlang uchlari almashtirilsa ham to'g'ri, Dreksel teskari ulansa — xato", () => {
  const t = templates.find((x) => x.id === 'gaz-yuvish-quritish');
  const swap = { a: 'b', b: 'a', kirish: 'chiqish', chiqish: 'kirish' };
  const build = (swapHoses, swapDreksel) => {
    const bench = new FakeBench();
    const ids = new Map(t.items.map((it) => [it.key, bench.add(it.def, { sizeId: it.size, reagent: reagents(it)[0] }).id]));
    for (const c of t.connections) {
      const fix = (key, p) => {
        const d = t.items.find((i) => i.key === key).def;
        if (swapHoses && d === 'rezina-shlang') return swap[p];
        if (swapDreksel && d === 'dreksel-sklyankasi' && key === 'dr1') return swap[p];
        return p;
      };
      assert.ok(bench.graph.connect(ids.get(c.a), fix(c.a, c.pa), ids.get(c.b), fix(c.b, c.pb)).ok);
    }
    return checkAssembly(bench, t);
  };
  assert.ok(build(true, false).every((s) => s.done));
  const bad = build(false, true);
  assert.equal(bad.find((s) => s.index === 2).done, false, 'Dreksel kirishi teskari — qadam bajarilmagan');
  assert.ok(bad.find((s) => s.index === 2).hint_uz.length > 0);
});

test("qisman yig'ilgan: yetishmayotgan jihoz va bajarilmagan qadam ko'rsatiladi", () => {
  const t = templates.find((x) => x.id === 'oddiy-filtrlash');
  const bench = new FakeBench();
  const sht = bench.add('shtativ'), m = bench.add('mufta'), h = bench.add('shtativ-halqasi'), v = bench.add('oddiy-voronka');
  bench.connect(sht, 'ustun', m, 'teshik');
  bench.connect(m, 'ilgak', h, 'dasta');
  bench.connect(h, 'halqa', v, 'konus');
  const st = checkAssembly(bench, t);
  assert.deepEqual(st.map((s) => s.done), [true, true, false, false, false]);
  assert.match(st[2].hint_uz, /Filtr qog'oz/);
  assert.deepEqual(missingItems(bench, t).map((x) => x.key).sort(), ['ara', 'filtr', 'stk', 'tay']);
});

test("og'izga faqat termometr/naycha tushirilgan stakan germetik emas; soat oynasi qopqog'i ham", () => {
  const g = new ApparatusGraph(ports);
  const add = (id, defId, sz) => { const d = defs.get(defId); g.addNode(id, d, sz ? d.sizes.find((s) => s.id === sz) : d.sizes[0]); };
  add('s', 'kimyoviy-stakan', '100');
  add('t', 'termometr');
  add('o', 'soat-oynasi');
  assert.ok(g.connect('s', 'ogiz', 't', 'uchi').ok);
  let r = g.gasRoute('s');
  assert.equal(r.sealed, false);
  assert.equal(r.exits.filter((x) => x.type === 'havo').length, 1);
  assert.ok(g.connect('s', 'ogiz', 'o', 'qopqoq').ok, "stakan og'zi bir nechta narsani qabul qiladi");
  r = g.gasRoute('s');
  assert.equal(r.sealed, false);
  assert.ok(r.exits.some((x) => x.type === 'havo' && x.cover && x.node === 'o'));
});
