// platform/api.js — localStorage zaxira rejimi (backendsiz)
import { test } from 'node:test';
import assert from 'node:assert/strict';

class FakeStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
  clear() { this.map.clear(); }
  key(i) { return [...this.map.keys()][i] ?? null; }
  get length() { return this.map.size; }
}

const fakeLS = new FakeStorage();
Object.defineProperty(globalThis, 'localStorage', { value: fakeLS, configurable: true, writable: true });

const mod = await import('../../frontend/lab/js/platform/api.js');
const { api, createApi, resolveApiBase, STORAGE_PREFIX } = mod;
const EXP = 'metall-kislota-0003';
const STATE = { version: 1, items: [{ id: 'beaker-1' }] };

test('singleton: manzil yo\'q — local rejim', async () => {
  assert.equal(await api.ready, 'local');
  assert.equal(api.mode, 'local');
  const me = await api.me();
  assert.equal(me.id, 'local');
  assert.equal(me.coins, null);
});

test('stol holatlari: saqlash, ro\'yxat, o\'qish, o\'chirish', async () => {
  await api.saveState('slot1', 'Birinchi', STATE);
  await api.saveState('slot2', 'Ikkinchi', { version: 1, items: [] });
  const list = await api.listStates();
  assert.deepEqual(list.map((s) => s.slot).sort(), ['slot1', 'slot2']);
  assert.ok(list[0].updated_at && !('state' in list[0]));
  const got = await api.getState('slot1');
  assert.deepEqual(got.state, STATE);
  assert.equal(got.name, 'Birinchi');
  assert.ok(fakeLS.getItem(STORAGE_PREFIX + 'states'), 'localStorage\'ga yozilgan');
  await api.deleteState('slot1');
  await assert.rejects(api.getState('slot1'), (e) => e.status === 404 && /topilmadi/.test(e.message));
  await assert.rejects(api.deleteState('slot1'), /topilmadi/);
});

test('stol holati validatsiyasi', async () => {
  await assert.rejects(api.saveState('s', 'x', { items: [] }), /version/);
  await assert.rejects(api.saveState('s', 'x', { version: 1 }), /items/);
  await assert.rejects(api.saveState('yomon slot', 'x', STATE), /slot/);
  await assert.rejects(api.saveState('s', '', STATE), /nomi/);
  const big = { version: 1, items: Array(1100).fill('x'.repeat(1000)) };
  await assert.rejects(api.saveState('s', 'katta', big), (e) => e.status === 413);
});

test('jurnal: qo\'shish, limit, tozalash', async () => {
  await api.clearJournal();
  const r = await api.appendJournal([
    { t: 1, kind: 'action', text: 'Suv quyildi' },
    { t: 2, kind: 'reaction', text: 'Gaz ajraldi', experiment_id: EXP, equation: 'Zn + 2HCl → ZnCl2 + H2↑' },
  ]);
  assert.deepEqual(r, { ok: true, added: 2, total: 2 });
  await api.appendJournal([{ t: 3, kind: 'note', text: 'Uch' }]);
  assert.deepEqual((await api.getJournal()).map((e) => e.text), ['Suv quyildi', 'Gaz ajraldi', 'Uch']);
  assert.deepEqual((await api.getJournal(2)).map((e) => e.t), [2, 3]);
  await assert.rejects(api.appendJournal([{ t: 1, text: 'kind yo\'q' }]), /noto'g'ri/);
  await assert.rejects(api.appendJournal([{ t: 1, kind: 'a', text: 'x', experiment_id: 'BAD' }]), /identifikator/);
  assert.equal((await api.clearJournal()).deleted, 3);
  assert.deepEqual(await api.getJournal(), []);
});

test('taraqqiyot: eng yaxshi ball va urinishlar', async () => {
  assert.deepEqual(await api.getProgress(), {});
  await api.saveProgress(EXP, false, 40);
  await api.saveProgress(EXP, true, 90);
  const last = await api.saveProgress(EXP, false, 70);
  assert.equal(last.experiment_id, EXP);
  const p = (await api.getProgress())[EXP];
  assert.equal(p.completed, true);
  assert.equal(p.best_score, 90);
  assert.equal(p.attempts, 3);
  await assert.rejects(api.saveProgress(EXP, true, 101), /Ball/);
  await assert.rejects(api.saveProgress('Yomon', true, 5), /identifikator/);
  await api.saveProgress("oksidlanish-qaytarilish-0012", true, 5);
});

test('startExperiment local rejimda doim ok, 0 tanga', async () => {
  assert.deepEqual(await api.startExperiment(EXP), { ok: true, coins: null, charged: 0 });
});

test('ma\'lumot yangi nusxada ham saqlanadi (localStorage)', async () => {
  const other = createApi({ base: null });
  await other.ready;
  assert.equal((await other.getProgress())[EXP].best_score, 90);
});

test('localStorage ishlamasa — xotira zaxirasi', async () => {
  const broken = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('SecurityError'); },
    removeItem() { throw new Error('SecurityError'); },
  };
  const a = createApi({ base: null, storage: broken });
  await a.saveState('m', 'Xotira', STATE);
  assert.deepEqual((await a.getState('m')).state, STATE);
  const b = createApi({ base: null, storage: null });
  await b.appendJournal([{ t: 1, kind: 'note', text: 'x' }]);
  assert.equal((await b.getJournal()).length, 1);
});

test('backend javob bermasa local rejimga o\'tadi', async () => {
  const a = createApi({ base: 'http://127.0.0.1:9', fetch: () => Promise.reject(new TypeError('net')) });
  assert.equal(await a.ready, 'local');
  const hang = createApi({ base: 'http://x', fetch: () => new Promise(() => {}), probeTimeout: 50 });
  assert.equal(await hang.ready, 'local');
  const bad = createApi({ base: 'http://x', fetch: async () => ({ ok: false, status: 404, json: async () => ({}) }) });
  assert.equal(await bad.ready, 'local');
});

test('backend rejimi: so\'rovlar va o\'zbekcha xatolar', async () => {
  const calls = [];
  const fetch = async (url, init = {}) => {
    calls.push([init.method || 'GET', url, init.credentials, init.body]);
    if (url.endsWith('/api/health')) return { ok: true, status: 200, json: async () => ({ ok: true }) };
    if (url.includes('/start')) return { ok: false, status: 402, json: async () => ({ detail: 'Tanga yetarli emas: tajriba narxi 5, balansingizda 0.' }) };
    return { ok: true, status: 200, json: async () => ({ id: 'u1', name: 'A', coins: 3 }) };
  };
  const b = createApi({ base: 'https://cognita.uz/lab', fetch });
  assert.equal(await b.ready, 'backend');
  assert.equal(b.mode, 'backend');
  assert.equal((await b.me()).coins, 3);
  await b.saveProgress(EXP, true, 50);
  await assert.rejects(b.startExperiment(EXP), (e) => e.status === 402 && e.code === 'insufficient_coins' && /Tanga/.test(e.message));
  assert.ok(calls.every((c) => c[2] === 'include'));
  assert.deepEqual(calls[2].slice(0, 2), ['POST', 'https://cognita.uz/lab/api/progress']);
  const down = createApi({ base: 'https://x', fetch: async (u) => {
    if (u.endsWith('/api/health')) return { ok: true, status: 200, json: async () => ({ ok: true }) };
    throw new TypeError('fail');
  } });
  await assert.rejects(down.getProgress(), /aloqa yo'q/);
});

test('resolveApiBase: global, meta, URL parametri', () => {
  assert.equal(resolveApiBase({}), null);
  assert.equal(resolveApiBase({ COGNITA_LAB_API: 'https://a.uz/lab/' }), 'https://a.uz/lab');
  const document = { querySelector: () => ({ getAttribute: () => '/lab' }) };
  const location = { href: 'https://cognita.uz/kurs/', search: '' };
  assert.equal(resolveApiBase({ document, location }), 'https://cognita.uz/lab');
  assert.equal(resolveApiBase({ location: { href: 'http://localhost:8000/lab/?api=/lab', search: '?api=/lab' } }), 'http://localhost:8000/lab');
});
