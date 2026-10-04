// Platforma adapteri: frontendning backend bilan gaplashadigan YAGONA joyi.
//
// Backend manzili (birinchi topilgani):
//   1) window.COGNITA_LAB_API = 'https://cognita.uz/lab'
//   2) <meta name="cognita-lab-api" content="/lab">
//   3) URL parametri ?api=/lab
// Manzil berilmagan bo'lsa yoki {base}/api/health ~1.5 s ichida javob bermasa —
// "local" rejim: hamma narsa localStorage'da ('cognita-lab:' prefiksi), u ham yopiq
// bo'lsa — xotirada (sahifa yopilguncha).
//
//   import { api } from './platform/api.js';
//   await api.ready; api.mode; // 'backend' | 'local'
//   await api.saveProgress('metall-kislota-0003', true, 90);

export const STORAGE_PREFIX = 'cognita-lab:';
const PROBE_TIMEOUT_MS = 1500;
const MAX_STATE_BYTES = 1_000_000;
const MAX_JOURNAL = 5000;
const SLOT_RE = /^[A-Za-z0-9_-]{1,64}$/;
const EXPERIMENT_ID_RE = /^[a-z0-9'-]+-\d{4}$/;

// ---------------------------------------------------------------------------
// Xavfsiz saqlash (localStorage -> xotira)
// ---------------------------------------------------------------------------

function makeStorage(backing) {
  const mem = new Map();
  const ls = (() => {
    try {
      const s = backing !== undefined ? backing : globalThis.localStorage;
      if (!s) return null;
      const probe = STORAGE_PREFIX + '__probe__';
      s.setItem(probe, '1');
      s.removeItem(probe);
      return s;
    } catch {
      return null;
    }
  })();
  return {
    persistent: !!ls,
    get(key, fallback) {
      const k = STORAGE_PREFIX + key;
      let raw = null;
      if (mem.has(k)) raw = mem.get(k);
      else if (ls) {
        try { raw = ls.getItem(k); } catch { raw = null; }
      }
      if (raw == null) return fallback;
      try { return JSON.parse(raw); } catch { return fallback; }
    },
    set(key, value) {
      const k = STORAGE_PREFIX + key;
      const raw = JSON.stringify(value);
      if (ls) {
        try {
          ls.setItem(k, raw);
          mem.delete(k);
          return;
        } catch { /* to'lgan yoki yopiq — xotiraga */ }
      }
      mem.set(k, raw);
    },
    remove(key) {
      const k = STORAGE_PREFIX + key;
      mem.delete(k);
      if (ls) {
        try { ls.removeItem(k); } catch { /* e'tiborsiz */ }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Yordamchilar
// ---------------------------------------------------------------------------

function labError(message, status = 0, code = '') {
  const err = new Error(message);
  err.status = status;
  if (code) err.code = code;
  return err;
}

const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');

function checkSlot(slot) {
  if (!SLOT_RE.test(String(slot ?? ''))) {
    throw labError("Noto'g'ri slot nomi (faqat lotin harflari, raqamlar, '-' va '_', 64 belgigacha)", 422);
  }
  return String(slot);
}

function checkExperimentId(id) {
  if (typeof id !== 'string' || !EXPERIMENT_ID_RE.test(id) || id.length > 120) {
    throw labError("Noto'g'ri tajriba identifikatori", 422);
  }
  return id;
}

function checkState(name, state) {
  if (typeof name !== 'string' || !name.trim() || name.length > 120) {
    throw labError("Holat nomi bo'sh bo'lmasin (120 belgigacha)", 422);
  }
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw labError("Holat obyekt bo'lishi kerak", 422);
  }
  if (!('version' in state)) throw labError("Holatda 'version' maydoni yo'q", 422);
  if (!Array.isArray(state.items)) throw labError("Holatda 'items' ro'yxati bo'lishi kerak", 422);
  const bytes = new TextEncoder().encode(JSON.stringify(state)).length;
  if (bytes > MAX_STATE_BYTES) throw labError('Holat juda katta (1 MB dan oshmasin)', 413);
}

function checkScore(score) {
  const n = Number(score);
  if (!Number.isInteger(n) || n < 0 || n > 100) throw labError("Ball 0 dan 100 gacha butun son bo'lishi kerak", 422);
  return n;
}

const STATUS_MESSAGES = {
  400: "So'rov noto'g'ri",
  401: 'Tizimga kiring',
  402: 'Tanga yetarli emas',
  403: "Bu amalga ruxsat yo'q",
  404: 'Topilmadi',
  413: "Ma'lumot juda katta",
  422: "Ma'lumot noto'g'ri",
  429: "Juda ko'p so'rov, birozdan keyin urinib ko'ring",
};

function statusMessage(status) {
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status >= 500) return 'Serverda xatolik yuz berdi';
  return `Server xatosi (${status})`;
}

/** Konfiguratsiyadan backend manzilini topadi (topilmasa null). */
export function resolveApiBase(env = globalThis) {
  let base = null;
  try {
    const win = env.window ?? env;
    if (typeof win.COGNITA_LAB_API === 'string' && win.COGNITA_LAB_API.trim()) base = win.COGNITA_LAB_API;
    const doc = env.document ?? win.document;
    if (!base && doc?.querySelector) {
      const meta = doc.querySelector('meta[name="cognita-lab-api"]');
      const c = meta?.getAttribute('content');
      if (c && c.trim()) base = c;
    }
    const loc = env.location ?? win.location;
    if (!base && loc?.search) {
      const p = new URLSearchParams(loc.search).get('api');
      if (p && p.trim()) base = p;
    }
    if (!base) return null;
    base = base.trim();
    if (loc?.href) base = new URL(base, loc.href).href;
    return base.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class LabApi {
  /**
   * @param {object} [opts]
   * @param {string|null} [opts.base]   backend manzili; berilmasa resolveApiBase()
   * @param {Storage|null} [opts.storage] localStorage o'rnini bosuvchi (testlar uchun)
   * @param {Function} [opts.fetch]
   * @param {number} [opts.probeTimeout]
   */
  constructor(opts = {}) {
    this._base = opts.base !== undefined ? opts.base : resolveApiBase();
    this._fetch = opts.fetch ?? (typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : null);
    this._probeTimeout = opts.probeTimeout ?? PROBE_TIMEOUT_MS;
    this._store = makeStorage(opts.storage);
    this._mode = 'local';
    this.ready = this._init();
  }

  get mode() { return this._mode; }
  get base() { return this._mode === 'backend' ? this._base : null; }

  async _init() {
    if (!this._base || !this._fetch) return this._mode;
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    let timer;
    try {
      const timeout = new Promise((_, rej) => {
        timer = setTimeout(() => { ctrl?.abort(); rej(new Error('timeout')); }, this._probeTimeout);
      });
      const res = await Promise.race([
        this._fetch(this._base + '/api/health', { credentials: 'include', signal: ctrl?.signal }),
        timeout,
      ]);
      if (res && res.ok) {
        const body = await res.json().catch(() => null);
        if (body && body.ok) this._mode = 'backend';
      }
    } catch {
      this._mode = 'local';
    } finally {
      clearTimeout(timer);
    }
    return this._mode;
  }

  async _req(method, path, body) {
    let res;
    try {
      const init = { method, credentials: 'include', headers: { Accept: 'application/json' } };
      if (body !== undefined) {
        init.headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(body);
      }
      res = await this._fetch(this._base + path, init);
    } catch {
      throw labError("Server bilan aloqa yo'q. Internetni tekshiring.", 0, 'network');
    }
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) {
      const detail = data && typeof data.detail === 'string' ? data.detail : statusMessage(res.status);
      throw labError(detail, res.status, res.status === 402 ? 'insufficient_coins' : '');
    }
    return data;
  }

  async _ready() {
    await this.ready;
    return this._mode === 'backend';
  }

  // --- foydalanuvchi ---
  async me() {
    if (await this._ready()) return this._req('GET', '/api/me');
    return { id: 'local', name: 'Mehmon', coins: null };
  }

  // --- stol holatlari ---
  async listStates() {
    if (await this._ready()) return this._req('GET', '/api/states');
    const all = this._store.get('states', {});
    return Object.values(all)
      .map(({ slot, name, updated_at }) => ({ slot, name, updated_at }))
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : a.slot.localeCompare(b.slot)));
  }

  async getState(slot) {
    checkSlot(slot);
    if (await this._ready()) return this._req('GET', `/api/states/${encodeURIComponent(slot)}`);
    const item = this._store.get('states', {})[slot];
    if (!item) throw labError('Saqlangan holat topilmadi', 404);
    return item;
  }

  async saveState(slot, name, state) {
    checkSlot(slot);
    checkState(name, state);
    if (await this._ready()) return this._req('PUT', `/api/states/${encodeURIComponent(slot)}`, { name, state });
    const all = this._store.get('states', {});
    const updated_at = nowIso();
    all[slot] = { slot, name, state: JSON.parse(JSON.stringify(state)), updated_at };
    this._store.set('states', all);
    return { slot, name, updated_at };
  }

  async deleteState(slot) {
    checkSlot(slot);
    if (await this._ready()) return this._req('DELETE', `/api/states/${encodeURIComponent(slot)}`);
    const all = this._store.get('states', {});
    if (!all[slot]) throw labError('Saqlangan holat topilmadi', 404);
    delete all[slot];
    this._store.set('states', all);
    return { ok: true };
  }

  // --- jurnal ---
  async getJournal(limit = 200) {
    const n = Math.max(1, Math.min(MAX_JOURNAL, Math.floor(Number(limit) || 200)));
    if (await this._ready()) return this._req('GET', `/api/journal?limit=${n}`);
    return this._store.get('journal', []).slice(-n);
  }

  async appendJournal(entries) {
    if (!Array.isArray(entries)) throw labError("Jurnal yozuvlari ro'yxat bo'lishi kerak", 422);
    const clean = entries.map((e) => {
      if (!e || typeof e.kind !== 'string' || !e.kind || typeof e.text !== 'string' || e.t == null) {
        throw labError("Jurnal yozuvi noto'g'ri (t, kind, text kerak)", 422);
      }
      const out = { t: e.t, kind: e.kind, text: e.text };
      if (e.experiment_id != null) out.experiment_id = checkExperimentId(e.experiment_id);
      if (e.equation != null) out.equation = String(e.equation);
      return out;
    });
    if (await this._ready()) return this._req('POST', '/api/journal', { entries: clean });
    const all = this._store.get('journal', []).concat(clean).slice(-MAX_JOURNAL);
    this._store.set('journal', all);
    return { ok: true, added: clean.length, total: all.length };
  }

  async clearJournal() {
    if (await this._ready()) return this._req('DELETE', '/api/journal');
    const deleted = this._store.get('journal', []).length;
    this._store.remove('journal');
    return { ok: true, deleted };
  }

  // --- taraqqiyot ---
  async getProgress() {
    if (await this._ready()) return this._req('GET', '/api/progress');
    return this._store.get('progress', {});
  }

  async saveProgress(experiment_id, completed, score) {
    checkExperimentId(experiment_id);
    const s = checkScore(score);
    const done = !!completed;
    if (await this._ready()) {
      return this._req('POST', '/api/progress', { experiment_id, completed: done, score: s });
    }
    const all = this._store.get('progress', {});
    const prev = all[experiment_id] || { completed: false, best_score: 0, attempts: 0 };
    const rec = {
      completed: prev.completed || done,
      best_score: Math.max(prev.best_score, s),
      attempts: prev.attempts + 1,
      updated_at: nowIso(),
    };
    all[experiment_id] = rec;
    this._store.set('progress', all);
    return { experiment_id, ...rec };
  }

  // --- pullik amal ---
  async startExperiment(experiment_id) {
    checkExperimentId(experiment_id);
    if (await this._ready()) {
      return this._req('POST', `/api/experiments/${encodeURIComponent(experiment_id)}/start`);
    }
    return { ok: true, coins: null, charged: 0 };
  }
}

export function createApi(opts) {
  return new LabApi(opts);
}

/** Ilova bo'ylab yagona nusxa. */
export const api = new LabApi();
export default api;
