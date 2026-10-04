// Laboratoriya jurnali: amallar, kuzatuvlar va tenglamalar avtomatik yoziladi; chop etishga qulay ko'rinish.
import { h, clear, prettyFormula, download } from './dom.js';
import { t } from '../i18n/uz.js';

const KIND_LABEL = { amal: 'Amal', kuzatish: 'Kuzatish', reaksiya: 'Reaksiya', ogohlantirish: 'Ogohlantirish', tajriba: 'Tajriba', natija: 'Natija', xato: 'Xato' };

export class Journal {
  constructor(api) {
    this.api = api;
    this.entries = [];
    this.listeners = new Set();
    this.queue = [];
    this.flushT = null;
    api.ready?.then(() => api.getJournal(500)).then((list) => {
      if (Array.isArray(list) && list.length) { this.entries = list.concat(this.entries); this.#notify(); }
    }).catch(() => {});
  }

  add(e) {
    const last = this.entries[this.entries.length - 1];
    if (last && last.text === e.text && Date.now() - last.t < 4000) return;
    const entry = { t: Date.now(), kind: e.kind || 'amal', text: e.text, equation: e.equation || undefined, experiment_id: e.experiment_id || undefined };
    this.entries.push(entry);
    if (this.entries.length > 2000) this.entries.shift();
    this.queue.push(entry);
    clearTimeout(this.flushT);
    this.flushT = setTimeout(() => this.#flush(), 1500);
    this.#notify();
  }

  async #flush() {
    const batch = this.queue.splice(0);
    if (!batch.length) return;
    try { await this.api.appendJournal(batch); } catch { /* keyingi safar */ this.queue.unshift(...batch); }
  }

  async clear() {
    this.entries = [];
    this.queue = [];
    try { await this.api.clearJournal(); } catch { /* e'tiborsiz */ }
    this.#notify();
  }

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  #notify() { for (const f of this.listeners) f(this.entries); }

  /** Jurnal panelini chizish */
  render(container) {
    const draw = () => {
      clear(container);
      const tools = h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn small', onclick: () => this.print() }, t('journal.print')),
        h('button', { class: 'btn small', onclick: () => download(`laboratoriya-jurnali-${new Date().toISOString().slice(0, 10)}.txt`, this.asText(), 'text/plain') }, t('journal.export')),
        h('button', { class: 'btn small ghost', onclick: () => { if (confirm(`${t('journal.clear')}?`)) this.clear(); } }, t('journal.clear')));
      container.appendChild(tools);
      if (!this.entries.length) { container.appendChild(h('p', { class: 'muted' }, t('journal.empty'))); return; }
      const list = h('ol', { class: 'journal-list', reversed: true });
      for (const e of [...this.entries].reverse().slice(0, 400)) {
        list.appendChild(h('li', { class: `j-${e.kind}` },
          h('div', { class: 'j-meta' }, h('time', {}, new Date(e.t).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })), ' · ', KIND_LABEL[e.kind] || e.kind),
          h('div', {}, e.text),
          e.equation ? h('div', { class: 'eq' }, prettyFormula(e.equation)) : null));
      }
      container.appendChild(list);
    };
    draw();
    return this.onChange(draw);
  }

  asText() {
    return this.entries.map((e) => `[${new Date(e.t).toLocaleString('uz-UZ')}] ${KIND_LABEL[e.kind] || e.kind}: ${e.text}${e.equation ? `\n    ${prettyFormula(e.equation)}` : ''}`).join('\n');
  }

  /** Chop etish: alohida bosma ko'rinish */
  print() {
    let el = document.getElementById('print-journal');
    if (el) el.remove();
    el = h('div', { id: 'print-journal' },
      h('h1', {}, t('journal.title')),
      h('p', {}, `${t('journal.date')}: ${new Date().toLocaleDateString('uz-UZ')}`),
      h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Vaqt'), h('th', {}, t('journal.action')), h('th', {}, t('journal.observation')))),
        h('tbody', {}, this.entries.map((e) => h('tr', {}, h('td', {}, new Date(e.t).toLocaleTimeString('uz-UZ')), h('td', {}, KIND_LABEL[e.kind] || e.kind), h('td', {}, e.text, e.equation ? h('div', { class: 'eq' }, prettyFormula(e.equation)) : null))))));
    document.body.appendChild(el);
    document.body.classList.add('printing-journal');
    const done = () => { document.body.classList.remove('printing-journal'); el.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
  }
}
