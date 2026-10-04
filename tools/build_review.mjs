// Kimyogar tekshiruvi uchun jadval: review/reactions_review.csv (UTF-8, BOM bilan — Excel to'g'ri ochadi).
// Avval "o'rta" ishonchli yozuvlar, keyin qolganlari. Oxirgi ikki ustun tekshiruvchi uchun bo'sh qoldiriladi.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadReactions } from '../tests/engine/load.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const reactions = loadReactions();
const cell = (v) => {
  const s = v === null || v === undefined ? '' : (typeof v === 'string' ? v : JSON.stringify(v));
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const cond = (c = {}) => [
  c.heating ? 'qizdirish' : null, c.temp_min_C ? `≥${c.temp_min_C}°C` : null, c.temp_max_C ? `≤${c.temp_max_C}°C` : null,
  c.catalyst ? `katalizator: ${[].concat(c.catalyst).join(', ')}` : null, c.medium ? `muhit: ${c.medium}` : null,
  c.light ? "yorug'lik" : null, c.ignition ? 'yondirish' : null, c.electricity ? 'elektr toki' : null, c.note_uz || null,
].filter(Boolean).join('; ');
const reactants = (r) => (r.reactants || []).map((x) => `${x.species}${x.state ? `(${x.state})` : ''}${x.conc_M ? ` ${x.conc_M}M` : ''}${x.conc_min_M ? ` ≥${x.conc_min_M}M` : ''}${x.form ? ` ${x.form}` : ''}`).join(' + ');

const head = ['id', 'toifa', 'nomi', 'ishonch', 'sinf', 'dvigatel', 'reaktivlar', 'sharoit', 'molekulyar tenglama', "qisqartirilgan ionli tenglama", 'kuzatish', "cho'kma", 'gaz', 'issiqlik', 'kinetika', 'reaksiya ketmaydi', 'tushuntirish', 'tekshiruvchi xulosasi (to\'g\'ri / xato / tuzatish)', 'izoh'];
const sorted = [...reactions].sort((a, b) => (a.confidence === "o'rta" ? 0 : 1) - (b.confidence === "o'rta" ? 0 : 1) || a.id.localeCompare(b.id));
const rows = [head.map(cell).join(',')];
for (const r of sorted) {
  const o = r.observations || {};
  rows.push([
    r.id, r.category, r.title_uz, r.confidence, r.level, r.engine, reactants(r), cond(r.conditions),
    r.equation?.molecular, r.equation?.ionic_net, o.text_uz,
    o.precipitate ? `${o.precipitate.species} ${o.precipitate.color || ''} ${o.precipitate.texture || ''}`.trim() : '',
    o.gas ? `${o.gas.species || ''} ${o.gas.color || ''}`.trim() : '',
    o.heat, r.kinetics, r.no_reaction ? 'ha' : '', r.explanation_uz, '', '',
  ].map(cell).join(','));
}
mkdirSync(join(ROOT, 'review'), { recursive: true });
const out = join(ROOT, 'review', 'reactions_review.csv');
writeFileSync(out, '﻿' + rows.join('\r\n') + '\r\n');
const mid = reactions.filter((r) => r.confidence === "o'rta").length;
console.log(`${out}: ${reactions.length} ta yozuv (o'rta: ${mid}, yuqori: ${reactions.length - mid})`);
